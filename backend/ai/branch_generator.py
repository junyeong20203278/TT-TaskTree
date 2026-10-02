import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from ai.schemas import BranchOptionsResponse

load_dotenv()

client = genai.Client()

MODELS = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-lite-latest",
]

def generate_branch_options(node_id: str, node_title: str, node_desc: str = "") -> BranchOptionsResponse:
    """
    부모 노드 정보를 바탕으로 실무에서 선택할 수 있는 3가지 상호 배타적 미시적 구현 선택지를 생성합니다.
    (예: 빠른 프로토타입형, 표준 실무형, 고도화/확장형)
    """
    prompt = f"""
    당신은 테크 리드 멘토입니다. 개발자가 다음 작업 단계를 구현하려고 합니다.

    - 대상 작업(부모 노드): [{node_title}] (ID: {node_id})
    - 상세 내용: {node_desc}

    이 작업을 완수하기 위한 서로 다른 접근 방식 3가지(Option A, Option B, Option C)를 제안하세요.
    각 옵션은 트레이드오프(개발 속도 vs 완성도, 직접 구현 vs 외부 SaaS 도입 등)가 뚜렷해야 합니다.
    반드시 정확히 3개의 상호 배타적인 옵션을 제시해야 합니다.
    """

    last_error = None

    for model_name in MODELS:
        try:
            print(f"[AI Branch] 시도 중인 모델: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BranchOptionsResponse,
                    temperature=0.3,
                ),
            )
            parsed_result: BranchOptionsResponse = response.parsed
            print(f"[AI Branch] 생성 성공 (옵션 3종 추출 완료)")
            return parsed_result

        except Exception as e:
            print(f"[AI Branch Fallback] 모델 {model_name} 실패: {e}")
            last_error = e
            continue

    raise RuntimeError(f"모든 AI 모델 폴백 실패. 최후 오류: {last_error}")