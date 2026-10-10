from typing import List, Optional
from ai.llm_client import LLMClient
from ai.schemas import BranchResponse, BranchOptionItem

llm_client = LLMClient(model_id="gemini-3.8-flash", temperature=0.3)


async def generate_branch_options(
    idea: str,
    parent_title: str,
    parent_step_id: str,
    current_week: int = 1,
    team_size: int = 4,
    selected_history: Optional[List[str]] = None,
) -> BranchResponse:
    history_context = "\n".join([f"- 이전 선택: {h}" for h in (selected_history or [])])

    prompt = f"""
    당신은 IT 프로젝트 소프트웨어 공학 수석 아키텍트입니다.
    사용자가 진행 중인 프로젝트의 다음 단계를 결정하기 위해 3가지 실무적 분기점(Branch Options)을 제시하세요.

    [프로젝트 정보]
    - 주제: {idea}
    - 팀원 규모: {team_size}명
    - 기준 부모 작업(현재 관문 노드): {parent_title} (ID: {parent_step_id})
    - 현재 주차: {current_week}주차
    - 이전 결정 이력:
    {history_context if history_context else "없음 (프로젝트 초기 단계)"}

    [필수 규칙]
    1. 기준 관문 노드 다음으로 프로젝트에서 실행할 수 있는 서로 다른 아키텍처적 접근 방식 3가지(Option A, B, C)를 작성하세요.
    2. 각 옵션마다 구체적인 제목(title), 설명(description), 장점(pros), 단점(cons), 추천 도구(recommended_tools), 예상 일수(estimated_days), 카테고리(category)를 작성하세요.
    3. 팀원 {team_size}명이 실무적으로 감당 가능한 현실적인 대안이어야 합니다.
    4. 반드시 3개의 옵션을 포함하여 반환하세요.
    """

    try:
        result: BranchResponse = await llm_client.invoke(
            prompt=prompt,
            expected_schema=BranchResponse,
            max_retries=2,
        )
        return result
    except Exception as e:
        print(f"[AI Branch] Gemini 옵션 생성 실패로 기본 대안 반환: {e}")
        return get_fallback_branch_options(idea, parent_step_id, parent_title)


def get_fallback_branch_options(idea: str, parent_step_id: str, parent_title: str) -> BranchResponse:
    return BranchResponse(
        parent_step_id=parent_step_id,
        stage_name=f"[{idea}] {parent_title} 세부 진행 방향 결정",
        options=[
            BranchOptionItem(
                option_id="opt-A",
                title="Option A: 표준 경량 REST 아키텍처 방식",
                description="FastAPI 기반 표준 REST 엔드포인트를 구축하여 안정성과 직관적인 구현을 챙깁니다.",
                pros="팀원 간 협업 분담이 쉽고 빠른 개발 가능",
                cons="고도화된 실시간 연동에는 추가 작업 필요",
                category="backend",
                estimated_days=3,
                recommended_tools=["FastAPI", "PostgreSQL", "Pydantic"]
            ),
            BranchOptionItem(
                option_id="opt-B",
                title="Option B: 실시간 비동기 이벤트 스트림 방식",
                description="WebSocket 및 메시지 큐를 도입하여 사용자 화면과 즉각적인 양방향 인터랙션을 구성합니다.",
                pros="실시간 상태 반응성 및 시연 완성도 극대화",
                cons="서버 세션 유지 및 인프라 추가 부담",
                category="backend",
                estimated_days=4,
                recommended_tools=["WebSocket", "Redis", "Asyncio"]
            ),
            BranchOptionItem(
                option_id="opt-C",
                title="Option C: 모듈형 마이크로 컴포넌트 아키텍처",
                description="독립적인 서비스 단위로 비즈니스 로직을 격리하여 안정성을 강화합니다.",
                pros="추후 기능 추가 시 사이드 이펙트 최소화",
                cons="초기 구조 설계 및 라우팅 설정 공수 증가",
                category="backend",
                estimated_days=4,
                recommended_tools=["Docker", "SQLAlchemy", "FastAPI"]
            )
        ]
    )