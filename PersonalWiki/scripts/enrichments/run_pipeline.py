#!/usr/bin/env python3
"""
LLM Wiki Enrichment Pipeline Runner
Supports:
- --namespace books/hongloumeng
- --chapter 034 (or 003, 027, etc.)
- --plugin / --plugins
- --dry-run
"""
import os
import sys
import argparse
import asyncio
import json

# Ensure scripts/enrichments is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from base_plugin import BaseEnrichmentPlugin
from alias_resolver_plugin import AliasResolverPlugin
from relationship_plugin import MermaidRelationshipPlugin
from timeline_plugin import TimelinePlugin
from spatial_plugin import SpatialMappingPlugin
from synthesis_matrix_plugin import SynthesisMatrixPlugin

PLUGIN_REGISTRY = {
    "alias_resolver": AliasResolverPlugin,
    "relationship": MermaidRelationshipPlugin,
    "mermaid_relationship_extractor": MermaidRelationshipPlugin,
    "timeline": TimelinePlugin,
    "chronological_timeline_extractor": TimelinePlugin,
    "spatial": SpatialMappingPlugin,
    "spatial_mapping": SpatialMappingPlugin,
    "synthesis_matrix": SynthesisMatrixPlugin,
    "synthesis": SynthesisMatrixPlugin
}

def resolve_paths(workspace: str, namespace: str):
    # Locate workspace root
    base = workspace
    if not base or not os.path.exists(base):
        if os.path.exists("PersonalWiki"):
            base = "PersonalWiki"
        elif os.path.exists("wiki"):
            base = "."
        else:
            base = "."

    raw_dir = os.path.join(base, "raw", namespace)
    wiki_dir = os.path.join(base, "wiki")
    if not os.path.exists(raw_dir):
        # try without books prefix or alternative
        alt_raw = os.path.join(base, "raw", namespace.replace("books/", ""))
        if os.path.exists(alt_raw):
            raw_dir = alt_raw

    return base, raw_dir, wiki_dir

async def run_pipeline_main():
    parser = argparse.ArgumentParser(description="LLM Wiki 书籍类补充内容增强管线")
    parser.add_argument("--namespace", default="books/hongloumeng", help="书籍命名空间, 如 books/hongloumeng")
    parser.add_argument("--chapter", default=None, help="指定章节标识, 如 034 或 ch034, 留空表示处理首批可用章节")
    parser.add_argument("--plugin", default=None, help="指定单个插件名称, 如 alias_resolver")
    parser.add_argument("--plugins", default=None, help="逗号分隔的插件列表, 如 relationship,timeline 或 all")
    parser.add_argument("--dry-run", action="store_true", help="演练模式，仅提取并在终端打印，不写回文件系统")
    parser.add_argument("--workspace", default=None, help="PersonalWiki 工作区路径")
    parser.add_argument("--json", action="store_true", help="以完整 JSON 输出结果")

    args = parser.parse_args()

    base_dir, raw_dir, wiki_dir = resolve_paths(args.workspace, args.namespace)

    # Determine which plugins to run
    target_plugins = []
    if args.plugin:
        target_plugins.append(args.plugin.strip())
    elif args.plugins:
        if args.plugins.strip().lower() == "all":
            target_plugins = ["alias_resolver", "relationship", "timeline", "spatial", "synthesis_matrix"]
        else:
            target_plugins = [p.strip() for p in args.plugins.split(",") if p.strip()]
    else:
        target_plugins = ["alias_resolver", "relationship", "timeline", "spatial", "synthesis_matrix"]

    print(f"==================================================")
    print(f"🚀 LLM Wiki 补充内容增强管线启动")
    print(f"   命名空间: {args.namespace}")
    print(f"   工作区:   {base_dir}")
    print(f"   启用插件: {', '.join(target_plugins)}")
    print(f"   演练模式: {'是 (Dry-Run: 不写盘)' if args.dry_run else '否 (增量持久化)'}")
    print(f"==================================================")

    # Find chapters
    chapter_files = []
    if os.path.exists(raw_dir):
        files = sorted(os.listdir(raw_dir))
        for f in files:
            if f.endswith(".md"):
                chapter_files.append((f, os.path.join(raw_dir, f)))

    if not chapter_files:
        print(f"[警告] 未在 {raw_dir} 中找到章节 Markdown 文件。")
        return

    # Filter chapter if specified
    if args.chapter:
        if args.chapter.lower() == "all":
            pass  # process all
        else:
            req_norm = args.chapter.lower().replace("ch", "").lstrip("0")
            matched = []
            for fname, fpath in chapter_files:
                chap_clean = fname.replace(".md", "").lower().replace("ch", "").lstrip("0")
                if chap_clean == req_norm or args.chapter in fname:
                    matched.append((fname, fpath))
            if matched:
                chapter_files = matched
            else:
                print(f"[提示] 未找到精确匹配章回 {args.chapter}，选用可用列表首篇：{chapter_files[0][0]}")
                chapter_files = [chapter_files[0]]
    else:
        print(f"[提示] 未指定 --chapter，默认处理首章：{chapter_files[0][0]} (如需处理全部可指定 --chapter all)")
        chapter_files = [chapter_files[0]]

    # Load existing entities
    entities_dir = os.path.join(wiki_dir, "entities")
    existing_entities = []
    if os.path.exists(entities_dir):
        existing_entities = [f.replace(".md", "") for f in os.listdir(entities_dir) if f.endswith(".md")]

    all_results = {}

    # Process each selected chapter
    for fname, fpath in chapter_files:
        chap_id = fname.replace(".md", "").replace("ch", "")
        print(f"\n📖 [处理章回] {fname} (ID: {chap_id})")
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        chap_summary = {}

        for p_name in target_plugins:
            p_class = PLUGIN_REGISTRY.get(p_name)
            if not p_class:
                print(f"  ❌ 未知插件: {p_name}")
                continue

            plugin_inst: BaseEnrichmentPlugin = p_class(
                book_namespace=args.namespace,
                config={"wiki_base_dir": wiki_dir, "workspace": base_dir}
            )

            print(f"  ⚡ 执行插件: {plugin_inst.plugin_name} ...")
            try:
                enrichment_data = await plugin_inst.process_chapter(chap_id, content, existing_entities)
                chap_summary[plugin_inst.plugin_name] = enrichment_data

                if not args.dry_run:
                    await plugin_inst.apply_to_wiki(enrichment_data, wiki_dir)
                    print(f"     ✅ 增强数据已幂等更新至 Wiki: {wiki_dir}")
                else:
                    print(f"     🔍 [Dry-Run] 提取完成 (未提交磁盘)")

            except Exception as e:
                print(f"     ❌ 插件执行失败: {e}")

        all_results[chap_id] = chap_summary

    if args.json or args.dry_run:
        print("\n--- 提取数据详情 (Enrichment Extraction Data) ---")
        print(json.dumps(all_results, ensure_ascii=False, indent=2))

    print(f"\n🎉 增强管线执行完成！共处理 {len(chapter_files)} 个章节。")

if __name__ == "__main__":
    asyncio.run(run_pipeline_main())
