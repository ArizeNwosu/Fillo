from __future__ import annotations

import json
import os
from typing import Any

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from backend.schemas.form_schema import FormSchema


SYSTEM_PROMPT = (
    "You transform user natural-language into a JSON map of {field_id: value} "
    "given a PDF field schema. Return ONLY compact JSON. Respect field data types "
    "and formats. If a value is not present, omit it.\n\n"
    "IMPORTANT: Use ONLY the exact field IDs from the schema's 'fields' array. "
    "Do NOT modify or extend field IDs (e.g., don't add '_radio_button_1' or '_checkbox' suffixes). "
    "The field_id in your response must exactly match the 'id' property in the schema.\n\n"
    "Example: If schema has field {\"id\": \"f_1020\", \"type\": \"text\"}, use \"f_1020\" not \"f_1020_radio_button_1\"."
)


class LlmMapper:
    def __init__(self) -> None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is required for mapping.")
        self.model = os.getenv("OPENAI_MAPPING_MODEL", "gpt-4o-mini")
        self.client = AsyncOpenAI(api_key=api_key)

    @retry(wait=wait_exponential(multiplier=1, min=1, max=8), stop=stop_after_attempt(3))
    async def map_values(
        self,
        schema: FormSchema,
        current_values: dict[str, Any],
        utterance: str,
    ) -> tuple[dict[str, Any], list[str]]:
        payload = {
            "schema": json.loads(schema.model_dump_json()),
            "current_values": current_values,
            "utterance": utterance,
        }
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            temperature=0,
        )
        text = response.choices[0].message.content.strip()
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError:
            parsed = {}
        if isinstance(parsed, dict):
            if "applied" in parsed and isinstance(parsed["applied"], dict):
                applied = parsed.get("applied", {})
                unmatched = parsed.get("unmatched", [])
            else:
                applied = parsed
                unmatched = []
        else:
            applied = {}
            unmatched = []
        applied = {
            key: value
            for key, value in applied.items()
            if any(field.id == key for field in schema.fields)
        }
        if not isinstance(unmatched, list):
            unmatched = []

        print(f"[DEBUG] LLM returned fields: {list(applied.keys())}")
        return applied, [str(item) for item in unmatched]


_llm_mapper: LlmMapper | None = None


def get_mapper() -> LlmMapper:
    global _llm_mapper
    if _llm_mapper is None:
        _llm_mapper = LlmMapper()
    return _llm_mapper
