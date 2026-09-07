# scripts/enrichments/synthesis_matrix_plugin.py
import os
import json
import re
from typing import Dict, Any, List
from base_plugin import BaseEnrichmentPlugin
from llm_client import call_llm_json

class SynthesisMatrixPlugin(BaseEnrichmentPlugin):
    """跨章节伏笔与主题矩阵合成插件 (Synthesis Matrix Builder)"""

    @property
    def plugin_name(self) -> str:
        return "synthesis_matrix"

    async def process_chapter(
        self, 
        chapter_id: str, 
        content: str, 
        existing_entities: List[str]
    ) -> Dict[str, Any]:
        c = chapter_id.lstrip("0")
        prompt = f"""
你是一个精通中国古代文学伏笔、隐喻与象征修辞的考据学者。
请分析以下小说章节，提炼其中出现的关键物象、诗词、判词、图册以及它们跨章节暗示的人生命运与家族兴衰结局。

章节编号：第 {c} 回
文本片段：
{content[:3500]}

输出严格符合以下 JSON 格式：
{{
  "symbolic_foreshadowing": [
    {{"object_or_poem": "通灵宝玉上的篆文与摔玉", "hinted_fate": "暗示木石前盟的坎坷命运与宝玉反叛世俗礼法的叛逆性格", "context": "第{c}回"}},
    {{"object_or_poem": "《葬花吟》与落花花冢", "hinted_fate": "暗示黛玉泪尽夭亡与红颜薄命的悲剧归宿", "context": "第{c}回"}}
  ],
  "theme_insights": [
    {{"theme": "木石前盟 vs 金玉良缘", "analysis": "通过旧帕与金锁冷香丸，强化情感自主性与封建宗法联姻的深刻冲突"}}
  ]
}}
"""
        res = await call_llm_json(prompt)
        foreshadowing = []
        insights = []
        if res and isinstance(res, dict):
            foreshadowing = res.get("symbolic_foreshadowing", [])
            insights = res.get("theme_insights", [])

        # Rule fallback for classic chapters
        if not foreshadowing:
            foreshadowing, insights = self._extract_rule_synthesis(chapter_id, content)

        return {
            "chapter_id": chapter_id,
            "symbolic_foreshadowing": foreshadowing,
            "theme_insights": insights
        }

    def _extract_rule_synthesis(self, chapter_id: str, content: str):
        c = chapter_id.lstrip("0")
        num = int(c) if c.isdigit() else 1
        foreshadowing = []
        insights = []

        if num == 1:
            foreshadowing.append({
                "object_or_poem": "《好了歌》与甄士隐注解",
                "hinted_fate": "暗示荣宁二府由极盛走向抄家破败的必然宿命，功名利禄转头皆空",
                "context": "第1回"
            })
            foreshadowing.append({
                "object_or_poem": "绛珠草与还泪前盟",
                "hinted_fate": "定下林黛玉一生用眼泪偿还神瑛侍者灌溉之恩的宿命悲剧基调",
                "context": "第1回"
            })
            insights.append({
                "theme": "盛极必衰与大梦觉醒",
                "analysis": "以神话为引，借顽石入凡尘揭示世事沧桑无常的哲学思考。"
            })
        elif num == 3:
            foreshadowing.append({
                "object_or_poem": "宝玉摔玉与‘莫失莫忘’",
                "hinted_fate": "暗示通灵宝玉虽为世俗富贵护身符，却与宝玉精神自由相悖，预兆日后出家断绝尘缘",
                "context": "第3回"
            })
            foreshadowing.append({
                "object_or_poem": "王熙凤‘恍若神仙妃子’服饰与出场",
                "hinted_fate": "华美张扬之下伏下‘机关算尽太聪明，反误了卿卿性命’的倾覆之祸",
                "context": "第3回"
            })
            insights.append({
                "theme": "初进荣府的礼法森严",
                "analysis": "借黛玉眼目展现封建簪缨贵胄世家的繁复礼节与阶级壁垒。"
            })
        elif num == 5:
            foreshadowing.append({
                "object_or_poem": "太虚幻境金陵十二钗图册判词",
                "hinted_fate": "高度概括贾府各主要女子（黛玉、宝钗、元春、探春等）的悲剧终局",
                "context": "第5回"
            })
            foreshadowing.append({
                "object_or_poem": "《红楼梦引子》与各支仙曲",
                "hinted_fate": "‘好一似食尽鸟投林，落了片白茫茫大地真干净’预言贾府无可挽回的倾覆",
                "context": "第5回"
            })
            insights.append({
                "theme": "宿命论与挽歌叙事",
                "analysis": "第五回为全书总纲与主伏笔库，所有角色的命运弧光在此定性。"
            })
        elif num == 27:
            foreshadowing.append({
                "object_or_poem": "林黛玉《葬花吟》",
                "hinted_fate": "‘一朝春尽红颜老，花落人亡两不知’，直指黛玉泪尽魂归离恨天的谶语",
                "context": "第27回"
            })
            foreshadowing.append({
                "object_or_poem": "宝钗戏蝶与脱嫌之策",
                "hinted_fate": "展现宝钗端庄掩映下的敏锐与求生机心，暗示在贾府危机中自保但也难免独守空房",
                "context": "第27回"
            })
            insights.append({
                "theme": "美之消亡与青春挽歌",
                "analysis": "芒种饯花神实为大观园群芳芳华早谢与悲剧前奏的生动隐喻。"
            })
        elif num == 34:
            foreshadowing.append({
                "object_or_poem": "贾宝玉遣晴雯赠两条旧帕",
                "hinted_fate": "旧帕题诗‘尺幅鲛绡劳解赠’，既证二人心意相通，亦成生离死别绝唱之见证物",
                "context": "第34回"
            })
            foreshadowing.append({
                "object_or_poem": "袭人密报王夫人提防宝玉",
                "hinted_fate": "伏下王夫人大抄检大观园、驱逐晴雯、促成金玉良缘之重大危机暗线",
                "context": "第34回"
            })
            insights.append({
                "theme": "情之纯粹 vs 宗法秩序压迫",
                "analysis": "宝玉挨打标志父权礼法与个性自由意识的第一次剧烈正面交锋。"
            })
        else:
            foreshadowing.append({
                "object_or_poem": f"第 {c} 回关键人物诗词与言辞",
                "hinted_fate": "暗指家族兴亡与人物性格导致之宿命演进",
                "context": f"第{c}回"
            })

        return foreshadowing, insights

    async def apply_to_wiki(self, enrichment_data: Dict[str, Any], wiki_base_dir: str) -> None:
        foreshadowing = enrichment_data.get("symbolic_foreshadowing", [])
        insights = enrichment_data.get("theme_insights", [])

        synth_dir = os.path.join(wiki_base_dir, "synthesis")
        os.makedirs(synth_dir, exist_ok=True)
        matrix_file = os.path.join(synth_dir, "hongloumeng_foreshadowing_matrix.md")

        # Load existing entries to implement Full Re-compile & merging
        all_foreshadowing = []
        all_insights = []

        if os.path.exists(matrix_file):
            # Parse existing entries if any
            with open(matrix_file, "r", encoding="utf-8") as f:
                old_text = f.read()
                # Parse markdown table
                lines = old_text.splitlines()
                for l in lines:
                    if l.startswith("|") and not l.startswith("| :---") and not l.startswith("| 物象或诗词"):
                        parts = [p.strip() for p in l.strip("|").split("|")]
                        if len(parts) >= 3:
                            all_foreshadowing.append({
                                "object_or_poem": parts[0],
                                "hinted_fate": parts[1],
                                "context": parts[2]
                            })

        # Append new foreshadowing with deduplication
        seen = set((f["object_or_poem"], f["hinted_fate"]) for f in all_foreshadowing)
        for f in foreshadowing:
            key = (f["object_or_poem"], f["hinted_fate"])
            if key not in seen:
                seen.add(key)
                all_foreshadowing.append(f)

        # Full re-compile synthesis matrix document
        doc_lines = [
            "# 跨章节伏笔与主题矩阵深度合成报告",
            "\n> 由 LLM Wiki 跨章节伏笔与主题矩阵合成器（Synthesis Matrix Builder）驱动，基于章回触发全量 Re-compile。\n",
            "---",
            "## 🔮 核心伏笔、象征物象与命运谶语对照矩阵\n",
            "| 物象或诗词 (Object/Poem) | 暗示的命运/结局 (Hinted Fate) | 章节出处 (Context) |",
            "| :--- | :--- | :--- |"
        ]

        for item in all_foreshadowing:
            doc_lines.append(f"| {item['object_or_poem']} | {item['hinted_fate']} | {item.get('context', '综合线索')} |")

        doc_lines.extend([
            "\n---",
            "## 🧭 核心主题演进深度透析",
            "\n```mermaid",
            "graph LR",
            "    A[太虚幻境判词纲领] -->|命定还泪| B[木石前盟 (宝黛互知)]",
            "    A -->|宗族维系| C[金玉良缘 (世俗礼法)]",
            "    B -->|赠帕传情| D[大观园纯情抗争]",
            "    C -->|送药劝诫| E[封建家族自保]",
            "    D -->|抄检大观园| F[群芳离散、白茫茫大地真干净]",
            "    E -->|家族被抄| F",
            "```\n"
        ])

        if insights:
            doc_lines.append("### 💡 本轮增量解析透析\n")
            for ins in insights:
                doc_lines.append(f"- **{ins['theme']}**：{ins['analysis']}")

        with open(matrix_file, "w", encoding="utf-8") as f:
            f.write("\n".join(doc_lines))
