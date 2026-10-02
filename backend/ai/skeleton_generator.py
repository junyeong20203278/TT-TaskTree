import os
import time
from dotenv import load_dotenv
from google import genai
from google.genai import types
from ai.schemas import MacroWbsResponse

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY 또는 GOOGLE_API_KEY가 설정되지 않았습니다.")

client = genai.Client(api_key=api_key)

# 방금 확인된 실제 가용 모델 중 쿼터가 넉넉하고 빠른 Flash 라인업 우선 배치
MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

def generate_macro_skeleton(idea: str, duration_weeks: int = 8, team_info: str = "프론트엔드, 백엔드") -> MacroWbsResponse:
    prompt = f"""
    당신은 IT 프로젝트 소프트웨어 공학 수석 아키텍트입니다.
    다음 프로젝트 요구사항을 바탕으로 총 {duration_weeks}주 동안 진행할 완벽하고 현실적인 WBS(작업 분류 체계)를 설계하세요.

    [프로젝트 정보]
    - 주제/아이디어: {idea}
    - 총 프로젝트 기간: {duration_weeks}주
    - 팀 구성/스택: {team_info}

    [필수 규칙]
    1. 1주차부터 {duration_weeks}주차까지 기획 -> 설계 -> 핵심 기능 개발 -> 통합 테스트 -> 배포 흐름으로 구성하세요.
    2. 총 노드 수는 약 12~18개 내외로 주차별 균형 있게 생성하세요.
    3. 주차별 중간 점검, 1차 릴리즈, 최종 배포 등 핵심 분기점은 is_milestone을 True로 설정하세요.
    4. dependencies(선행 작업 ID)는 논리적 선후관계를 반영하여 이전 주차 노드의 ID를 참조하도록 연결하세요.
    """

    last_error = None

    for model_name in MODELS:
        for attempt in range(2):
            try:
                print(f"[AI Skeleton] 시도 중인 모델: {model_name} (시도 {attempt + 1})")
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=MacroWbsResponse,
                        temperature=0.2,
                    ),
                )
                
                parsed_result: MacroWbsResponse = response.parsed
                print(f"[AI Skeleton] 생성 성공! (프로젝트명: {parsed_result.project_title}, 총 {len(parsed_result.nodes)}개 노드)")
                return parsed_result

            except Exception as e:
                error_str = str(e)
                print(f"[AI Skeleton] {model_name} 실패: {error_str[:120]}...")
                last_error = e
                if ("503" in error_str or "high demand" in error_str) and attempt == 0:
                    time.sleep(2)
                    continue
                break

    raise RuntimeError(f"모든 AI 모델 폴백 실패. 최후 오류: {last_error}")