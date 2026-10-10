import os
import time
from typing import List
from dotenv import load_dotenv
from ai.llm_client import LLMClient
from ai.schemas import HybridWbsResponse, HybridTaskNode, OptionItem

load_dotenv()

# Gemini 2.5 Flash 기반 LLM 클라이언트 인스턴스
llm_client = LLMClient(model_id="gemini-3.8-flash", temperature=0.2)


async def generate_macro_skeleton(
    idea: str,
    duration_weeks: int = 8,
    team_size: int = 4
) -> HybridWbsResponse:
    prompt = f"""
    당신은 IT 프로젝트 소프트웨어 공학 수석 아키텍트입니다.
    사용자가 직접 구상한 다음 프로젝트 요구사항을 바탕으로 총 {duration_weeks}주 동안 진행할 구조화된 WBS 일정을 설계하세요.

    [사용자 프로젝트 정보]
    - 주제: {idea}
    - 총 개발 기간: {duration_weeks}주
    - 팀원 규모: {team_size}명

    [필수 규칙]
    1. 1주차부터 {duration_weeks}주차까지 기획 -> 설계 -> 개발 -> 테스트 -> 배포 흐름(SWE BOK 기반)으로 10~14개 노드를 구성하세요.
    2. 개발 팀원({team_size}명)의 역할 분담을 고려해 frontend, backend, devops, common 작업이 병렬로 적절히 배치되도록 하세요.
    3. 주요 아키텍처 의사결정이 필요한 관문 2~3개는 is_milestone을 true로 지정하세요.
    4. is_milestone이 true인 관문 노드는 사용자가 선택할 수 있도록 구체적인 실무 대안 3가지(branch_options: A, B, C)를 채우세요.
    5. 일반 작업 노드는 branch_options를 빈 리스트([])로 두세요.
    6. dependencies는 선행 노드의 ID를 참조하여 의존 관계를 명확히 연결하세요.
    """

    try:
        result: HybridWbsResponse = await llm_client.invoke(
            prompt=prompt,
            expected_schema=HybridWbsResponse,
            max_retries=2,
        )
        return result
    except Exception as e:
        print(f"[AI Skeleton] Gemini 생성 실패로 사용자 입력 기반 기본 템플릿 반환: {e}")
        return get_fallback_hybrid_wbs(idea, duration_weeks, team_size)


