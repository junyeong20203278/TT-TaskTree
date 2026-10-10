"""Google Gemini 비동기 클라이언트 (실제 가용 모델 자동 감지 및 폴백 체인)."""

import json
import os
import uuid
from typing import Any, List, Optional, Type, TypeVar
from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError
from pydantic import BaseModel, ValidationError

from ai.exceptions import AIGenerationFailedError, BedrockAPIError

T = TypeVar("T", bound=BaseModel)

# 가장 대중적으로 열려 있는 표준 모델 식별자 우선순위
RECOMMENDED_CANDIDATES = [
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro",
]


class LLMClient:
    """Google Gemini 비동기 클라이언트 + 가용 모델 자동 폴백 래퍼."""

    def __init__(
        self,
        gemini_client: Optional[genai.Client] = None,
        model_id: Optional[str] = None,
        model_list: Optional[List[str]] = None,
        max_tokens: int = 2500,
        temperature: float = 0.2,
    ) -> None:
        self.client = gemini_client or genai.Client()

        if model_id:
            self.model_list = [model_id] + [m for m in RECOMMENDED_CANDIDATES if m != model_id]
        elif model_list:
            self.model_list = model_list
        else:
            self.model_list = RECOMMENDED_CANDIDATES

        self.max_tokens = max_tokens
        self.temperature = temperature
        self._available_models: Optional[List[str]] = None

    def _get_supported_models(self) -> List[str]:
        """현재 API 키와 SDK 버전에서 실제 지원되는 generateContent 모델 목록 필터링."""
        if self._available_models is not None:
            return self._available_models

        try:
            # SDK에서 실제 계정에 열려 있는 모델 목록 조회
            server_models = [
                m.name.replace("models/", "") 
                for m in self.client.models.list() 
                if "generateContent" in getattr(m, "supported_generation_methods", ["generateContent"])
            ]
            # 추천 순위와 교집합을 우선 배치
            matched = [m for m in self.model_list if m in server_models]
            others = [m for m in server_models if "flash" in m or "pro" in m]
            
            final_list = matched + [m for m in others if m not in matched]
            self._available_models = final_list if final_list else self.model_list
            print(f"[LLM] 실제 가용 모델 확인 완료: {self._available_models[:3]}")
        except Exception as e:
            print(f"[LLM] 모델 목록 자동 조회 생략 (기본 리스트 사용): {e}")
            self._available_models = self.model_list

        return self._available_models

    async def invoke(
        self,
        prompt: str,
        expected_schema: Type[T],
        system_instruction: Optional[str] = None,
        max_retries: int = 1,
        max_tokens: Optional[int] = None,
    ) -> T:
        correlation_id = str(uuid.uuid4())
        effective_max_tokens = max_tokens or self.max_tokens

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=expected_schema,
            temperature=self.temperature,
            max_output_tokens=effective_max_tokens,
            system_instruction=system_instruction,
        )

        target_models = self._get_supported_models()
        last_exception = None

        for model_id in target_models:
            print(f"[LLM] 호출 시도: {model_id} (req: {correlation_id[:8]})")

            for attempt in range(max_retries + 1):
                try:
                    response = await self.client.aio.models.generate_content(
                        model=model_id,
                        contents=prompt,
                        config=config,
                    )

                    raw_text = response.text
                    if not raw_text:
                        raise AIGenerationFailedError("빈 응답 수신")

                    parsed_json = json.loads(raw_text)
                    validated_data = expected_schema.model_validate(parsed_json)
                    print(f"[LLM 성공] {model_id} 모델로 생성 완료")
                    return validated_data

                except (ClientError, ServerError) as e:
                    error_msg = str(e)
                    # 429(할당량 소진) 또는 404(모델 미지원) 발생 시 다음 후보 모델로 바로 패스
                    if any(err in error_msg for err in ["429", "RESOURCE_EXHAUSTED", "404", "NOT_FOUND"]):
                        print(f"[LLM 전환] {model_id} 사용 불가 ({'429' if '429' in error_msg else '404'}). 다음 모델로 전환합니다.")
                        last_exception = e
                        break

                    print(f"[LLM 재시도] {model_id} (시도 {attempt+1}/{max_retries+1}): {e}")
                    last_exception = e

                except (ValidationError, json.JSONDecodeError) as e:
                    print(f"[LLM 스키마 에러] {model_id}: {e}")
                    last_exception = e

        raise BedrockAPIError(f"모든 후보 모델 호출 실패: {last_exception}")