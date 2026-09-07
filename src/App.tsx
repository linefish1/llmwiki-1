import React, { useEffect, useState, useMemo } from "react";
import {
  FileText,
  Edit,
  Eye,
  Trash2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  HardDrive,
  Info,
  Check,
  AlertCircle,
  Clock,
  BookOpen,
  Share2,
  UploadCloud,
  Network,
  Cpu,
  Terminal,
  Layers,
} from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { MarkdownEditor } from "./components/MarkdownEditor";
import { IngestUpload } from "./components/IngestUpload";
import { CascadingDeleteModal } from "./components/CascadingDeleteModal";
import { ControlPanel } from "./components/ControlPanel";
import { McpPlayground } from "./components/McpPlayground";
import { KnowledgeGraph } from "./components/KnowledgeGraph";
import { EnrichmentPanel } from "./components/EnrichmentPanel";
import { WikiFileInfo, MainTab, WikiStats, CascadingDeleteReport } from "./types";

export default function App() {
  const [files, setFiles] = useState<WikiFileInfo[]>([]);
  const [stats, setStats] = useState<WikiStats | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("wiki/entities/空中成像提词模组.md");
  const [activeContent, setActiveContent] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<MainTab>("view");
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [deleteModalPath, setDeleteModalPath] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch file list & stats
  const refreshWorkspace = async () => {
    try {
      const [filesRes, statsRes] = await Promise.all([
        fetch("/api/files"),
        fetch("/api/stats"),
      ]);
      const filesData = await filesRes.json();
      const statsData = await statsRes.json();
      if (Array.isArray(filesData)) setFiles(filesData);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error("Error refreshing workspace:", err);
    }
  };

  useEffect(() => {
    refreshWorkspace();
  }, []);

  // Fetch content when selectedFilePath changes
  useEffect(() => {
    if (!selectedFilePath) return;
    setIsLoadingFile(true);
    fetch(`/api/files/content?path=${encodeURIComponent(selectedFilePath)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.content !== undefined) {
          setActiveContent(data.content);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingFile(false));
  }, [selectedFilePath]);

  // Handle navigate to entity from [[WikiLink]]
  const handleNavigateLink = (target: string) => {
    const cleanTarget = target.replace(/\[\[|\]\]/g, "").trim();
    // Try matching in wiki_entity, wiki_synthesis, raw_archive
    const exactEntity = files.find(
      (f) => f.name.replace(".md", "") === cleanTarget && f.category === "wiki_entity"
    );
    if (exactEntity) {
      setSelectedFilePath(exactEntity.path);
      setCurrentTab("view");
      return;
    }

    const anyDoc = files.find((f) => f.name.replace(".md", "") === cleanTarget);
    if (anyDoc) {
      setSelectedFilePath(anyDoc.path);
      setCurrentTab("view");
      return;
    }

    // If not found yet, default to target in wiki/entities
    setSelectedFilePath(`wiki/entities/${cleanTarget}.md`);
    setCurrentTab("view");
  };

  // Compute backlinks for the current file
  const currentBacklinks = useMemo(() => {
    if (!selectedFilePath) return [];
    const baseName = selectedFilePath.split("/").pop()?.replace(".md", "");
    if (!baseName) return [];

    const backlinks: string[] = [];
    files.forEach((f) => {
      if (f.path !== selectedFilePath && f.content) {
        if (f.content.includes(`[[${baseName}]]`)) {
          backlinks.push(f.name.replace(".md", ""));
        }
      }
    });

    return backlinks;
  }, [selectedFilePath, files]);

  // Handle save from editor
  const handleSaveFile = async (path: string, newContent: string) => {
    try {
      const res = await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content: newContent }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveContent(newContent);
        showNotification(data.message || "文件已保存，增量同步完成！");
        refreshWorkspace();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Handle cascading delete execution
  const handleConfirmDelete = async (
    path: string
  ): Promise<{ success: boolean; cascaded: boolean; report?: CascadingDeleteReport }> => {
    try {
      const res = await fetch("/api/files/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || "删除成功");
        refreshWorkspace();
        if (selectedFilePath === path) {
          setSelectedFilePath("wiki/index.md");
          setCurrentTab("view");
        }
        return { success: true, cascaded: data.cascaded, report: data.report };
      }
      return { success: false, cascaded: false };
    } catch (e) {
      console.error(e);
      return { success: false, cascaded: false };
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0C] text-[#E2E8F0] font-sans antialiased overflow-hidden">
      {/* 0. Left Icon Rail (60px) */}
      <div className="w-[60px] bg-[#0A0A0C] border-r border-[#2D2D33] flex flex-col items-center py-4 gap-3 z-10 shrink-0 select-none">
        {/* System Logo / Hex */}
        <div className="w-10 h-10 rounded-lg bg-[rgba(79,70,229,0.2)] border border-[#4F46E5] flex items-center justify-center text-[#818CF8] font-mono font-bold text-xs shadow-[0_0_15px_rgba(79,70,229,0.25)]">
          LW
        </div>

        <div className="w-8 h-px bg-[#2D2D33] my-1" />

        {/* Rail navigation icons */}
        <button
          onClick={() => setCurrentTab("view")}
          title="知识库实体阅览 (Entities)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "view" || currentTab === "edit"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("upload")}
          title="资料上传拦截与编译 (Ingest Pipeline)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "upload"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("graph")}
          title="双链知识图谱拓扑 (Knowledge Graph)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "graph"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <Network className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("control")}
          title="AI 路由引擎与逻辑巡检 (Control Panel)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "control"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <Cpu className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("mcp")}
          title="FastMCP 外部协议接口 (MCP Tools)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "mcp"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("timeline")}
          title="时间线审计与变更历史 (Audit Log)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "timeline"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <Clock className="w-4 h-4" />
        </button>

        <button
          onClick={() => setCurrentTab("enrichment")}
          title="书籍类补充内容增强管线 (Enrichment Pipeline v1.0)"
          className={`p-2.5 rounded-lg transition-all cursor-pointer ${
            currentTab === "enrichment"
              ? "bg-[rgba(79,70,229,0.25)] text-[#818CF8] border border-[rgba(79,70,229,0.5)] shadow-[0_0_10px_rgba(79,70,229,0.2)]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#141418]"
          }`}
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
        </button>

        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
          <div className="w-2 h-2 rounded-full bg-[#4ADE80] shadow-[0_0_8px_#4ADE80] animate-pulse" title="Daemon PID 4921 Online" />
          <span className="text-[9px] font-mono text-[#94A3B8]">v1.0</span>
        </div>
      </div>

      {/* 1. High Density Sidebar (240px) */}
      <Sidebar
        files={files}
        selectedFilePath={selectedFilePath}
        currentTab={currentTab}
        stats={stats}
        onSelectFile={(path) => {
          setSelectedFilePath(path);
          if (currentTab === "upload" || currentTab === "control" || currentTab === "mcp") {
            setCurrentTab("view");
          }
        }}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onRequestDelete={(path) => setDeleteModalPath(path)}
      />

      {/* 2. Main Content Canvas */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0F0F12]">
        {/* High Density Header Bar */}
        <header className="h-12 border-b border-[#2D2D33] bg-[#141418] px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-white tracking-wider">
                AUTO-WIKI MASTER BLUEPRINT
              </span>
              <span className="text-xs text-[#4ADE80] font-mono flex items-center gap-1">
                ● DAEMON ACTIVE
              </span>
            </div>

            <span className="text-[#2D2D33]">|</span>

            <div className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8]">
              <HardDrive className="w-3.5 h-3.5 text-[#818CF8]" />
              <span className="high-density-token font-mono">
                {currentTab === "upload"
                  ? "INGEST_PIPE::UPLOAD_&_GUARD"
                  : currentTab === "graph"
                  ? "GRAPH_TOPOLOGY::BIDIRECTIONAL"
                  : currentTab === "control"
                  ? "AI_ROUTER::PROTOCOL_SETTINGS"
                  : currentTab === "mcp"
                  ? "FASTMCP::LOCAL_EXTERNAL_RPC"
                  : currentTab === "enrichment"
                  ? "ENRICHMENT_PIPE::BOOKS/HONGLOUMENG (v1.0)"
                  : currentTab === "timeline"
                  ? "AUDIT::CHRONOLOGICAL_TIMELINE"
                  : selectedFilePath}
              </span>
            </div>
          </div>

          {/* Right Status & Action Controls */}
          <div className="flex items-center gap-3">
            {/* Real-time High Density Engine Latency */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-[#94A3B8] pr-2 border-r border-[#2D2D33]">
              <span className="flex items-center gap-1">
                <span className="text-slate-500">DEEPSEEK:</span>
                <span className="text-[#4ADE80] font-semibold">14ms</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-slate-500">CLAUDE-3.7:</span>
                <span className="text-[#818CF8] font-semibold">820ms</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-slate-500">STORAGE:</span>
                <span className="text-slate-300 font-semibold">1.2TB FREE</span>
              </span>
            </div>

            {/* Toggle View / Edit button if on view or edit tab */}
            {(currentTab === "view" || currentTab === "edit") && (
              <div className="flex items-center bg-[#1A1A20] p-0.5 rounded border border-[#2D2D33] text-xs">
                <button
                  onClick={() => setCurrentTab("view")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer font-mono text-[11px] ${
                    currentTab === "view"
                      ? "bg-[#4F46E5] text-white shadow-xs font-semibold"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#818CF8]" />
                  <span>VIEW</span>
                </button>
                <button
                  onClick={() => setCurrentTab("edit")}
                  className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition cursor-pointer font-mono text-[11px] ${
                    currentTab === "edit"
                      ? "bg-[#4F46E5] text-white shadow-xs font-semibold"
                      : "text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" />
                  <span>EDIT</span>
                </button>
              </div>
            )}

            {/* Delete button */}
            {(currentTab === "view" || currentTab === "edit") && (
              <button
                onClick={() => setDeleteModalPath(selectedFilePath)}
                className="p-1.5 rounded bg-[#1A1A20] border border-[#2D2D33] hover:bg-rose-950/40 text-[#94A3B8] hover:text-rose-400 hover:border-rose-800/60 transition cursor-pointer"
                title="资料删除 (Delete · 触发级联清理)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Refresh */}
            <button
              onClick={refreshWorkspace}
              className="p-1.5 rounded bg-[#1A1A20] border border-[#2D2D33] hover:bg-[#25252D] text-[#94A3B8] hover:text-white transition cursor-pointer"
              title="刷新工作区"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Floating Notification Toast */}
        {notification && (
          <div className="absolute top-14 right-6 z-40 bg-[#141418] text-white text-xs px-3.5 py-2 rounded-lg shadow-xl border border-[#4F46E5] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
            <span className="font-mono">{notification}</span>
          </div>
        )}

        {/* Viewport Content */}
        <div className="flex-1 overflow-auto p-4 bg-[#0F0F12]">
          {currentTab === "view" && (
            <div className="high-density-card p-6 max-w-5xl mx-auto min-h-full bg-[#141418] border border-[#2D2D33] shadow-lg">
              {isLoadingFile ? (
                <div className="py-20 text-center text-[#94A3B8] text-xs font-mono flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#818CF8]" />
                  <span>LOADING ENTITY STATE...</span>
                </div>
              ) : (
                <MarkdownViewer
                  content={activeContent}
                  filePath={selectedFilePath}
                  onNavigateLink={handleNavigateLink}
                  backlinks={currentBacklinks}
                />
              )}
            </div>
          )}

          {currentTab === "edit" && (
            <MarkdownEditor
              filePath={selectedFilePath}
              initialContent={activeContent}
              onSave={handleSaveFile}
              onNavigateLink={handleNavigateLink}
            />
          )}

          {currentTab === "upload" && (
            <IngestUpload
              onIngestSuccess={() => {
                refreshWorkspace();
                showNotification("资料入库与增量编译演进完成！");
              }}
              onNavigateFile={(path) => {
                setSelectedFilePath(path);
                setCurrentTab("view");
              }}
            />
          )}

          {currentTab === "graph" && (
            <KnowledgeGraph
              files={files}
              onSelectNode={(path) => {
                setSelectedFilePath(path);
                setCurrentTab("view");
              }}
            />
          )}

          {currentTab === "control" && (
            <ControlPanel
              onLintTriggered={() => {
                refreshWorkspace();
                showNotification("全库逻辑巡检与断链自愈完成！");
              }}
            />
          )}

          {currentTab === "mcp" && <McpPlayground />}

          {currentTab === "enrichment" && (
            <EnrichmentPanel
              onNavigateLink={handleNavigateLink}
              onOpenFile={(path) => {
                setSelectedFilePath(path);
                setCurrentTab("view");
              }}
              onRefreshWorkspace={refreshWorkspace}
            />
          )}

          {currentTab === "timeline" && (
            <div className="high-density-card p-6 max-w-5xl mx-auto min-h-full bg-[#141418] border border-[#2D2D33]">
              <MarkdownViewer
                content={activeContent}
                filePath={selectedFilePath}
                onNavigateLink={handleNavigateLink}
              />
            </div>
          )}
        </div>

        {/* 3. Bottom Status Bar */}
        <footer className="h-9 border-t border-[#2D2D33] px-4 bg-[#0A0A0C] flex items-center justify-between text-[11px] font-mono text-[#94A3B8] shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span>INGESTION PIPELINE (DAEMON: PID 4921)</span>
            <span className="text-[#2D2D33]">|</span>
            <span className="flex items-center gap-1.5">
              <span>SYNC:</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-[#4ADE80] border border-emerald-800/60 text-[10px]">
                SUCCESS
              </span>
            </span>
            <span className="text-[#2D2D33]">|</span>
            <span className="flex items-center gap-1.5">
              <span>WATCHING:</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 text-[#818CF8] border border-indigo-800/60 text-[10px]">
                D:\PersonalWiki\raw\inbox
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>UPTIME: 142:04:12</span>
            <span>|</span>
            <span className="text-[#818CF8]">BUILD: v1.0-STABLE</span>
          </div>
        </footer>
      </main>

      {/* Cascading Delete Modal */}
      {deleteModalPath && (
        <CascadingDeleteModal
          filePath={deleteModalPath}
          onClose={() => setDeleteModalPath(null)}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}
