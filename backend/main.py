import os
import json
import time
from typing import List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai

# 1. 환경 변수 및 Gemini 클라이언트 세팅
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    # .env 파일 미인식 시 사용할 기본 키
    api_key = "<YOUR_DEFAULT_API_KEY>"

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
    dependencies: List[str] = Field(default=[], description="선행 태스크의 id 목록")

class WBSResponse(BaseModel):
    project_title: str
    nodes: List[TaskNode]

class IdeaRequest(BaseModel):
    idea: str


# 4. WBS 생성 API 엔드포인트 (재시도 및 백업 모델 전환 로직 포함)
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

    # 503 트래픽 분산을 위한 모델 우선순위 목록
    candidate_models = ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
    last_error = None

    for model_name in candidate_models:
        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "response_schema": WBSResponse,
                    }
                )
                result_data = json.loads(response.text)
                return result_data
            except Exception as e:
                last_error = e
                print(f"[{model_name}] 시도 {attempt + 1} 실패: {e}")
                time.sleep(1.5)

    raise HTTPException(status_code=500, detail=f"WBS 생성 중 오류 발생: {str(last_error)}")

@app.get("/")
def health_check():
    return {"status": "ok", "message": "TT-TaskTree Backend Server Running"}