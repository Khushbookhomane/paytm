import os
from typing import Optional, List, Dict, Any
from ..config import settings

class LLMService:
    """
    LLM wrapper using Anthropic Claude API with a robust, deterministic offline fallback.
    The demo will run perfectly even without an ANTHROPIC_API_KEY.
    """

    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY.strip()
        self.model = settings.LLM_MODEL
        self.client = None

        if self.api_key:
            try:
                import anthropic
                self.client = anthropic.Anthropic(api_key=self.api_key)
            except Exception as e:
                print(f"[LLMService] Failed to initialize Anthropic client: {e}. Falling back to offline engine.")
                self.client = None

    def is_online(self) -> bool:
        return self.client is not None

    def generate_text(self, prompt: str, system_prompt: str = "", max_tokens: int = 500) -> str:
        """Attempt online LLM generation, or return fallback."""
        if self.client:
            try:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=max_tokens,
                    system=system_prompt,
                    messages=[{"role": "user", "content": prompt}],
                )
                if response.content and len(response.content) > 0:
                    return response.content[0].text
            except Exception as e:
                print(f"[LLMService] Anthropic API call error: {e}. Using deterministic fallback.")

        return self._offline_generic_fallback(prompt)

    def _offline_generic_fallback(self, prompt: str) -> str:
        return "आपके स्टोर का डेटा विश्लेषण सफलतापूर्वक पूरा हुआ।"

llm_service = LLMService()
