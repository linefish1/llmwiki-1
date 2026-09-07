import React, { useState, useEffect } from "react";
import {
  Settings,
  Cpu,
  ShieldCheck,
  Save,
  Check,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Layers,
  FileCode,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { LintResult } from "../types";
import { ModelDriverCenter } from "./ModelDriverCenter";

interface ControlPanelProps {
  onLintTriggered: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onLintTriggered }) => {
  const [configToml, setConfigToml] = useState("");
  const [agentsMd, setAgentsMd] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"router" | "agents" | "lint">("router");
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLinting, setIsLinting] = useState(false);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.configToml) setConfigToml(data.configToml);
        if (data.agentsMd) setAgentsMd(data.agentsMd);
      })
      .catch((e) => console.error("Error fetching config:", e));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configToml, agentsMd }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunLint = async () => {
    setIsLinting(true);
    setLintResult(null);
    try {
      const res = await fetch("/api/lint/run", { method: "POST" });
      const data = await res.json();
      setLintResult(data);
      onLintTriggered();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLinting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2D2D33] pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#818CF8]"></span>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              AI PROTOCOL SETTINGS & DUAL-ENGINE DRIVER
            </h2>
            <span className="high-density-token font-mono text-[10px]">
              HUMAN BOUNDARY #5
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            配置全局通用大模型与多模态双引擎智能调度、逻辑巡检频率与 AI 编译规范。修改即时更新底层 <code className="text-[#818CF8] font-mono">config.toml</code> 与 <code className="text-[#818CF8] font-mono">schema/AGENTS.md</code>。
          </p>
        </div>

        {activeSubTab !== "router" && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded text-xs font-mono font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] border border-[#4F46E5] flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>SAVED SUCCESS</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "SAVING..." : "SAVE PROTOCOL"}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2D2D33] text-xs font-mono">
        <button
          onClick={() => setActiveSubTab("router")}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer text-xs ${
            activeSubTab === "router"
              ? "border-[#818CF8] text-[#818CF8]"
              : "border-transparent text-[#94A3B8] hover:text-white"
          }`}
        >
          <Zap className="w-4 h-4 text-[#818CF8]" />
          <span>大模型驱动中心 (MODEL DRIVER CENTER)</span>
        </button>
        <button
          onClick={() => setActiveSubTab("agents")}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer text-xs ${
            activeSubTab === "agents"
              ? "border-[#818CF8] text-[#818CF8]"
              : "border-transparent text-[#94A3B8] hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>SPEC PROTOCOL (AGENTS.md)</span>
        </button>
        <button
          onClick={() => setActiveSubTab("lint")}
          className={`pb-2 px-3 font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer text-xs ${
            activeSubTab === "lint"
              ? "border-[#818CF8] text-[#818CF8]"
              : "border-transparent text-[#94A3B8] hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>AUTO-HEALING LINT</span>
        </button>
      </div>

      {/* Tab 1: Dual-Engine Model Driver Center */}
      {activeSubTab === "router" && (
        <ModelDriverCenter
          onConfigSaved={() => {
            // refresh config
            fetch("/api/config")
              .then((r) => r.json())
              .then((data) => {
                if (data.configToml) setConfigToml(data.configToml);
              });
          }}
        />
      )}

      {/* Tab 2: AGENTS.md Protocol */}
      {activeSubTab === "agents" && (
        <div className="space-y-4">
          <div className="p-3 bg-[rgba(79,70,229,0.1)] border border-[rgba(79,70,229,0.3)] rounded-lg text-slate-300 text-xs leading-relaxed font-mono">
            <strong className="text-[#818CF8]">AI PROTOCOL CONSTRAINT: </strong>
            所有增量编译、实体生成与断链自愈过程均受 <code className="text-white">schema/AGENTS.md</code> 严密约束。此处声明的冲突调和标记（如 <code className="text-amber-300">&gt; [!WARNING]</code>）直接指导自愈引擎生成规范 Markdown。
          </div>

          <div className="bg-[#141418] rounded-lg border border-[#2D2D33] overflow-hidden">
            <div className="bg-[#1A1A20] px-3 py-2 border-b border-[#2D2D33] text-xs font-mono text-[#94A3B8] flex items-center justify-between">
              <span className="text-white font-semibold">schema/AGENTS.md</span>
              <span className="text-[11px] text-[#818CF8]">LINT GOVERNANCE PROTOCOL</span>
            </div>
            <textarea
              value={agentsMd}
              onChange={(e) => setAgentsMd(e.target.value)}
              className="w-full h-96 p-4 font-mono text-xs text-slate-200 outline-none leading-relaxed resize-y bg-[#0A0A0C]"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Tab 3: Auto-Healing Lint */}
      {activeSubTab === "lint" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#141418] rounded-lg border border-[#2D2D33] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-[#818CF8]" />
                  AUTO-HEALING SCHEDULER & LINT ENGINE
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  后台静默巡检全库：自动补全未建页 <code className="text-[#818CF8] font-mono">[[新实体]]</code>、排查观点冲突、侦测潜在逻辑缺口。
                </p>
              </div>

              <button
                onClick={handleRunLint}
                disabled={isLinting}
                className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-mono font-medium flex items-center gap-2 border border-[#4F46E5] cursor-pointer transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLinting ? "animate-spin" : ""}`} />
                <span>{isLinting ? "RUNNING LINT..." : "TRIGGER AUTO-HEALING LINT"}</span>
              </button>
            </div>
          </div>

          {/* Lint Results Card */}
          {lintResult && (
            <div className="p-4 bg-[#141418] rounded-lg border border-[#2D2D33] text-xs space-y-3 font-mono">
              <div className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
                <span>LINT REPORT ({new Date().toLocaleTimeString()})</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#1A1A20] rounded border border-[#2D2D33]">
                  <div className="text-[#94A3B8] text-[11px]">HEALED ENTITIES</div>
                  <div className="text-base font-bold text-white mt-1">
                    {lintResult.healedEntities.length} NODES
                  </div>
                </div>
                <div className="p-3 bg-[#1A1A20] rounded border border-[#2D2D33]">
                  <div className="text-[#94A3B8] text-[11px]">CONFLICT IDENTIFIERS</div>
                  <div className="text-base font-bold text-amber-400 mt-1">
                    {lintResult.conflictsFound} BLOCKS
                  </div>
                </div>
                <div className="p-3 bg-[#1A1A20] rounded border border-[#2D2D33]">
                  <div className="text-[#94A3B8] text-[11px]">TOPOLOGY INTEGRITY</div>
                  <div className="text-base font-bold text-[#4ADE80] mt-1">PASSED</div>
                </div>
              </div>

              {lintResult.healedEntities.length > 0 && (
                <div className="p-3 bg-[rgba(79,70,229,0.1)] rounded border border-[rgba(79,70,229,0.3)] text-xs text-slate-300">
                  <strong className="text-[#818CF8]">AUTO-STUBBED ENTITY PAGES:</strong>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {lintResult.healedEntities.map((h, i) => (
                      <span key={i} className="high-density-token">
                        [[{h}]]
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lintResult.gapNotes.length > 0 && (
                <div className="p-3 bg-amber-950/20 rounded border border-amber-900/50 text-xs text-amber-200 space-y-1">
                  <strong className="text-amber-400">GAP ANALYSIS & SYNTHESIS RECOMMENDATIONS:</strong>
                  {lintResult.gapNotes.map((note, i) => (
                    <p key={i}>• {note}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
