from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================================
# 1. 3지선다 브랜치(Option A, B, C) 항목 스키마
# ==========================================
class OptionItem(BaseModel):
    option_id: str = Field(description="A, B, C 등 식별자")
    title: str = Field(description="선택지 제목")
    description: str = Field(description="세부 구현 내용 및 What/Why 설명")
    pros: str = Field(description="장점")
    cons: str = Field(description="단점")
    recommended_tools: List[str] = Field(default_factory=list, description="추천 라이브러리 및 도구")

# ==========================================
# 2. 3지선다 분기 전용 응답 스키마
# ==========================================
class BranchResponse(BaseModel):
    parent_step_id: str = Field(description="기준 관문 노드 ID")
    stage_name: str = Field(description="현재 진행 단계명")
    options: List[OptionItem] = Field(description="실무 대안 3종")

# ==========================================
# 3. 개별 작업 노드 스키마
# ==========================================
class HybridTaskNode(BaseModel):
    id: str = Field(description="작업 고유 ID")
    title: str = Field(description="작업 제목")
    week: int = Field(description="진행 주차")
    category: str = Field(default="common", description="frontend, backend, devops, common")
    is_milestone: bool = Field(default=False, description="핵심 의사결정 관문 여부")
    dependencies: List[str] = Field(default_factory=list, description="선행 노드 ID 목록")
    description: Optional[str] = Field(default="", description="작업 상세 설명")
    tools: Optional[List[str]] = Field(default_factory=list, description="사용 도구")
    checklist: Optional[List[str]] = Field(default_factory=list, description="체크리스트")
    branch_options: Optional[List[OptionItem]] = Field(default_factory=list, description="관문용 3지선다")

# ==========================================
# 4. 전체 WBS 응답 스키마
# ==========================================
class HybridWbsResponse(BaseModel):
    project_title: str = Field(description="사용자 입력 프로젝트 주제")
    nodes: List[HybridTaskNode] = Field(description="생성된 노드 목록")

# ==========================================
# 5. GitHub 이슈 내보내기 스키마 (A방식)
# ==========================================
class GitHubExportItem(BaseModel):
    id: str
    title: str
    week: int
    category: str
    description: Optional[str] = ""
    tools: Optional[List[str]] = []
    checklist: Optional[List[str]] = []

class GitHubExportRequest(BaseModel):
    github_token: str = Field(description="GitHub Personal Access Token")
    repo_owner: str = Field(description="GitHub 계정명 또는 조직명")
    repo_name: str = Field(description="저장소 이름")
    nodes: List[GitHubExportItem] = Field(description="이슈로 등록할 선택된 노드 목록")

class GitHubExportResponse(BaseModel):
    success: bool
    total_created: int
    created_issue_urls: List[str]