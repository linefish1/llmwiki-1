import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Network,
  MapPin,
  Sparkles,
  Layers,
  Terminal,
  RefreshCw,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileCode,
  Sliders,
  Filter,
} from "lucide-react";
import mermaid from "mermaid";

interface ChapterItem {
  id: string;
  filename: string;
  title: string;
  chapterNum: number;
  size: number;
  preview: string;
}

interface AliasEntry {
  canonical_name: string;
  aliases: string[];
  type: string;
}

interface TimelineItem {
  time: string;
  title: string;
  desc: string;
}

interface EnrichmentPanelProps {
  onNavigateLink: (target: string) => void;
  onOpenFile?: (path: string) => void;
  onRefreshWorkspace?: () => void;
}

export const EnrichmentPanel: React.FC<EnrichmentPanelProps> = ({
  onNavigateLink,
  onOpenFile,
  onRefreshWorkspace,
}) => {
  const [namespace, setNamespace] = useState("books/hongloumeng");
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>("034");
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([
    "alias_resolver",
    "relationship",
    "timeline",
    "spatial",
    "synthesis_matrix",
  ]);
  const [dryRun, setDryRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState<string>("");
  const [runSuccess, setRunSuccess] = useState<boolean | null>(null);

  // Sub-tabs: "runner" | "alias" | "timeline" | "relationship" | "spatial_matrix"
  const [subTab, setSubTab] = useState<
    "runner" | "alias" | "timeline" | "relationship" | "spatial_matrix"
  >("runner");

  // Alias map state
  const [aliasList, setAliasList] = useState<AliasEntry[]>([]);
  const [aliasSearch, setAliasSearch] = useState("");
  const [newCanonical, setNewCanonical] = useState("");
  const [newAliasTag, setNewAliasTag] = useState("");
  const [newType, setNewType] = useState("Person");
  const [aliasSavedMsg, setAliasSavedMsg] = useState("");

  // Timeline events state
  const [timelineEvents, setTimelineEvents] = useState<TimelineItem[]>([]);

  // Spatial & Synthesis content
  const [spatialContent, setSpatialContent] = useState("");
  const [synthesisContent, setSynthesisContent] = useState("");

  // Mermaid container ref
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Load initial data
  const loadData = async () => {
    try {
      // 1. Chapters
      const chapRes = await fetch(`/api/enrichment/chapters?namespace=${namespace}`);
      const chapData = await chapRes.json();
      if (chapData.chapters) {
        setChapters(chapData.chapters);
        if (chapData.chapters.length > 0 && !selectedChapter) {
          setSelectedChapter(chapData.chapters[0].id);
        }
      }

      // 2. Alias map
      const aliasRes = await fetch(`/api/enrichment/alias-map?namespace=${namespace}`);
      const aliasData = await aliasRes.json();
      if (aliasData.entity_mappings) {
        setAliasList(aliasData.entity_mappings);
      }

      // 3. Timeline
      const timeRes = await fetch(`/api/enrichment/timeline?namespace=${namespace}`);
      const timeData = await timeRes.json();
      if (timeData.events) {
        setTimelineEvents(timeData.events);
      }

      // 4. Spatial
      const spatRes = await fetch(`/api/enrichment/spatial?namespace=${namespace}`);
      const spatData = await spatRes.json();
      if (spatData.content) {
        setSpatialContent(spatData.content);
      }

      // 5. Synthesis
      const synthRes = await fetch(`/api/enrichment/synthesis?namespace=${namespace}`);
      const synthData = await synthRes.json();
      if (synthData.content) {
        setSynthesisContent(synthData.content);
      }
    } catch (e) {
      console.error("Failed loading enrichment data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [namespace]);

  // Render mermaid whenever spatial or relationship tab opens
  useEffect(() => {
    if (subTab === "relationship" || subTab === "spatial_matrix") {
      setTimeout(() => {
        if (mermaidRef.current) {
          const els = mermaidRef.current.querySelectorAll(".mermaid-target");
          els.forEach(async (el, idx) => {
            const code = el.getAttribute("data-mermaid");
            if (code && !el.getAttribute("data-rendered")) {
              try {
                const id = `enrich-mermaid-${Date.now()}-${idx}`;
                const { svg } = await mermaid.render(id, code);
                el.innerHTML = svg;
                el.setAttribute("data-rendered", "true");
              } catch (err) {
                console.warn("Mermaid error:", err);
              }
            }
          });
        }
      }, 100);
    }
  }, [subTab, spatialContent, synthesisContent]);

  // Run Pipeline
  const handleRunPipeline = async () => {
    setIsRunning(true);
    setRunLog(`[Pipeline] 启动处理章回 ch${selectedChapter}...\n命名空间: ${namespace}\n启用插件: ${selectedPlugins.join(", ")}\n模式: ${dryRun ? "Dry-Run" : "Commit"}\n`);
    setRunSuccess(null);

    try {
      const res = await fetch("/api/enrichment/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace,
          chapter: selectedChapter,
          plugins: selectedPlugins.join(","),
          dryRun,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRunLog((prev) => prev + "\n" + (data.stdout || "执行成功！"));
        setRunSuccess(true);
        // Reload wiki data & refresh workspace
        await loadData();
        if (onRefreshWorkspace) onRefreshWorkspace();
      } else {
        setRunLog((prev) => prev + "\n[ERROR] " + (data.stderr || data.error || "执行失败"));
        setRunSuccess(false);
      }
    } catch (e: any) {
      setRunLog((prev) => prev + "\n[FATAL] " + e.message);
      setRunSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  // Toggle plugin
  const togglePlugin = (pId: string) => {
    setSelectedPlugins((prev) =>
      prev.includes(pId) ? prev.filter((x) => x !== pId) : [...prev, pId]
    );
  };

  // Save new alias
  const handleAddAlias = async () => {
    if (!newCanonical.trim() || !newAliasTag.trim()) return;
    const cname = newCanonical.trim();
    const tag = newAliasTag.trim();

    const existingIndex = aliasList.findIndex((x) => x.canonical_name === cname);
    let updated: AliasEntry[];

    if (existingIndex >= 0) {
      const current = aliasList[existingIndex];
      const newAliases = Array.from(new Set([...current.aliases, tag]));
      updated = [...aliasList];
      updated[existingIndex] = { ...current, aliases: newAliases };
    } else {
      updated = [
        ...aliasList,
        {
          canonical_name: cname,
          aliases: [tag],
          type: newType,
        },
      ];
    }

    setAliasList(updated);
    setNewAliasTag("");

    try {
      const res = await fetch("/api/enrichment/alias-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace,
          entity_mappings: updated,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAliasSavedMsg("别名已成功持久化更新！");
        setTimeout(() => setAliasSavedMsg(""), 3000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Filtered aliases
  const filteredAliases = aliasList.filter(
    (item) =>
      item.canonical_name.toLowerCase().includes(aliasSearch.toLowerCase()) ||
      item.aliases.some((a) => a.toLowerCase().includes(aliasSearch.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0D11] text-[#E2E8F0] overflow-hidden">
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141418] border-b border-[#2D2D33]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wide text-white">
                书籍类补充内容增强管线 (Enrichment Pipeline)
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 font-mono font-semibold">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
              <span>命名空间:</span>
              <span className="font-mono text-slate-300 bg-[#1E1E24] px-1.5 py-0.2 rounded border border-[#2D2D33]">
                {namespace}
              </span>
              <span>• 章回数: {chapters.length}</span>
              <span>• 别名收录: {aliasList.length}</span>
              <span>• 编年史事件: {timelineEvents.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-[#0A0A0C] p-1 rounded-lg border border-[#2D2D33]">
          <button
            onClick={() => setSubTab("runner")}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "runner"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-slate-200"
            }`}
          >
            <Play className="w-3.5 h-3.5" /> 管线控制台
          </button>
          <button
            onClick={() => setSubTab("alias")}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "alias"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> 别名字典 ({aliasList.length})
          </button>
          <button
            onClick={() => setSubTab("timeline")}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "timeline"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> 事件编年史 ({timelineEvents.length})
          </button>
          <button
            onClick={() => setSubTab("relationship")}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "relationship"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-slate-200"
            }`}
          >
            <Network className="w-3.5 h-3.5" /> 关系网络拓扑
          </button>
          <button
            onClick={() => setSubTab("spatial_matrix")}
            className={`px-3 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === "spatial_matrix"
                ? "bg-[#4F46E5] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-slate-200"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> 空间与伏笔矩阵
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={mermaidRef}>
        {/* SUBTAB 1: RUNNER */}
        {subTab === "runner" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Pipeline Configuration Card */}
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                    PIPELINE DISPATCH & CONFIGURATION (管线调度与配置)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#94A3B8]">运行模式:</span>
                  <button
                    onClick={() => setDryRun(!dryRun)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium border cursor-pointer transition-colors ${
                      dryRun
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    }`}
                  >
                    {dryRun ? "🧪 Dry-Run (仅提取验证，不落盘)" : "⚡ Commit (幂等持久化写回)"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chapter Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    目标章回选择 (Target Chapter)
                  </label>
                  <select
                    value={selectedChapter}
                    onChange={(e) => setSelectedChapter(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="all">🌟 全书所有章回 (All Available Chapters)</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        第 {c.chapterNum} 回: {c.title} ({c.filename})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    当前选定章回将作为数据源，依次推入 5 个补充增强处理器。
                  </p>
                </div>

                {/* Namespace indicator */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    书籍命名空间 (Namespace)
                  </label>
                  <input
                    type="text"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-[#94A3B8] mt-1">
                    隔离不同名著书目的实体命名空间，如 <code className="text-indigo-400">books/hongloumeng</code>
                  </p>
                </div>
              </div>

              {/* 5 Processors Checkboxes */}
              <div className="mt-4 pt-4 border-t border-[#2D2D33]">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  启用补充增强处理器 (Enrichment Processors - 5大核心模块)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "alias_resolver",
                      name: "1. 别名归一化",
                      desc: "加载 alias_map.json，解决同人异名、称号与代词归一",
                      tag: "alias_resolver",
                    },
                    {
                      id: "relationship",
                      name: "2. 关系网抽取 (Mermaid)",
                      desc: "抽取人物与概念三元组，边去重后生成 Mermaid 网络图",
                      tag: "relationship",
                    },
                    {
                      id: "timeline",
                      name: "3. 时间轴与编年史",
                      desc: "提取章回时间锚点，输出 <Timeline> 并按 AST 时序重排",
                      tag: "timeline",
                    },
                    {
                      id: "spatial",
                      name: "4. 空间建筑解构",
                      desc: "解析大观园/荣国府场景移动轨迹与建筑物理结构",
                      tag: "spatial",
                    },
                    {
                      id: "synthesis_matrix",
                      name: "5. 伏笔与主题矩阵",
                      desc: "提炼判词谶语象征物象，触发全量 Re-compile 对比报告",
                      tag: "synthesis_matrix",
                    },
                  ].map((p) => {
                    const active = selectedPlugins.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePlugin(p.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          active
                            ? "bg-indigo-950/20 border-indigo-500/50 text-slate-200"
                            : "bg-[#0A0A0C] border-[#2D2D33] text-[#94A3B8] hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">{p.name}</span>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {}}
                            className="rounded border-[#2D2D33] text-indigo-600 cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">{p.desc}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1 rounded">
                          {p.tag}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center justify-between pt-4 border-t border-[#2D2D33]">
                <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <span>已启用 {selectedPlugins.length}/5 个增强处理器</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={loadData}
                    className="px-3 py-1.5 rounded-lg border border-[#2D2D33] bg-[#1A1A20] text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重新载入数据
                  </button>
                  <button
                    onClick={handleRunPipeline}
                    disabled={isRunning || selectedPlugins.length === 0}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> 执行管线中...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" /> 立即执行增强管线
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Terminal Logs Output */}
            <div className="bg-[#0A0A0C] border border-[#2D2D33] rounded-xl p-4 shadow-inner">
              <div className="flex items-center justify-between pb-2 border-b border-[#2D2D33] mb-2 font-mono text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PIPELINE EXECUTION LOGS</span>
                </div>
                {runSuccess !== null && (
                  <span
                    className={`flex items-center gap-1 text-[11px] font-semibold ${
                      runSuccess ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {runSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> 执行成功 (Success)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> 存在异常 (Error)
                      </>
                    )}
                  </span>
                )}
              </div>
              <pre className="text-xs font-mono text-slate-300 max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {runLog || "> 准备就绪，点击上方‘立即执行增强管线’开始抽取与合成。"}
              </pre>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ALIAS MAP */}
        {subTab === "alias" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    ENTITY ALIAS RESOLUTION DICTIONARY (别名字典库)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    基于 <code className="text-indigo-400">alias_map.json</code> 进行别名归一化与 Set 增量去重，保障知识库统一引用
                  </p>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={aliasSearch}
                    onChange={(e) => setAliasSearch(e.target.value)}
                    placeholder="搜索主名或别名..."
                    className="bg-[#0A0A0C] border border-[#2D2D33] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 w-56 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Add New Alias form */}
              <div className="bg-[#0A0A0C] p-3 rounded-lg border border-[#2D2D33] mb-4">
                <span className="text-[11px] font-bold text-slate-300 block mb-2 font-mono">
                  + 手动注册/扩充别名条目 (ADD ALIAS MAPPING)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="主实体规范名 (如: 贾宝玉)"
                    value={newCanonical}
                    onChange={(e) => setNewCanonical(e.target.value)}
                    className="bg-[#141418] border border-[#2D2D33] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="新增别名/称号 (如: 混世魔王)"
                    value={newAliasTag}
                    onChange={(e) => setNewAliasTag(e.target.value)}
                    className="bg-[#141418] border border-[#2D2D33] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="bg-[#141418] border border-[#2D2D33] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Person">人物 (Person)</option>
                    <option value="Location">地点空间 (Location)</option>
                    <option value="Artifact">关键物象 (Artifact)</option>
                    <option value="Concept">概念 (Concept)</option>
                  </select>
                  <button
                    onClick={handleAddAlias}
                    disabled={!newCanonical.trim() || !newAliasTag.trim()}
                    className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> 扩充并持久化
                  </button>
                </div>
                {aliasSavedMsg && (
                  <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {aliasSavedMsg}
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-[#2D2D33]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0A0C] text-[#94A3B8] font-mono border-b border-[#2D2D33]">
                    <tr>
                      <th className="py-2.5 px-3">主实体规范名称 (Canonical)</th>
                      <th className="py-2.5 px-3">类型 (Type)</th>
                      <th className="py-2.5 px-3">已绑定别名 / 称号列表 (Aliases)</th>
                      <th className="py-2.5 px-3 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2D33] bg-[#141418]">
                    {filteredAliases.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#1A1A20] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-1.5">
                          <button
                            onClick={() => onNavigateLink(item.canonical_name)}
                            className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {item.canonical_name}
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                              item.type === "Person"
                                ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                                : item.type === "Location"
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            }`}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {item.aliases.map((al, aIdx) => (
                              <span
                                key={aIdx}
                                className="px-1.5 py-0.5 rounded bg-[#0A0A0C] text-slate-300 border border-[#2D2D33] text-[11px]"
                              >
                                {al}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onNavigateLink(item.canonical_name)}
                            className="text-[11px] text-indigo-400 hover:text-white cursor-pointer"
                          >
                            查看实体文档 →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: TIMELINE */}
        {subTab === "timeline" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    CHRONOLOGICAL EVENT TIMELINE (事件演进编年史)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    时间轴编年史引擎基于 AST 解析时序单调递增排列，支持在实体页面直接呈现
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onOpenFile) {
                      onOpenFile("wiki/synthesis/chronological_timeline.md");
                    }
                  }}
                  className="px-3 py-1 rounded bg-[#1A1A20] hover:bg-[#25252C] border border-[#2D2D33] text-xs text-indigo-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" /> 打开编年史原文档
                </button>
              </div>

              {timelineEvents.length === 0 ? (
                <div className="py-12 text-center text-[#94A3B8] text-xs">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                  尚未生成时间轴。请在“管线控制台”中勾选“3. 时间轴与编年史”执行提取。
                </div>
              ) : (
                <div className="relative pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-indigo-900">
                  {timelineEvents.map((ev, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-[2.15rem] top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 group-hover:scale-125 transition-transform" />
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-mono font-bold">
                          {ev.time}
                        </span>
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {ev.title}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed bg-[#0A0A0C] p-3 rounded-lg border border-[#2D2D33] mt-1.5 shadow-sm">
                        {ev.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBTAB 4: RELATIONSHIP */}
        {subTab === "relationship" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-400" />
                    DYNAMIC MERMAID RELATIONSHIP TOPOLOGY (动态关系网络拓扑)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    基于人物关系三元组增量抽取，自动进行图边去重，并注入各人物实体文档
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onOpenFile) {
                      onOpenFile("wiki/synthesis/relationship_graph.md");
                    }
                  }}
                  className="px-3 py-1 rounded bg-[#1A1A20] hover:bg-[#25252C] border border-[#2D2D33] text-xs text-indigo-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" /> 打开关系网原文档
                </button>
              </div>

              {/* Sample Mermaid Render */}
              <div className="p-4 bg-[#0A0A0C] rounded-lg border border-[#2D2D33] my-4 overflow-x-auto">
                <div
                  className="mermaid-target flex justify-center py-2"
                  data-mermaid={`graph LR
    subgraph 贾府核心关系网络拓扑
        A[贾宝玉] -->|木石前盟 / 第34回赠帕| B[林黛玉]
        A -->|金玉良缘 / 送药探望| C[薛宝钗]
        A -->|笞挞训诫| D[贾政]
        A -->|钟爱溺爱| E[贾母]
        B -->|芒种节葬花| F[大观园]
        C -->|滴翠亭戏蝶| G[滴翠亭]
        H[王熙凤] -->|协理调停| I[王夫人]
        A -->|互诉衷肠| J[晴雯]
        A -->|规劝自保| K[袭人]
    end
    style A fill:#4338ca,stroke:#818cf8,stroke-width:2px
    style B fill:#831843,stroke:#f472b6,stroke-width:2px
    style C fill:#065f46,stroke:#34d399,stroke-width:2px`}
                />
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-200 mb-2 font-mono">
                  已抽取三元组特征清单 (EXTRACTED TRIPLES)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { s: "贾宝玉", r: "赠送旧帕 (情之坚贞)", t: "林黛玉", c: "第 34 回" },
                    { s: "薛宝钗", r: "送丸药探望 (礼法自保)", t: "贾宝玉", c: "第 34 回" },
                    { s: "贾政", r: "笞挞训诫 (宗法管教)", t: "贾宝玉", c: "第 34 回" },
                    { s: "林黛玉", r: "初入荣国府 (寄人篱下)", t: "贾母 / 荣国府", c: "第 3 回" },
                    { s: "薛宝钗", r: "滴翠亭戏彩蝶 (机智脱嫌)", t: "大观园", c: "第 27 回" },
                    { s: "林黛玉", r: "花冢葬落花 (红颜薄命谶语)", t: "大观园", c: "第 27 回" },
                  ].map((tr, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-[#0A0A0C] border border-[#2D2D33] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-indigo-400">[[{tr.s}]]</span>
                        <span className="text-[#94A3B8] text-[11px]">→ {tr.r} →</span>
                        <span className="font-semibold text-emerald-400">[[{tr.t}]]</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                        {tr.c}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 5: SPATIAL & FORESHADOWING MATRIX */}
        {subTab === "spatial_matrix" && (
          <div className="space-y-4 max-w-5xl mx-auto">
            {/* Spatial Architecture Card */}
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    SPATIAL DECONSTRUCTION & MOVEMENT (空间场景与移动轨迹)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    解构大观园与荣国府核心建筑层级，追踪各角色在各章回间的空间位移
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onOpenFile) {
                      onOpenFile("wiki/synthesis/spatial_architecture.md");
                    }
                  }}
                  className="px-3 py-1 rounded bg-[#1A1A20] hover:bg-[#25252C] border border-[#2D2D33] text-xs text-indigo-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" /> 查看空间解构文档
                </button>
              </div>

              {/* Spatial Layout Mermaid */}
              <div className="p-4 bg-[#0A0A0C] rounded-lg border border-[#2D2D33] my-3 overflow-x-auto">
                <div
                  className="mermaid-target flex justify-center py-2"
                  data-mermaid={`graph TB
    subgraph 大观园与贾府空间架构
        subgraph 大观园
            S1[潇湘馆 - 翠竹掩映 林黛玉]
            S2[怡红院 - 红蕉绿柳 贾宝玉]
            S3[蘅芜苑 - 蘅芷清芬 薛宝钗]
            S4[滴翠亭 - 水阁戏蝶]
            S5[花冢 - 掩埋落花处]
        end
        subgraph 荣国府正堂
            S6[荣禧堂 - 皇帝题额]
            S7[贾母正房院]
            S8[碧纱橱 - 黛玉初宿]
        end
    end`}
                />
              </div>
            </div>

            {/* Foreshadowing Matrix Card */}
            <div className="bg-[#141418] border border-[#2D2D33] rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D2D33] mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    FORESHADOWING & THEMATIC SYNTHESIS (跨章节伏笔与主题矩阵)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    物象谶语、判词暗线与家族兴亡全量 Re-compile 合成对比矩阵
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onOpenFile) {
                      onOpenFile("wiki/synthesis/hongloumeng_foreshadowing_matrix.md");
                    }
                  }}
                  className="px-3 py-1 rounded bg-[#1A1A20] hover:bg-[#25252C] border border-[#2D2D33] text-xs text-indigo-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" /> 查看主题矩阵文档
                </button>
              </div>

              {/* Foreshadowing Table */}
              <div className="overflow-x-auto rounded-lg border border-[#2D2D33]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0A0C] text-[#94A3B8] font-mono border-b border-[#2D2D33]">
                    <tr>
                      <th className="py-2.5 px-3">物象或诗词 (Symbolic Object / Poem)</th>
                      <th className="py-2.5 px-3">暗示的命运 / 结局 (Hinted Fate)</th>
                      <th className="py-2.5 px-3">章节出处 (Context)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2D2D33] bg-[#141418]">
                    {[
                      {
                        item: "《好了歌》与甄士隐解注",
                        fate: "暗示荣宁二府由极盛走向抄家破败的必然宿命，功名利禄转头皆空",
                        ctx: "第 1 回",
                      },
                      {
                        item: "宝玉摔玉与‘莫失莫忘’",
                        fate: "通灵宝玉与宝玉精神自由相悖，预兆出家断绝尘缘",
                        ctx: "第 3 回",
                      },
                      {
                        item: "太虚幻境金陵十二钗图册判词",
                        fate: "高度概括贾府各主要女子（黛玉、宝钗、元春等）的悲剧终局",
                        ctx: "第 5 回",
                      },
                      {
                        item: "林黛玉《葬花吟》与花冢",
                        fate: "‘一朝春尽红颜老，花落人亡两不知’，直指黛玉泪尽夭亡谶语",
                        ctx: "第 27 回",
                      },
                      {
                        item: "贾宝玉遣晴雯赠两条旧帕",
                        fate: "‘尺幅鲛绡劳解赠’，成二人心意相通与生离死别绝唱见证物",
                        ctx: "第 34 回",
                      },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#1A1A20] transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-indigo-300">
                          {row.item}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 leading-relaxed">
                          {row.fate}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-mono">
                            {row.ctx}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
