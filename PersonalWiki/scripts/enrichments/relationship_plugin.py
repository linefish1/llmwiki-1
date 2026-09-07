# scripts/enrichments/relationship_plugin.py
import os
import json
import re
from typing import Dict, Any, List, Set, Tuple
from base_plugin import BaseEnrichmentPlugin
from llm_client import call_llm_json

class MermaidRelationshipPlugin(BaseEnrichmentPlugin):
    """动态三元组抽取与关系网生成插件"""

    @property
    def plugin_name(self) -> str:
        return "relationship"

    async def process_chapter(
        self, 
        chapter_id: str, 
        content: str, 
        existing_entities: List[str]
    ) -> Dict[str, Any]:
        prompt = f"""
你是一个严谨的文学关系抽取引擎。请阅读以下章节内容，提取其中的人物与人物、人物与地点、人物与关键物品之间的核心关系三元组。

章节ID：{chapter_id}
章节内容片段：
{content[:3500]}

请仅输出合法的 JSON 格式，严格格式如下：
{{
  "triples": [
    {{"source": "贾宝玉", "relation": "赠送旧帕", "target": "林黛玉", "context": "第{chapter_id}回"}},
    {{"source": "薛宝钗", "relation": "探望伤情", "target": "贾宝玉", "context": "第{chapter_id}回"}},
    {{"source": "贾政", "relation": "笞挞训诫", "target": "贾宝玉", "context": "第{chapter_id}回"}},
    {{"source": "王熙凤", "relation": "承办调解", "target": "王夫人", "context": "第{chapter_id}回"}}
  ]
}}
"""
        response_json = await call_llm_json(prompt)
        triples = []
        if response_json and "triples" in response_json and isinstance(response_json["triples"], list):
            triples = response_json["triples"]

        # Rule-based fallback extraction if AI not available or empty
        if not triples:
            triples = self._extract_rule_triples(chapter_id, content)

        return {
            "chapter_id": chapter_id,
            "triples": triples
        }

    def _extract_rule_triples(self, chapter_id: str, content: str) -> List[Dict[str, str]]:
        c = chapter_id.lstrip("0")
        ctx = f"第{c}回"
        results = []

        patterns = [
            ("贾宝玉", "赠送旧帕", "林黛玉", ["旧帕", "题帕", "眼泪"]),
            ("薛宝钗", "送药探望", "贾宝玉", ["棒疮", "丸药", "早听人一句话"]),
            ("贾政", "笞挞训诫", "贾宝玉", ["板子", "金钏儿", "打死", "小解"]),
            ("袭人", "进言防嫌", "王夫人", ["袭人", "太太", "搬出园子"]),
            ("林黛玉", "芒种葬花", "大观园", ["葬花", "花冢", "葬花吟"]),
            ("薛宝钗", "戏彩蝶", "滴翠亭", ["滴翠亭", "蝴蝶", "彩蝶"]),
            ("林黛玉", "初进贾府", "荣国府", ["初进", "贾母", "摔玉", "无玉"]),
            ("贾宝玉", "摔玉问因", "通灵宝玉", ["通灵宝玉", "莫失莫忘", "摔玉"]),
            ("贾雨村", "依附荣府", "贾政", ["复职", "应天府", "门子"]),
            ("冷子兴", "演说荣府", "贾雨村", ["演说", "荣国府", "宁国府"])
        ]
        for src, rel, tgt, keywords in patterns:
            if any(k in content for k in keywords):
                results.append({
                    "source": src,
                    "relation": rel,
                    "target": tgt,
                    "context": ctx
                })

        # Generic presence link between major characters
        if not results:
            chars = ["贾宝玉", "林黛玉", "薛宝钗", "王熙凤", "贾母", "贾政", "王夫人"]
            present = [ch for ch in chars if ch in content]
            for i in range(len(present) - 1):
                results.append({
                    "source": present[i],
                    "relation": "同框互动",
                    "target": present[i+1],
                    "context": ctx
                })
        return results

    def _generate_mermaid_block(self, entity_name: str, edges: List[Tuple[str, str, str, str]]) -> str:
        """
        Generates clean, deduplicated Mermaid graph LR code.
        edges: list of (source, relation, target, context)
        """
        lines = [
            "```mermaid",
            "graph LR",
            f"    subgraph {entity_name}关系网络"
        ]

        # Use clean IDs
        node_map = {}
        def get_id(name: str) -> str:
            if name not in node_map:
                node_map[name] = f"N{len(node_map) + 1}"
            return node_map[name]

        for src, rel, tgt, ctx in edges:
            s_id = get_id(src)
            t_id = get_id(tgt)
            label = f"{rel} ({ctx})" if ctx else rel
            lines.append(f"        {s_id}[{src}] -->|{label}| {t_id}[{tgt}]")

        lines.append("    end")
        if entity_name in node_map:
            lines.append(f"    style {node_map[entity_name]} fill:#f9f,stroke:#333,stroke-width:2px")
        lines.append("```")
        return "\n".join(lines)

    async def apply_to_wiki(self, enrichment_data: Dict[str, Any], wiki_base_dir: str) -> None:
        triples = enrichment_data.get("triples", [])
        if not triples:
            return

        entities_dir = os.path.join(wiki_base_dir, "entities")
        os.makedirs(entities_dir, exist_ok=True)

        # Group edges by affected entity
        entity_edges: Dict[str, List[Tuple[str, str, str, str]]] = {}
        for t in triples:
            s = t["source"]
            r = t["relation"]
            tgt = t["target"]
            c = t.get("context", "")

            entity_edges.setdefault(s, []).append((s, r, tgt, c))
            entity_edges.setdefault(tgt, []).append((s, r, tgt, c))

        # Update each entity file
        for entity_name, new_edges in entity_edges.items():
            entity_file = os.path.join(entities_dir, f"{entity_name}.md")
            self._update_entity_mermaid(entity_file, entity_name, new_edges)

        # Also update global relationship synthesis
        self._update_global_relationship_synthesis(wiki_base_dir, triples)

    def _update_entity_mermaid(self, filepath: str, entity_name: str, new_edges: List[Tuple[str, str, str, str]]) -> None:
        content = ""
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        else:
            content = f"# 实体：{entity_name}\n\n> **类型**：人物/概念\n\n---\n\n## 📝 实体概述\n长篇巨著《红楼梦》核心实体。\n\n"

        # Edge deduplication: if (src, tgt) edge exists, merge context
        existing_edges_set = set()
        merged_edges = []

        # Parse existing edges if there was already a mermaid block
        pattern = re.compile(r"\[(.*?)\]\s*-->\|(.*?)\|\s*\[(.*?)\]")
        for m in pattern.finditer(content):
            s, rel_str, t = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
            existing_edges_set.add((s, t))
            merged_edges.append((s, rel_str, t, ""))

        # Append new edges idempotently
        for s, r, t, c in new_edges:
            key = (s, t)
            if key not in existing_edges_set:
                existing_edges_set.add(key)
                merged_edges.append((s, r, t, c))
            else:
                # Update citation in merged list if needed
                for idx, (es, er, et, ec) in enumerate(merged_edges):
                    if (es, et) == key and c and c not in er:
                        merged_edges[idx] = (es, f"{er} / {c}", et, "")

        mermaid_block = self._generate_mermaid_block(entity_name, merged_edges[:12])

        # Replace or inject into ## 🕸️ 关系网络
        section_header = "## 🕸️ 关系网络"
        if section_header in content:
            # Replace existing section up to next ## or EOF
            parts = content.split(section_header)
            prefix = parts[0] + section_header + "\n\n"
            rest = parts[1].strip()
            # If rest has next ## section
            next_sec_idx = rest.find("\n## ")
            if next_sec_idx != -1:
                content = prefix + mermaid_block + "\n\n" + rest[next_sec_idx+1:]
            else:
                content = prefix + mermaid_block + "\n"
        else:
            content += f"\n\n{section_header}\n\n{mermaid_block}\n"

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    def _update_global_relationship_synthesis(self, wiki_base_dir: str, triples: List[Dict[str, str]]) -> None:
        synth_dir = os.path.join(wiki_base_dir, "synthesis")
        os.makedirs(synth_dir, exist_ok=True)
        synth_file = os.path.join(synth_dir, "relationship_graph.md")

        existing_triples = []
        if os.path.exists(synth_file):
            with open(synth_file, "r", encoding="utf-8") as f:
                txt = f.read()
                # Parse existing triples
                m = re.findall(r"\[(.*?)\]\s*-->\|(.*?)\|\s*\[(.*?)\]", txt)
                for s, r, t in m:
                    existing_triples.append({"source": s, "relation": r, "target": t})

        # Deduplicate
        seen = set((t["source"], t["target"], t["relation"]) for t in existing_triples)
        for nt in triples:
            key = (nt["source"], nt["target"], nt["relation"])
            if key not in seen:
                seen.add(key)
                existing_triples.append(nt)

        lines = [
            "# 综合报告：全局人物与概念关系拓扑网络",
            "\n> 由 LLM Wiki Mermaid 关系网引擎自动编织维护，支持增量去重与多维关联拓扑。\n",
            "```mermaid",
            "graph TD",
            "    subgraph 红楼梦核心关系总览"
        ]
        for i, t in enumerate(existing_triples[:30]):
            s = t["source"]
            r = t["relation"]
            tgt = t["target"]
            lines.append(f"        P{i}A[{s}] -->|{r}| P{i}B[{tgt}]")
        lines.append("    end")
        lines.append("```\n")
        lines.append("## 📊 抽取三元组详情清单\n")
        lines.append("| 主体 (Source) | 关系属性 (Relation) | 客体 (Target) | 章节出处 (Context) |")
        lines.append("| :--- | :--- | :--- | :--- |")
        for t in existing_triples:
            lines.append(f"| [[{t['source']}]] | {t['relation']} | [[{t['target']}]] | {t.get('context', '增量抽取')} |")

        with open(synth_file, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
