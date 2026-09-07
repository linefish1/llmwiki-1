# scripts/enrichments/llm_client.py
import os
import json
import urllib.request
import urllib.error
import re
from typing import Dict, Any, Optional

def get_gemini_api_key() -> Optional[str]:
    return os.environ.get("GEMINI_API_KEY")

async def call_llm_json(prompt: str, system_prompt: Optional[str] = None) -> Dict[str, Any]:
    """
    Calls local server /api/ai/generate if available, or gracefully falls back
    to structural rule-based extraction.
    """
    try:
        url = "http://127.0.0.1:3000/api/ai/generate"
        payload = {
            "prompt": prompt,
            "systemPrompt": system_prompt or "你是一个专用于学术与长篇巨著解构的结构化数据提炼引擎。必须仅输出合法的 JSON 格式，严禁包含任何前缀、Markdown 标记或代码块。",
            "json": True
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=4) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                result_text = data.get("text", "")
                if result_text:
                    clean_text = re.sub(r"^```(?:json)?\s*", "", result_text.strip())
                    clean_text = re.sub(r"\s*```$", "", clean_text)
                    return json.loads(clean_text)
    except Exception:
        pass

    return {}
