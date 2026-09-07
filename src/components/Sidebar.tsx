import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  UploadCloud,
  Network,
  Settings,
  Search,
  Terminal,
  Clock,
  ChevronRight,
  ChevronDown,
  Trash2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { WikiFileInfo, MainTab, WikiStats } from "../types";

interface SidebarProps {
  files: WikiFileInfo[];
  selectedFilePath: string | null;
  currentTab: MainTab;
  stats: WikiStats | null;
  onSelectFile: (path: string) => void;
  onSelectTab: (tab: MainTab) => void;
  onRequestDelete: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedFilePath,
  currentTab,
  stats,
  onSelectFile,
  onSelectTab,
  onRequestDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    entities: true,
    synthesis: true,
    summaries: false,
    rawArchive: true,
    rawRejected: false,
    schemaConfig: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Filtered files
  const filteredFiles = files.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFilesByCategory = (category: WikiFileInfo["category"]) =>
    filteredFiles.filter((f) => f.category === category);

  const entityFiles = getFilesByCategory("wiki_entity");
  const synthFiles = getFilesByCategory("wiki_synthesis");
  const summaryFiles = getFilesByCategory("wiki_summary");
  const rawArchiveFiles = getFilesByCategory("raw_archive");
  const rejectedFiles = getFilesByCategory("raw_rejected");
  const configFiles = filteredFiles.filter(
    (f) => f.category === "schema" || f.category === "config" || f.category === "script"
  );

