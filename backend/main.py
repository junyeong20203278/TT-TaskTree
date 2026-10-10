import os
import sys
from pathlib import Path

# sys.path 등록으로 ai 모듈 import 보장
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ai.schemas import (
    BranchResponse,
    HybridWbsResponse,
    GitHubExportRequest,
    GitHubExportResponse,
)

app = FastAPI(
    title="POCO Workflow Engine",
    description="사용자 정의 프로젝트 기반 WBS 시각화 및 GitHub 연동 엔진",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/")
def read_root():
    return {"message": "POCO Engine API Server Running", "status": "healthy"}

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