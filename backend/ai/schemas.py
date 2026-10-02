from pydantic import BaseModel, Field
from typing import List, Literal, Optional

# 1단계: WBS 개별 노드 스키마
class WbsNodeSchema(BaseModel):
    id: str = Field(description="고유 작업 ID (예: task-1, task-2)")
    title: str = Field(description="작업 명칭 (명확하고 구체적인 작업명)")
    week: int = Field(description="수행 주차 (1부터 시작)")
    category: Literal["planning", "design", "frontend", "backend", "devops", "database", "common"] = Field(
        description="작업 직군/카테고리"
    )
    is_milestone: bool = Field(description="필수 관문/마일스톤 여부 (중간점검, 배포, 핵심 아키텍처 결정 등은 True)")
    dependencies: List[str] = Field(default_factory=list, description="선행 작업 ID 목록 (예: ['task-1'])")
    description: str = Field(description="작업에 대한 상세 설명 및 실무 가이드")
    tools: List[str] = Field(default_factory=list, description="추천 도구/기술 스택 목록")
    checklist: List[str] = Field(default_factory=list, description="작업 완료 검증을 위한 체크리스트 항목")

# 1단계: 거시적 WBS 생성 최종 결과 스키마
class MacroWbsResponse(BaseModel):
    project_title: str = Field(description="정제된 프로젝트 공식 명칭")
    nodes: List[WbsNodeSchema] = Field(description="주차별 순차 WBS 작업 노드 목록")


# 2단계: 3지선다 개별 옵션 스키마
class BranchOptionSchema(BaseModel):
    option_id: str = Field(description="옵션 구분 ID (opt-A, opt-B, opt-C)")
    title: str = Field(description="기술/구현 방식 명칭 (예: OAuth 2.0 직접 구현, Supabase Auth 도입 등)")
    description: str = Field(description="해당 선택지의 핵심 접근 방식 요약")
    pros: str = Field(description="장점 및 적합한 상황")
    cons: str = Field(description="단점 및 주의할 트레이드오프")
    recommended_tools: List[str] = Field(default_factory=list, description="해당 구현 시 추천 라이브러리/도구")

# 2단계: 3지선다 브랜치 생성 최종 결과 스키마
class BranchOptionsResponse(BaseModel):
    parent_node_id: str = Field(description="선택한 부모 노드 ID")
    parent_title: str = Field(description="선택한 부모 노드 제목")
    options: List[BranchOptionSchema] = Field(description="마일스톤 극복을 위한 3가지 상호 배타적 구현 선택지 (정확히 3개)")