def get_fallback_hybrid_wbs(idea: str, duration_weeks: int, team_size: int) -> HybridWbsResponse:
    """API 장애 시 사용자가 입력한 아이디어명을 반영하여 UI가 동작하도록 하는 비상 템플릿"""
    return HybridWbsResponse(
        project_title=idea,
        nodes=[
            HybridTaskNode(
                id="task-1",
                title=f"{idea} 요구사항 분석 및 기능 정의",
                week=1,
                category="common",
                is_milestone=False,
                dependencies=[],
                description=f"[{idea}] 핵심 기능 스펙 및 유저 시나리오를 도출합니다.",
                tools=["Figma", "Notion"],
                checklist=["요구사항 기능 명세서 정의", "핵심 타겟 유저 플로우 도출"]
            ),
            HybridTaskNode(
                id="task-2",
                title="시스템 아키텍처 및 핵심 기술 스택 결정",
                week=1,
                category="common",
                is_milestone=True,
                dependencies=["task-1"],
                description=f"[{idea}] 서비스 운영을 위한 기술 스택과 서버 아키텍처를 결정하는 관문입니다.",
                tools=["FastAPI", "React", "Docker"],
                checklist=["아키텍처 설계서 작성", "DB 모델링 초안 작성"],
                branch_options=[
                    OptionItem(
                        option_id="opt-A",
                        title="표준 모놀리식 & REST API 구조",
                        description="단일 서버 아키텍처로 빠른 프로토타이핑 및 배포 용이성을 확보합니다.",
                        pros="개발 속도가 빠르고 인프라 관리 복잡도가 매우 낮음",
                        cons="시스템 규모 확장 시 모듈 간 결합도가 높아질 수 있음",
                        recommended_tools=["FastAPI", "PostgreSQL", "React"]
                    ),
                    OptionItem(
                        option_id="opt-B",
                        title="모듈형 분리 구조 & 비동기 큐 연동",
                        description="핵심 API와 비동기 백그라운드 워커를 분리하여 처리 안정성을 높입니다.",
                        pros="대량 요청이나 무거운 연산 작업 시 서버 병목 완화",
                        cons="큐 인프라(Redis/Celery) 및 상태 관리 비용 발생",
                        recommended_tools=["FastAPI", "Redis", "Celery"]
                    ),
                    OptionItem(
                        option_id="opt-C",
                        title="서버리스 & 경량 마이크로서비스",
                        description="기능 단위 컨테이너 및 서버리스 클라우드 환경을 설계합니다.",
                        pros="트래픽 변화에 유연하게 대응 가능",
                        cons="로컬 개발 환경 세팅과 분산 환경 디버깅이 까다로움",
                        recommended_tools=["Docker", "AWS Lambda", "FastAPI"]
                    )
                ]
            ),
            HybridTaskNode(
                id="task-3",
                title="UI 프로토타입 디자인 및 컴포넌트 개발",
                week=2,
                category="frontend",
                is_milestone=False,
                dependencies=["task-1"],
                description="핵심 대시보드 및 사용자 인터랙션 뷰 구현",
                tools=["React", "TailwindCSS"]
            ),
            HybridTaskNode(
                id="task-4",
                title="핵심 데이터 모델링 및 CRUD API 개발",
                week=2,
                category="backend",
                is_milestone=False,
                dependencies=["task-2"],
                description="비즈니스 모델 스키마 정의 및 핵심 데이터 처리 엔드포인트 구현",
                tools=["SQLAlchemy", "Pydantic"]
            ),
            HybridTaskNode(
                id="task-5",
                title="1차 기능 통합 및 알파 버전 검증",
                week=max(3, duration_weeks // 2),
                category="common",
                is_milestone=True,
                dependencies=["task-3", "task-4"],
                description="프론트엔드와 백엔드를 연동하여 주요 기능 플로우를 확인하는 마일스톤입니다.",
                tools=["Swagger", "Docker"],
                checklist=["E2E 통합 테스트", "기능 명세 일치 여부 확인"],
                branch_options=[
                    OptionItem(
                        option_id="opt-A",
                        title="기능 완성도 중심 안정화 및 버그 픽스",
                        description="새 기능 추가를 멈추고 현재까지 작성된 기능의 결함을 우선 제거합니다.",
                        pros="품질이 높아지고 최종 시연 안정성 확보",
                        cons="화려한 추가 기능 확장은 어려움",
                        recommended_tools=["Pytest", "Postman"]
                    ),
                    OptionItem(
                        option_id="opt-B",
                        title="고도화 부가 기능 및 UI/UX 인터랙션 확장",
                        description="기본 뼈대 위에 애니메이션 및 실시간 알림 등 편의 기능을 추가합니다.",
                        pros="사용자 경험 및 데모 시 시각적 완성도 우수",
                        cons="일정 지연 및 사이드 이펙트 발생 위험",
                        recommended_tools=["Framer Motion", "WebSocket"]
                    ),
                    OptionItem(
                        option_id="opt-C",
                        title="CI/CD 자동화 및 배포 환경 우선 구축",
                        description="운영 환경 배포 파이프라인을 조기에 완성하여 배포 안정성을 다집니다.",
                        pros="잦은 배포가 가능해져 팀원 협업이 원활해짐",
                        cons="인프라 설정에 개발 공수 일부 분산",
                        recommended_tools=["GitHub Actions", "Docker Compose"]
                    )
                ]
            ),
            HybridTaskNode(
                id="task-6",
                title="통합 테스트 및 프로덕션 릴리즈",
                week=duration_weeks,
                category="devops",
                is_milestone=True,
                dependencies=["task-5"],
                description=f"[{idea}] 최종 빌드 검증 및 론칭",
                tools=["Docker", "AWS"]
            )
        ]
    )