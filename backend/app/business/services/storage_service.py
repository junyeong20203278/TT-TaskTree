import os
import json
from typing import Optional, Dict, Any, List

# backend/app/ 기준 경로 계산
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
DATA_DIR = os.path.join(APP_DIR, "data")
PROJECTS_DIR = os.path.join(DATA_DIR, "projects")
GUIDES_DIR = os.path.join(DATA_DIR, "guides")

# 필수 디렉터리 자동 생성
os.makedirs(PROJECTS_DIR, exist_ok=True)
os.makedirs(GUIDES_DIR, exist_ok=True)


class StorageService:
    """
    경량 로컬 JSON 파일 기반 영속성 관리 서비스
    - 무거운 RDBMS 없이 프로젝트 WBS 및 실무 가이드 템플릿을 파일 단위로 관리
    """

    @staticmethod
    def save_project(project_id: str, data: Dict[str, Any]) -> str:
        """
        프로젝트 WBS 데이터를 data/projects/{project_id}.json 파일로 저장
        """
        file_path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return file_path

    @staticmethod
    def get_project(project_id: str) -> Optional[Dict[str, Any]]:
        """
        data/projects/{project_id}.json 파일에서 WBS 데이터 로드
        """
        file_path = os.path.join(PROJECTS_DIR, f"{project_id}.json")
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

    @staticmethod
    def list_projects() -> List[str]:
        """
        저장된 모든 프로젝트 ID 목록 반환
        """
        if not os.path.exists(PROJECTS_DIR):
            return []
        files = os.listdir(PROJECTS_DIR)
        return [f.replace(".json", "") for f in files if f.endswith(".json")]

    @staticmethod
    def save_guide(topic: str, data: Dict[str, Any]) -> str:
        """
        실무 가이드 템플릿을 data/guides/{topic}.json 파일로 저장
        """
        file_path = os.path.join(GUIDES_DIR, f"{topic}.json")
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return file_path

    @staticmethod
    def get_guide(topic: str) -> Optional[Dict[str, Any]]:
        """
        data/guides/{topic}.json 파일에서 실무 가이드 템플릿 로드
        """
        file_path = os.path.join(GUIDES_DIR, f"{topic}.json")
        if not os.path.exists(file_path):
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)