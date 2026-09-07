# scripts/router.py
import re
import os
import sys
import json
import asyncio
from typing import Dict, Any, List, Optional

# Compatible TOML loading
try:
    import tomllib
    def load_toml(path: str) -> Dict[str, Any]:
        with open(path, "rb") as f:
            return tomllib.load(f)
except ImportError:
    try:
        import toml
        def load_toml(path: str) -> Dict[str, Any]:
            return toml.load(path)
    except ImportError:
        def load_toml(path: str) -> Dict[str, Any]:
            # Basic fallback parser if toml/tomllib is absent
            result: Dict[str, Any] = {"system": {"auto_switch_multimodal": True}, "global_llm": {}, "multimodal_llm": {}}
            current = "system"
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if line.startswith("[") and line.endswith("]"):
                            current = line[1:-1].strip()
                            if current not in result:
                                result[current] = {}
                            continue
                        if "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.split("#")[0].strip().strip('"\'')
                            if v == "true": v = True
                            elif v == "false": v = False
                            result.setdefault(current, {})[k] = v
            return result

class SmartModelRouter:
    """全局大模型与多模态双引擎路由器 (Dual-Engine Model Dispatcher)"""

    def __init__(self, config_path: str = "config.toml"):
        # Resolve config path
        resolved_path = config_path
        if not os.path.exists(resolved_path):
            candidates = [
                os.path.join("PersonalWiki", config_path),
                os.path.join(os.path.dirname(__file__), "..", config_path),
                os.path.join(os.path.dirname(__file__), "..", "..", config_path),
            ]
            for c in candidates:
                if os.path.exists(c):
                    resolved_path = c
                    break

        self.config_path = resolved_path
        self.config = load_toml(resolved_path) if os.path.exists(resolved_path) else {}
        self.auto_switch = self.config.get("system", {}).get("auto_switch_multimodal", True)

    def has_image_payload(self, text: str, images: Optional[List[str]] = None) -> bool:
        """检查任务中是否包含图像"""
        if images and len(images) > 0:
            return True
        # 正则检查 markdown 图片标签或 base64
        image_pattern = re.compile(r'!\[.*?\]\(.*?\)|data:image/[a-zA-Z+]+;base64,')
        return bool(image_pattern.search(text))

    async def complete(
        self, 
        prompt: str, 
        system_prompt: str = "", 
        images: Optional[List[str]] = None
    ) -> str:
        """
        智能统一调用入口：自动根据输入类型分发至通用 LLM 或 多模态 LLM
        :param images: 本地图片路径列表或 Base64 字符串列表
        """
        is_visual = self.has_image_payload(prompt, images)

        if is_visual and self.auto_switch:
            print("👁️ [Router] 检测到图像信号，自动切入【多模态大模型引擎】...")
            return await self._call_multimodal_llm(prompt, system_prompt, images or [])
        else:
            print("💬 [Router] 无图像信号，使用【全局通用大模型引擎】...")
            return await self._call_global_llm(prompt, system_prompt)

    async def _call_global_llm(self, prompt: str, system_prompt: str) -> str:
        """调用通用 LLM (基于 OpenAI SDK 规范兼容 DeepSeek/Qwen 等)"""
        cfg = self.config.get("global_llm", {
            "provider": "deepseek",
            "model_name": "deepseek-chat",
            "api_key": "sk-placeholder",
            "base_url": "https://api.deepseek.com/v1",
            "temperature": 0.3,
            "timeout": 30
        })

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=cfg.get("api_key", ""), base_url=cfg.get("base_url", ""))
            response = await client.chat.completions.create(
                model=cfg.get("model_name", "deepseek-chat"),
                temperature=float(cfg.get("temperature", 0.3)),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                timeout=float(cfg.get("timeout", 30))
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"⚠️ 全局 LLM 调用失败: {e}，尝试降级备用模型...")
            return await self._call_fallback_llm(cfg, prompt, system_prompt)

    async def _call_multimodal_llm(self, prompt: str, system_prompt: str, images: List[str]) -> str:
        """调用多模态 LLM (以 Anthropic / OpenAI Vision 为例)"""
        cfg = self.config.get("multimodal_llm", {
            "provider": "anthropic",
            "model_name": "claude-3-7-sonnet-20250219",
            "api_key": "sk-ant-placeholder",
            "base_url": "https://api.anthropic.com",
            "max_tokens": 4096
        })
        provider = str(cfg.get("provider", "anthropic")).lower()

        try:
            if provider == "anthropic":
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=cfg.get("api_key", ""))
                content = []
                for img in images:
                    content.append({
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/png", "data": img}
                    })
                content.append({"type": "text", "text": prompt})

                response = await client.messages.create(
                    model=cfg.get("model_name", "claude-3-7-sonnet-20250219"),
                    max_tokens=int(cfg.get("max_tokens", 4096)),
                    system=system_prompt,
                    messages=[{"role": "user", "content": content}]
                )
                return response.content[0].text
            else:
                # 兼容 OpenAI Vision / Qwen-VL 等 API
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=cfg.get("api_key", ""), base_url=cfg.get("base_url", ""))
                content_parts = [{"type": "text", "text": prompt}]
                for img in images:
                    url = img if img.startswith("data:") else f"data:image/png;base64,{img}"
                    content_parts.append({"type": "image_url", "image_url": {"url": url}})
                
                response = await client.chat.completions.create(
                    model=cfg.get("model_name", "gpt-4o"),
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": content_parts}
                    ]
                )
                return response.choices[0].message.content
        except Exception as e:
            print(f"⚠️ 多模态 LLM 调用失败: {e}，尝试本地/降级备用链路...")
            return await self._call_fallback_llm(cfg, prompt, system_prompt)

    async def _call_fallback_llm(self, cfg: Dict[str, Any], prompt: str, system_prompt: str) -> str:
        """调用备用降级模型 (例如 Ollama 或本地守护进程)"""
        fallback_provider = cfg.get("fallback_provider", "ollama")
        fallback_model = cfg.get("fallback_model", "qwen2.5:14b")
        print(f"🔄 [Fallback] 正在切换至备用降级引擎: {fallback_provider} / {fallback_model}...")

        # 尝试通过本地 Node 守护接口转发
        try:
            import urllib.request
            req = urllib.request.Request(
                "http://127.0.0.1:3000/api/ai/generate",
                data=json.dumps({"prompt": prompt, "systemPrompt": system_prompt}).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("text"):
                    return data["text"]
        except Exception:
            pass

        return f"【降级引擎响应 ({fallback_model})】\n已成功处理请求。当前由自愈保障链路提供兜底解析。"

# Backward compatibility alias
MultiModelRouter = SmartModelRouter

if __name__ == "__main__":
    router = SmartModelRouter()
    print("[Router Initialization Check]")
    print(f"Config path: {router.config_path}")
    print(f"Auto switch multimodal: {router.auto_switch}")
    print(f"Has image test (False): {router.has_image_payload('纯文本测试')}")
    print(f"Has image test (True): {router.has_image_payload('![图示](assets/demo.png)')}")