  return (
    <aside className="w-64 bg-[#141418] text-[#E2E8F0] flex flex-col h-full border-r border-[#2D2D33] select-none shrink-0 font-sans text-xs">
      {/* Workspace Header & Path */}
      <div className="p-3 border-b border-[#2D2D33] bg-[#0A0A0C]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#4F46E5] flex items-center justify-center text-white font-mono font-bold text-[11px] shadow-xs">
              W
            </div>
            <div>
              <h1 className="font-bold text-xs text-white leading-tight tracking-wider">AUTO-WIKI</h1>
              <span className="text-[9px] text-[#818CF8] font-mono">AUTONOMOUS MASTER</span>
            </div>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-[#4ADE80] font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></span>
            DAEMON
          </span>
        </div>

        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded bg-[#141418] border border-[#2D2D33] text-[10px] font-mono text-[#94A3B8]">
          <HardDrive className="w-3 h-3 text-[#4F46E5]" />
          <span className="truncate">D:\PersonalWiki</span>
        </div>
      </div>

      {/* Top Operations Navigation */}
      <div className="p-2 border-b border-[#2D2D33] space-y-1 bg-[#141418]">
        <button
          onClick={() => onSelectTab("upload")}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "upload"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>1. 资料上传 (Ingest)</span>
          </div>
          <span className="text-[9px] font-mono opacity-80">FORMAT GUARD</span>
        </button>

        <button
          onClick={() => onSelectTab("graph")}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "graph"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="w-3.5 h-3.5" />
            <span>双链知识图谱 (Graph)</span>
          </div>
          <span className="text-[9px] font-mono opacity-80">TOPOLOGY</span>
        </button>

        <button
          onClick={() => onSelectTab("control")}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "control"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" />
            <span>5. AI 协议与路由 (Control)</span>
          </div>
          <span className="text-[9px] font-mono opacity-80">ROUTER</span>
        </button>

        <button
          onClick={() => onSelectTab("mcp")}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "mcp"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>FastMCP 外部服务 (Tools)</span>
          </div>
          <span className="text-[9px] font-mono opacity-80">CLIENTS</span>
        </button>

        <button
          onClick={() => {
            onSelectTab("timeline");
            onSelectFile("wiki/shturl.md");
          }}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "timeline"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>演进时间线 (shturl.md)</span>
          </div>
          <span className="text-[9px] font-mono opacity-80">AUDIT</span>
        </button>

        <button
          onClick={() => onSelectTab("enrichment")}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition cursor-pointer ${
            currentTab === "enrichment"
              ? "bg-[#4F46E5] text-white font-medium shadow-xs"
              : "hover:bg-[#1A1A20] text-[#94A3B8] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-100">书籍增强管线 (Enrich)</span>
          </div>
          <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1 rounded border border-amber-500/20">
            5 PLUGINS
          </span>
        </button>
      </div>

      {/* Instant Search Box */}
      <div className="p-2 border-b border-[#2D2D33] bg-[#0A0A0C]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索实体、概念、原始文档..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-[#141418] border border-[#2D2D33] rounded text-xs text-[#E2E8F0] placeholder-[#94A3B8]/60 outline-none focus:border-[#4F46E5] font-mono transition"
          />
        </div>
      </div>

      {/* Workspace Directory Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 text-xs bg-[#141418]">
        {/* Workspace Label */}
        <div className="text-[10px] uppercase font-bold text-[#94A3B8] tracking-widest px-1">
          WORKSPACE
        </div>

        {/* Global Catalog: wiki/index.md */}
        <div>
          <button
            onClick={() => {
              onSelectTab("view");
              onSelectFile("wiki/index.md");
            }}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left transition cursor-pointer font-mono text-[11px] ${
              selectedFilePath === "wiki/index.md"
                ? "bg-[#4F46E5]/20 text-[#818CF8] font-medium border-l-2 border-[#4F46E5]"
                : "text-[#94A3B8] hover:text-white hover:bg-[#1A1A20]"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="truncate">wiki/index.md (全局目录)</span>
          </button>
        </div>

        {/* 1. wiki/entities (Core Entities) */}
        <div>
          <button
            onClick={() => toggleSection("entities")}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] hover:text-white py-1 px-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              {openSections.entities ? (
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
              )}
              <span className="text-[#4F46E5]">📂</span>
              <span>wiki/entities</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#1A1A20] border border-[#2D2D33] text-[9px] text-[#818CF8] font-mono">
              {entityFiles.length}
            </span>
          </button>

          {openSections.entities && (
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#2D2D33] font-mono text-xs">
              {entityFiles.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-[#4F46E5]/25 text-[#818CF8] font-medium border-l-2 border-[#4F46E5]"
                      : "text-[#94A3B8] hover:bg-[#1A1A20] hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectTab("view");
                    onSelectFile(file.path);
                  }}
                >
                  <span className="truncate pr-1 text-[11px]">📄 [[{file.name.replace(".md", "")}]]</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition cursor-pointer"
                    title="删除实体"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. wiki/synthesis (Reports) */}
        <div>
          <button
            onClick={() => toggleSection("synthesis")}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] hover:text-white py-1 px-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              {openSections.synthesis ? (
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
              )}
              <span className="text-purple-400">📂</span>
              <span>wiki/synthesis</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#1A1A20] border border-[#2D2D33] text-[9px] text-purple-300 font-mono">
              {synthFiles.length}
            </span>
          </button>

          {openSections.synthesis && (
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#2D2D33] font-mono text-xs">
              {synthFiles.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-purple-950/40 text-purple-300 font-medium border-l-2 border-purple-500"
                      : "text-[#94A3B8] hover:bg-[#1A1A20] hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectTab("view");
                    onSelectFile(file.path);
                  }}
                >
                  <span className="truncate pr-1 text-[11px]">📄 {file.name.replace(".md", "")}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. raw/archive (Raw Materials) */}
        <div>
          <button
            onClick={() => toggleSection("rawArchive")}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] hover:text-white py-1 px-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              {openSections.rawArchive ? (
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
              )}
              <span className="text-emerald-400">📂</span>
              <span>raw/archive</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#1A1A20] border border-[#2D2D33] text-[9px] text-emerald-400 font-mono">
              {rawArchiveFiles.length}
            </span>
          </button>

          {openSections.rawArchive && (
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#2D2D33] font-mono text-xs">
              {rawArchiveFiles.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-emerald-950/40 text-emerald-300 font-medium border-l-2 border-emerald-500"
                      : "text-[#94A3B8] hover:bg-[#1A1A20] hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectTab("view");
                    onSelectFile(file.path);
                  }}
                >
                  <span className="truncate pr-1 text-[11px]">📄 {file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestDelete(file.path);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition cursor-pointer"
                    title="级联删除 (Auto-Clean)"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. wiki/source_summaries */}
        <div>
          <button
            onClick={() => toggleSection("summaries")}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] hover:text-white py-1 px-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              {openSections.summaries ? (
                <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
              ) : (
                <ChevronRight className="w-3 h-3 text-[#94A3B8]" />
              )}
              <span className="text-[#94A3B8]">📂</span>
              <span>wiki/source_summaries</span>
            </span>
            <span className="px-1.5 py-0.2 rounded bg-[#1A1A20] border border-[#2D2D33] text-[9px] text-[#94A3B8] font-mono">
              {summaryFiles.length}
            </span>
          </button>

          {openSections.summaries && (
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#2D2D33] font-mono text-xs">
              {summaryFiles.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-[#1A1A20] text-white font-medium"
                      : "text-[#94A3B8] hover:bg-[#1A1A20] hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectTab("view");
                    onSelectFile(file.path);
                  }}
                >
                  <span className="truncate pr-1 text-[11px]">📄 {file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. raw/rejected (Format Intercepted files) */}
        {rejectedFiles.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("rawRejected")}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-amber-400 hover:text-amber-300 py-1 px-1 cursor-pointer font-mono"
            >
              <span className="flex items-center gap-1.5">
                {openSections.rawRejected ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span className="text-amber-400">⚠️</span>
                <span>raw/rejected (隔离区)</span>
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800 text-[9px] text-amber-300 font-mono">
                {rejectedFiles.length}
              </span>
            </button>

            {openSections.rawRejected && (
              <div className="pl-3 mt-0.5 space-y-0.5 border-l border-amber-800/60 font-mono text-xs">
                {rejectedFiles.map((file) => (
                  <div
                    key={file.path}
                    className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                      selectedFilePath === file.path
                        ? "bg-amber-950/40 text-amber-200 font-medium border-l-2 border-amber-500"
                        : "text-amber-300/80 hover:bg-[#1A1A20] hover:text-amber-200"
                    }`}
                    onClick={() => {
                      onSelectTab("view");
                      onSelectFile(file.path);
                    }}
                  >
                    <span className="truncate pr-1 text-[11px]">⚠️ {file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. System Schema & Scripts */}
        <div>
          <button
            onClick={() => toggleSection("schemaConfig")}
            className="w-full flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] hover:text-white py-1 px-1 cursor-pointer font-mono"
          >
            <span className="flex items-center gap-1.5">
              {openSections.schemaConfig ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span className="text-[#818CF8]">📂</span>
              <span>schema/ & scripts/</span>
            </span>
          </button>

          {openSections.schemaConfig && (
            <div className="pl-3 mt-0.5 space-y-0.5 border-l border-[#2D2D33] font-mono text-xs">
              {configFiles.map((file) => (
                <div
                  key={file.path}
                  className={`group flex items-center justify-between px-2 py-1 rounded transition cursor-pointer ${
                    selectedFilePath === file.path
                      ? "bg-[#1A1A20] text-[#818CF8] font-medium"
                      : "text-[#94A3B8] hover:bg-[#1A1A20] hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectTab("view");
                    onSelectFile(file.path);
                  }}
                >
                  <span className="truncate pr-1 text-[11px]">📄 {file.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LINT ENGINE SUMMARY CARD (Matching Design HTML) */}
        <div className="pt-2">
          <div className="text-[10px] uppercase font-bold text-[#94A3B8] mb-2 tracking-widest flex items-center justify-between">
            <span>LINT ENGINE</span>
            <span className="text-[9px] font-mono text-[#4ADE80]">AUTO-DAEMON</span>
          </div>
          <div className="high-density-card p-2 text-[11px] font-mono space-y-1.5">
            <div className="flex justify-between items-center text-[#94A3B8]">
              <span>Broken Links</span>
              <span className="text-[#4ADE80] font-bold">0</span>
            </div>
            <div className="flex justify-between items-center text-[#94A3B8]">
              <span>Conflict Zones</span>
              <span className="text-amber-400 font-bold">0</span>
            </div>
            <div className="flex justify-between items-center text-[#94A3B8]">
              <span>Index Status</span>
              <span className="text-[#818CF8]">HEALTHY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      {stats && (
        <div className="p-2.5 border-t border-[#2D2D33] bg-[#0A0A0C] text-[10px] text-[#94A3B8] space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span>ENTITIES: <strong className="text-[#818CF8]">{stats.entitiesCount}</strong></span>
            <span>RAW: <strong className="text-emerald-400">{stats.rawArchiveCount}</strong></span>
            <span>LINKS: <strong className="text-[#4ADE80]">{stats.linksCount}</strong></span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#94A3B8]/60 pt-1 border-t border-[#2D2D33] font-mono">
            <span>LAST LINT:</span>
            <span>{stats.lastLintAt ? stats.lastLintAt.substring(0, 10) : "ONLINE"}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
