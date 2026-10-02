import os
import json
import time
from typing import List, Optional
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

# 1. 환경 변수 및 Gemini 클라이언트 세팅
load_dotenv()

# .env 파일에서 GEMINI_API_KEY 또는 GOOGLE_API_KEY를 읽어옵니다.
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if not api_key:
    # 혹시 .env 파일을 못 읽을 경우를 대비해 직접 키를 넣을 수 있는 안전장치
    api_key = "YOUR_API_KEY_HERE"

client = genai.Client(api_key=api_key)

# 2. FastAPI 앱 및 CORS 설정 (React 프론트엔드 연동 지원)
app = FastAPI(title="TT (TaskTree) API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Pydantic 데이터 모델 정의
class TaskNode(BaseModel):
    id: str = Field(description="고유 ID (예: task-1)")
    title: str = Field(description="작업 명칭 (예: DB ERD 설계)")
    week: int = Field(description="수행 주차 (1~8)")
    category: str = Field(description="분류: 'frontend' | 'backend' | 'common' | 'devops'")
    is_milestone: bool = Field(default=False, description="중간 점검/필수 관문 여부")
    dependencies: List[str] = Field(default_factory=list, description="선행 태스크의 id 목록")

class WBSResponse(BaseModel):
    project_title: str
    nodes: List[TaskNode]

class IdeaRequest(BaseModel):
    idea: str

# 2단계 3지선다 브랜치용 모델
class BranchOption(BaseModel):
    option_id: str = Field(description="옵션 구분 ID (opt-A, opt-B, opt-C)")
    title: str = Field(description="구현 방식 명칭")
    description: str = Field(description="접근 방식 요약")
    pros: str = Field(description="장점 및 적합 상황")
    cons: str = Field(description="단점 및 트레이드오프")

class BranchResponse(BaseModel):
    parent_node_id: str
    options: List[BranchOption]

class BranchRequest(BaseModel):
    node_id: str
    node_title: str
    node_desc: Optional[str] = ""


# 4. 1단계: WBS 생성 API 엔드포인트
@app.post("/api/generate", response_model=WBSResponse)
def generate_wbs(payload: IdeaRequest):
    if not payload.idea.strip():
        raise HTTPException(status_code=400, detail="아이디어를 입력해주세요.")

    prompt = f"""
당신은 소프트웨어 공학 및 프로젝트 매니지먼트(PM) 전문가입니다.
사용자가 제안한 프로젝트 아이디어를 분석하여 **총 8주(Week 1 ~ Week 8) 개발 일정의 WBS(Work Breakdown Structure)**를 작성하세요.

[프로젝트 아이디어]
{payload.idea}

[작성 규칙]
1. 총 12~16개의 핵심 태스크 노드를 생성하세요.
2. 각 노드는 1주차부터 8주차까지 논리적인 순서로 배치되어야 합니다.
3. dependencies(선행 작업)를 반드시 실제 존재하는 id로 논리적으로 연결하세요. (예: DB 설계 -> 백엔드 API 개발)
4. 중요한 분기점(주요 기능 완성, 중간 발표, 배포 등)에는 is_milestone: true를 지정하세요.
5. category는 반드시 "frontend", "backend", "common", "devops" 중 하나로 지정하세요.
6. 응답은 반드시 WBSResponse 규격의 순수 JSON 본문만 반환해야 합니다.
"""

    # 방금 단독 테스트에서 정상 작동이 검증된 안정적인 모델 목록
    candidate_models = [
        "gemini-flash-latest",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash"
    ]
    last_error = None

    for model_name in candidate_models:
        for attempt in range(2):
            try:
                print(f"[WBS 생성] 모델 호출 중: {model_name} (시도 {attempt + 1})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": WBSResponse,
                    }
                )
                result_data = json.loads(response.text)
                print(f"[WBS 생성 성공] {result_data.get('project_title')}")
                return result_data
            except Exception as e:
                last_error = e
                print(f"[{model_name}] 실패: {e}")
                time.sleep(1.5)

    raise HTTPException(status_code=500, detail=f"WBS 생성 중 오류 발생: {str(last_error)}")


# 5. 2단계: 3지선다 세부 옵션 생성 API 엔드포인트
@app.post("/api/branch/options", response_model=BranchResponse)
def generate_branch_options(payload: BranchRequest):
    prompt = f"""
당신은 테크 리드 멘토입니다. 개발자가 다음 작업 단계를 구현하려고 합니다.
- 작업명: {payload.node_title} (ID: {payload.node_id})
- 세부설명: {payload.node_desc}

이 작업을 완수하기 위한 실무 구현 대안 3가지(Option A, B, C)를 제안하세요.
반드시 서로 다른 장단점(속도 vs 안정성 등)을 가진 상호 배타적인 3가지 옵션을 제시해야 합니다.
"""
    candidate_models = ["gemini-flash-latest", "gemini-3.5-flash"]
    last_error = None

    for model_name in candidate_models:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": BranchResponse,
                }
            )
            return json.loads(response.text)
        except Exception as e:
            last_error = e
            time.sleep(1)

    raise HTTPException(status_code=500, detail=f"브랜치 옵션 생성 실패: {str(last_error)}")


@app.get("/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "TT-TaskTree Backend Server Running"}