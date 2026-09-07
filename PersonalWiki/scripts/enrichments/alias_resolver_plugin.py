# scripts/enrichments/alias_resolver_plugin.py
import os
import json
import re
from typing import Dict, Any, List
from base_plugin import BaseEnrichmentPlugin
from llm_client import call_llm_json

class AliasResolverPlugin(BaseEnrichmentPlugin):
    """别名归一化插件：解析代称称号，映射主实体，增量维护 alias_map.json"""

    @property
    def plugin_name(self) -> str:
        return "alias_resolver"

    def _get_alias_map_path(self, wiki_base_dir: str) -> str:
        # Check namespace path first, e.g. wiki/books/hongloumeng/alias_map.json
        candidate = os.path.join(wiki_base_dir, self.namespace, "alias_map.json")
        if os.path.exists(candidate):
            return candidate
        # Fallback to wiki/books/hongloumeng or wiki/alias_map.json
        alt = os.path.join(wiki_base_dir, "books", "hongloumeng", "alias_map.json")
        if os.path.exists(alt):
            return alt
        return candidate

    def load_alias_map(self, wiki_base_dir: str) -> Dict[str, Any]:
        path = self._get_alias_map_path(wiki_base_dir)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                try:
                    return json.load(f)
                except Exception:
                    pass
        return {"entity_mappings": []}

    async def process_chapter(
        self, 
        chapter_id: str, 
        content: str, 
        existing_entities: List[str]
    ) -> Dict[str, Any]:
        wiki_base = self.config.get("wiki_base_dir", "PersonalWiki/wiki")
        alias_data = self.load_alias_map(wiki_base)
        mappings = alias_data.get("entity_mappings", [])

        # Build alias -> canonical lookup table
        alias_to_canonical = {}
        for entry in mappings:
            cname = entry["canonical_name"]
            for a in entry.get("aliases", []):
                alias_to_canonical[a] = cname

        # Resolve aliases in content
        resolved_counts: Dict[str, int] = {}
        for alias, cname in alias_to_canonical.items():
            matches = len(re.findall(re.escape(alias), content))
            if matches > 0:
                resolved_counts[cname] = resolved_counts.get(cname, 0) + matches

        # Discover potential new aliases or titles using LLM
        discovered_aliases = []
        prompt = f"""
你是一个精通中国古代文学与人物关系考据的别名抽取专家。
请阅读以下章节文本片段，识别是否有未被收录的人物代号、绰号、字号、官衔别名（例如“怡红公子”、“潇湘妃子”、“宝姐姐”、“凤辣子”等）。

章节文本：
{content[:2500]}

当前已知实体与别名对照：
{json.dumps([{m["canonical_name"]: m.get("aliases", [])} for m in mappings[:10]], ensure_ascii=False)}

输出严格的 JSON 格式：
{{
  "new_aliases": [
    {{"canonical_name": "主实体规范全名", "new_alias": "发现的新称号或别名", "type": "Person"}}
  ]
}}
"""
        res = await call_llm_json(prompt)
        if res and "new_aliases" in res and isinstance(res["new_aliases"], list):
            discovered_aliases = res["new_aliases"]

        # Rule fallback discovery for classic Chinese novels
        rule_discoveries = [
            ("贾宝玉", ["宝兄弟", "玉兄", "混世魔王"]),
            ("林黛玉", ["林姑娘", "颦儿", "潇湘主人"]),
            ("薛宝钗", ["薛大姑娘", "蘅芜仙子"]),
            ("王熙凤", ["琏二奶奶", "凤哥儿", "阿凤"]),
            ("贾母", ["太夫人", "老祖宗"])
        ]
        for cname, alist in rule_discoveries:
            for a in alist:
                if a in content and a not in alias_to_canonical:
                    discovered_aliases.append({"canonical_name": cname, "new_alias": a, "type": "Person"})

        return {
            "chapter_id": chapter_id,
            "resolved_counts": resolved_counts,
            "discovered_aliases": discovered_aliases,
            "canonical_entities_found": list(resolved_counts.keys())
        }

    async def apply_to_wiki(self, enrichment_data: Dict[str, Any], wiki_base_dir: str) -> None:
        path = self._get_alias_map_path(wiki_base_dir)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        alias_data = self.load_alias_map(wiki_base_dir)
        mappings = alias_data.get("entity_mappings", [])

        # Idempotent merge with Set deduplication
        existing_map = {m["canonical_name"]: m for m in mappings}
        new_aliases = enrichment_data.get("discovered_aliases", [])

        for item in new_aliases:
            cname = item.get("canonical_name")
            new_a = item.get("new_alias")
            itype = item.get("type", "Person")
            if not cname or not new_a:
                continue

            if cname in existing_map:
                cur_aliases = set(existing_map[cname].get("aliases", []))
                cur_aliases.add(new_a)
                existing_map[cname]["aliases"] = sorted(list(cur_aliases))
            else:
                existing_map[cname] = {
                    "canonical_name": cname,
                    "aliases": [new_a],
                    "type": itype
                }

        updated_mappings = list(existing_map.values())
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"entity_mappings": updated_mappings}, f, ensure_ascii=False, indent=2)
