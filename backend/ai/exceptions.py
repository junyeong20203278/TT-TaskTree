"""AI 호출 관련 커스텀 예외 정의."""

from typing import Any, Optional


class AIError(Exception):
    """AI 관련 기본 예외 클래스."""

    def __init__(self, message: str, details: Optional[dict[str, Any]] = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class BedrockAPIError(AIError):
    """외부 LLM API 호출 에러 (Gemini/Anthropic 공통)."""
    pass


class AIGenerationFailedError(AIError):
    """재시도 초과 또는 스키마 검증 실패 에러."""
    pass