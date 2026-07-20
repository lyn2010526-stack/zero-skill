"""OpenAI-compatible LLM provider abstraction for Defensive AI Lab.

Provides a thin, dependency-free client that speaks the OpenAI Chat Completions
API. It reads endpoint configuration exclusively from user-supplied project
environment variables. It never discovers, copies, or reads platform-internal
LLM credentials.

Boundary:
- No automatic proxy rotation, endpoint switching, or hidden fallbacks.
- No credential scanning of the environment.
- Provider changes are explicit and audited.
- Network access is opt-in per experiment and confined to that command.

Usage:
    provider = LlmProvider.from_environment("USER_LLM")
    response = provider.complete(
        model="deepseek-chat",
        prompt="Summarize this finding",
        temperature=0.2,
        max_tokens=512,
    )

Configuration (set by the user in their project):
    USER_LLM_API_KEY   - secret, read via os.getenv, never printed
    USER_LLM_BASE_URL  - e.g. https://api.deepseek.com/v1
    USER_LLM_MODEL     - default model alias

If any required variable is missing, the provider raises MissingConfiguration
with a message telling the user which variables to set. It never falls back
to platform-internal credentials.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


class MissingConfiguration(Exception):
    """Raised when user-provided LLM configuration is incomplete."""


@dataclass(frozen=True)
class LlmResponse:
    text: str
    finish_reason: str
    provider_model_id: str
    input_tokens: int
    output_tokens: int
    raw_sha256: str


@dataclass(frozen=True)
class LlmProvider:
    api_key: str
    base_url: str
    default_model: str
    timeout_seconds: float

    @classmethod
    def from_environment(cls, prefix: str = "USER_LLM", timeout_seconds: float = 60.0) -> "LlmProvider":
        api_key = os.environ.get(f"{prefix}_API_KEY", "").strip()
        base_url = os.environ.get(f"{prefix}_BASE_URL", "").strip()
        default_model = os.environ.get(f"{prefix}_MODEL", "").strip()
        missing = []
        if not api_key:
            missing.append(f"{prefix}_API_KEY")
        if not base_url:
            missing.append(f"{prefix}_BASE_URL")
        if not default_model:
            missing.append(f"{prefix}_MODEL")
        if missing:
            raise MissingConfiguration(
                "LLM provider configuration is incomplete. Set the following "
                f"environment variables in your project: {', '.join(missing)}"
            )
        return cls(api_key=api_key, base_url=base_url.rstrip("/"), default_model=default_model, timeout_seconds=timeout_seconds)

    @staticmethod
    def is_configured(prefix: str = "USER_LLM") -> bool:
        return all(os.environ.get(f"{prefix}_{suffix}", "").strip() for suffix in ("API_KEY", "BASE_URL", "MODEL"))

    def complete(self, model: str | None, prompt: str, temperature: float = 0.0, max_tokens: int = 512) -> LlmResponse:
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
        }
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            url=f"{self.base_url}/chat/completions",
            data=body,
            method="POST",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                status = response.status
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"LLM provider returned HTTP {error.code}: {error.reason}") from error
        except urllib.error.URLError as error:
            raise RuntimeError(f"LLM provider request failed: {error.reason}") from error
        if status != 200:
            raise RuntimeError(f"LLM provider returned HTTP {status}")
        return self._parse_response(raw, target_model)

    @staticmethod
    def _parse_response(raw: str, target_model: str) -> LlmResponse:
        import hashlib
        data = json.loads(raw)
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("LLM provider returned no choices")
        message = choices[0].get("message", {})
        text = message.get("content", "") or ""
        finish_reason = choices[0].get("finish_reason", "stop")
        usage = data.get("usage", {})
        provider_model_id = data.get("model", target_model)
        return LlmResponse(
            text=text,
            finish_reason=finish_reason,
            provider_model_id=provider_model_id,
            input_tokens=int(usage.get("prompt_tokens", 0)),
            output_tokens=int(usage.get("completion_tokens", 0)),
            raw_sha256=hashlib.sha256(raw.encode("utf-8")).hexdigest(),
        )
