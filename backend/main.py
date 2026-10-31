import os
import sys
from pathlib import Path
from typing import List, Optional, Dict, Any

# sys.path 등록으로 모듈 import 보장
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai.schemas import (
    BranchResponse,
    HybridWbsResponse,
    GitHubExportRequest,
    GitHubExportResponse,
)

# 💡 윤수호 역할: 경량 로컬 JSON 저장소 서비스 모듈 임포트
from app.business.services.storage_service import StorageService

app = FastAPI(
    title="POCO Workflow Engine",
    description="사용자 정의 프로젝트 기반 WBS 시각화, 로컬 JSON 영속성 및 GitHub 연동 엔진",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. 기본 WBS 요청 모델 ---
class GenerateRequest(BaseModel):
    idea: str = Field(..., description="사용자 입력 프로젝트 주제")
    team_size: int = Field(default=4, description="개발 팀원 수")
    duration_weeks: int = Field(default=8, description="개발 기간(주)")

class BranchOptionRequest(BaseModel):
    idea: str = Field(..., description="사용자 프로젝트 주제")
    parent_step_id: str = Field(..., description="기준 관문 노드 ID")
    parent_title: str = Field(..., description="기준 관문 노드 제목")
    current_week: int = Field(default=1, description="현재 주차")
    team_size: int = Field(default=4, description="팀원 수")
    selected_history: Optional[List[str]] = Field(default_factory=list, description="이전 선택 이력")

# --- 2. 💡 저장소 전용 요청 모델 ---
class ProjectSaveRequest(BaseModel):
    project_id: str = Field(..., description="프로젝트 고유 식별자 ID")
    wbs_data: Dict[str, Any] = Field(..., description="저장할 WBS 그래프/노드 데이터")


@app.get("/")
def read_root():
    return {"message": "POCO Engine API Server Running", "status": "healthy"}


# ==========================================
# 1단계: WBS 거시적 뼈대 자동 생성 API
# ==========================================
@app.post("/api/generate", response_model=HybridWbsResponse)
async def generate_hybrid_wbs(req: GenerateRequest):
    if not req.idea or not req.idea.strip():
        raise HTTPException(status_code=400, detail="프로젝트 주제를 입력해야 합니다.")
    try:
        from ai.skeleton_generator import generate_macro_skeleton
        return await generate_macro_skeleton(
            idea=req.idea.strip(),
            duration_weeks=req.duration_weeks,
            team_size=req.team_size,
        )
    except Exception as e:
        print(f"[Generate API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"WBS 생성 실패: {str(e)}")


# ==========================================
# 2단계: 필수 관문 3지선다 브랜치 생성 API
# ==========================================
@app.post("/api/branch/options", response_model=BranchResponse)
async def get_branch_options(req: BranchOptionRequest):
    if not req.idea or not req.idea.strip():
        raise HTTPException(status_code=400, detail="프로젝트 주제 정보가 필요합니다.")
    try:
        from ai.branch_generator import generate_branch_options
        return await generate_branch_options(
            idea=req.idea.strip(),
            parent_title=req.parent_title,
            parent_step_id=req.parent_step_id,
            current_week=req.current_week,
            team_size=req.team_size,
            selected_history=req.selected_history or [],
        )
    except Exception as e:
        print(f"[Branch API Error]: {e}")
        raise HTTPException(status_code=500, detail=f"3지선다 생성 실패: {str(e)}")


# ==========================================
# 3단계: 💡 로컬 JSON 파일 저장소 입출력 API (윤수호 구현 파트)
# ==========================================
@app.post("/api/storage/save")
async def save_project(req: ProjectSaveRequest):
    """프로젝트 WBS 데이터를 data/projects/{project_id}.json 파일로 안전하게 저장"""
    try:
        file_path = StorageService.save_project(req.project_id, req.wbs_data)
        return {
            "status": "success",
            "message": "프로젝트가 로컬 JSON 파일로 안전하게 저장되었습니다.",
            "project_id": req.project_id,
            "saved_path": file_path
        }
    except Exception as e:
        print(f"[Storage Save Error]: {e}")
        raise HTTPException(status_code=500, detail=f"저장 실패: {str(e)}")

@app.get("/api/storage/project/{project_id}")
async def load_project(project_id: str):
    """로컬 JSON 파일에서 특정 프로젝트 WBS 로드[cite: 1]"""
    data = StorageService.get_project(project_id)
    if not data:
        raise HTTPException(status_code=404, detail="해당 프로젝트를 찾을 수 없습니다.")
    return data

@app.get("/api/storage/projects")
async def list_all_projects():
    """저장된 모든 프로젝트 ID 목록 조회[cite: 1]"""
    try:
        projects = StorageService.list_projects()
        return {"projects": projects}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"목록 조회 실패: {str(e)}")

@app.get("/api/storage/guide/{topic}")
async def load_guide(topic: str):
    """사이드패널용 실무 가이드 템플릿(data/guides/{topic}.json) 로드[cite: 1]"""
    guide = StorageService.get_guide(topic)[cite: 1]
    if not guide:
        raise HTTPException(status_code=404, detail="해당 가이드 템플릿이 없습니다.")
    return guide


# ==========================================
# 5단계: GitHub Issues 일괄 자동 등록 API
# ==========================================
@app.post("/api/github/export", response_model=GitHubExportResponse)
async def export_issues_to_github(req: GitHubExportRequest):
    try:
        from ai.github_client import create_github_issues
        res = await create_github_issues(
            token=req.github_token,
            owner=req.repo_owner,
            repo=req.repo_name,
            nodes=req.nodes,
        )
        if not res.success and len(req.nodes) > 0:
            raise HTTPException(status_code=400, detail="GitHub 이슈 생성에 실패했습니다. 토큰 및 레포지토리 경로를 확인하세요.")
        return res
    except Exception as e:
        print(f"[GitHub Export Error]: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)