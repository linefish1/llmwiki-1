import React, { useState, useEffect } from "react";
import {
  Cpu,
  Eye,
  Zap,
  Save,
  RotateCcw,
  Check,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Play,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  WikiTomlConfig,
  EngineConfig,
  ConnectionTestResult,
  PayloadInspectionResult,
} from "../types";

interface ModelDriverCenterProps {
  onConfigSaved?: () => void;
}

const DEFAULT_TOML_CONFIG: WikiTomlConfig = {
  system: {
    auto_switch_multimodal: true,
  },
  global_llm: {
    provider: "deepseek",
    model_name: "deepseek-chat",
    api_key: "sk-xxxxxxxxxxxxxxxx",
    base_url: "https://api.deepseek.com/v1",
    temperature: 0.3,
    max_tokens: 4096,
    timeout: 30,
    fallback_provider: "ollama",
    fallback_model: "qwen2.5:14b",
    fallback_base_url: "http://localhost:11434",
  },
  multimodal_llm: {
    provider: "anthropic",
    model_name: "claude-3-7-sonnet-20250219",
    api_key: "sk-ant-xxxxxxxxxxxx",
    base_url: "https://api.anthropic.com",
    temperature: 0.2,
    max_tokens: 4096,
    timeout: 60,
    fallback_provider: "ollama",
    fallback_model: "qwen2.5-vl:7b",
    fallback_base_url: "http://localhost:11434",
  },
  general: {
    workspace_path: "D:\\PersonalWiki",
    version: "1.0.0",
    auto_heal_interval_hours: 24,
    last_lint_timestamp: "2026-09-07T02:00:00Z",
  },
};

const SAMPLE_TEXT_PURE = `# 负折射透镜组与微纳制造规范
负折射率超材料透镜通过人工微结构改变电磁波折射方向。
- [[折射率参数]]：n = -1.45
- [[聚焦极限]]：突破衍射极限达到亚波长分辨力
- [[应用领域]]：光刻物镜与超高密度光存储模组`;

const SAMPLE_TEXT_WITH_IMAGE = `# 智能座舱空中成像提词模组硬件架构
系统采用自主研发的微透镜阵列与发散角抑制光学层。
![智能座舱架构图示](../../raw/assets/cockpit_architecture_v1.png)
- [[核心显示单元]]：Micro-OLED 4K 面板
- [[视角范围]]：±45度无畸变可视角度`;

const SAMPLE_TEXT_WITH_BASE64 = `# 实时光学总线拓扑
以下为总线信号链路简图：
![实时光学拓扑](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==)
- 支持毫秒级心跳同步与容灾备援。`;

export const ModelDriverCenter: React.FC<ModelDriverCenterProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<WikiTomlConfig>(DEFAULT_TOML_CONFIG);
  const [rawToml, setRawToml] = useState<string>("");
  const [viewMode, setViewMode] = useState<"visual" | "toml">("visual");

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Key Visibility toggles
  const [showGlobalKey, setShowGlobalKey] = useState(false);
  const [showMultimodalKey, setShowMultimodalKey] = useState(false);

  // Connection testing states
  const [isTestingGlobal, setIsTestingGlobal] = useState(false);
  const [globalTestResult, setGlobalTestResult] = useState<ConnectionTestResult | null>(null);

  const [isTestingMultimodal, setIsTestingMultimodal] = useState(false);
  const [multimodalTestResult, setMultimodalTestResult] = useState<ConnectionTestResult | null>(null);

  // Playground / Inspection Simulation State
  const [sampleInput, setSampleInput] = useState(SAMPLE_TEXT_WITH_IMAGE);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<PayloadInspectionResult | null>(null);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecutingSim, setIsExecutingSim] = useState(false);

  // Load config from server on mount
  useEffect(() => {
    fetch("/api/router/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        if (data.rawToml) setRawToml(data.rawToml);
      })
      .catch((e) => console.error("Error loading router config:", e));
  }, []);

  const handleSaveConfig = async (overrideConfig?: WikiTomlConfig) => {
    setIsSaving(true);
    try {
      const cfgToSend = overrideConfig || config;
      const res = await fetch("/api/router/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          viewMode === "toml"
            ? { rawToml }
            : { config: cfgToSend }
        ),
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) setConfig(data.config);
        if (data.rawToml) setRawToml(data.rawToml);
        setSaveToast("配置已成功保存并热重载生效！");
        setTimeout(() => setSaveToast(null), 3000);
        if (onConfigSaved) onConfigSaved();
      }
    } catch (err: any) {
      console.error(err);
      setSaveToast("保存失败：" + (err.message || String(err)));
      setTimeout(() => setSaveToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_TOML_CONFIG);
    handleSaveConfig(DEFAULT_TOML_CONFIG);
  };

  const handleTestConnection = async (engineType: "global_llm" | "multimodal_llm") => {
    if (engineType === "global_llm") {
      setIsTestingGlobal(true);
      setGlobalTestResult(null);
      try {
        const res = await fetch("/api/router/test-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engineType, config: config.global_llm }),
        });
        const data = await res.json();
        setGlobalTestResult(data);
      } catch (e: any) {
        setGlobalTestResult({
          success: false,
          latencyMs: 0,
          status: "ERROR",
          message: e.message || "请求失败",
          provider: config.global_llm.provider,
          model: config.global_llm.model_name,
          timestamp: new Date().toLocaleTimeString(),
        });
      } finally {
        setIsTestingGlobal(false);
      }
    } else {
      setIsTestingMultimodal(true);
      setMultimodalTestResult(null);
      try {
        const res = await fetch("/api/router/test-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ engineType, config: config.multimodal_llm }),
        });
        const data = await res.json();
        setMultimodalTestResult(data);
      } catch (e: any) {
        setMultimodalTestResult({
          success: false,
          latencyMs: 0,
          status: "ERROR",
          message: e.message || "请求失败",
          provider: config.multimodal_llm.provider,
          model: config.multimodal_llm.model_name,
          timestamp: new Date().toLocaleTimeString(),
        });
      } finally {
        setIsTestingMultimodal(false);
      }
    }
  };

  const handleRunInspection = async () => {
    setIsDetecting(true);
    setExecutionOutput(null);
    try {
      const res = await fetch("/api/router/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sampleInput, config }),
      });
      const data = await res.json();
      if (data.success) {
        setDetectionResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleExecuteSimulatedDispatch = async () => {
    setIsExecutingSim(true);
    setExecutionOutput(null);
    try {
      const res = await fetch("/api/router/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: sampleInput,
          systemPrompt: "你是一个双引擎智能调度处理器，请解析并提炼实体与架构拓扑。",
          text: sampleInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExecutionOutput(
          `【调度完成 - 实际执行报告】\n` +
          `- 命中引擎：${data.engineUsed} (${data.provider} / ${data.model})\n` +
          `- 耗时延迟：${data.latencyMs}ms\n` +
          `- 视觉判定：${data.isVisual ? "包含图像 (多模态驱动)" : "纯文本 (通用轻量驱动)"}\n` +
          `- 降级触发：${data.fallbackTriggered ? "是 (已自动启动备用模型)" : "否 (主引擎响应正常)"}\n\n` +
          `【引擎返回结果】\n${data.text}`
        );
      }
    } catch (e: any) {
      setExecutionOutput(`执行失败：${e.message || String(e)}`);
    } finally {
      setIsExecutingSim(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Overview */}
      <div className="p-4 bg-[#141418] border border-[#2D2D33] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8] shadow-[0_0_8px_#818CF8]"></span>
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span>⚙️ 大模型驱动中心 (MODEL DRIVER CENTER)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(79,70,229,0.2)] text-[#818CF8] border border-[rgba(79,70,229,0.4)]">
                DUAL-ENGINE v1.0
              </span>
            </h2>
          </div>
          <p className="text-xs text-[#94A3B8]">
            配置系统核心认知引擎，支持文本通用与视觉多模态大模型的动静分离与智能路由，在性能与算力成本之间实现极致平衡。
          </p>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#1A1A20] p-0.5 rounded-lg border border-[#2D2D33] text-xs font-mono">
            <button
              onClick={() => setViewMode("visual")}
              className={`px-3 py-1 rounded transition cursor-pointer text-[11px] flex items-center gap-1.5 ${
                viewMode === "visual"
                  ? "bg-[#4F46E5] text-white shadow-xs font-semibold"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>可视化表单</span>
            </button>
            <button
              onClick={() => setViewMode("toml")}
              className={`px-3 py-1 rounded transition cursor-pointer text-[11px] flex items-center gap-1.5 ${
                viewMode === "toml"
                  ? "bg-[#4F46E5] text-white shadow-xs font-semibold"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>config.toml 源码</span>
            </button>
          </div>

          <button
            onClick={() => handleSaveConfig()}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] border border-[#4F46E5] flex items-center gap-1.5 cursor-pointer shadow-xs transition"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>{isSaving ? "保存中..." : "保存配置"}</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-lg text-xs text-[#4ADE80] font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
            <span>{saveToast}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80">热重载完成</span>
        </div>
      )}

      {viewMode === "visual" ? (
        <>
          {/* 🔀 Smart Route Switch Card */}
          <div className="p-4 bg-[#141418] border border-[#2D2D33] rounded-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[rgba(79,70,229,0.15)] border border-[rgba(79,70,229,0.3)] text-[#818CF8] shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                      🔀 智能路由切换开关 (Dual-Engine Smart Router)
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        config.system.auto_switch_multimodal
                          ? "bg-emerald-950/60 text-[#4ADE80] border-emerald-800/60"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/60"
                      }`}
                    >
                      {config.system.auto_switch_multimodal ? "● 智能动态路由已启用" : "○ 强制单引擎纯文本"}
                    </span>
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-200 hover:text-white pt-1">
                    <input
                      type="checkbox"
                      checked={config.system.auto_switch_multimodal}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          system: { auto_switch_multimodal: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded bg-[#0A0A0C] border-[#2D2D33] text-[#4F46E5] focus:ring-0 cursor-pointer accent-[#4F46E5]"
                    />
                    <span className="font-semibold text-slate-100">
                      检测到 Markdown 包含图片或上传图像时，自动唤醒多模态大模型 (Auto-Switch Multimodal Engine)
                    </span>
                  </label>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed pt-0.5 pl-6">
                    说明：日常文本总结/实体提取将自动路由至轻量快速且低成本的全局通用引擎；仅当遇到 Markdown 图片语法、Base64 视觉图示或架构图时，无缝切换至高算力视觉模型。
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-end pl-6 sm:pl-0">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#94A3B8] block">分流节约预估</span>
                  <span className="text-xs font-mono font-bold text-[#4ADE80] flex items-center gap-1 justify-end">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>节省 ~92% 算力</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Two Main Engine Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1. Global General LLM Card */}
            <div className="p-4 bg-[#141418] border border-[#2D2D33] rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#2D2D33] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-[#818CF8]">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <span>💬 全局通用大模型 (Default LLM)</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#94A3B8]">
                        [ 日常系统驱动 / 摘要 / 实体融合 / 巡检 ]
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-[#1A1A20] text-[10px] font-mono text-[#818CF8] border border-[#2D2D33]">
                    {config.global_llm.provider.toUpperCase()}
                  </span>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 text-xs">
                  {/* Provider */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      提供商 (Provider):
                    </label>
                    <select
                      value={config.global_llm.provider}
                      onChange={(e) => {
                        const val = e.target.value;
                        let defUrl = config.global_llm.base_url;
                        let defModel = config.global_llm.model_name;
                        if (val === "deepseek") {
                          defUrl = "https://api.deepseek.com/v1";
                          defModel = "deepseek-chat";
                        } else if (val === "openai") {
                          defUrl = "https://api.openai.com/v1";
                          defModel = "gpt-4o-mini";
                        } else if (val === "gemini") {
                          defUrl = "https://generativelanguage.googleapis.com";
                          defModel = "gemini-3.8-flash";
                        } else if (val === "ollama") {
                          defUrl = "http://localhost:11434";
                          defModel = "qwen2.5:14b";
                        }
                        setConfig({
                          ...config,
                          global_llm: {
                            ...config.global_llm,
                            provider: val,
                            base_url: defUrl,
                            model_name: defModel,
                          },
                        });
                      }}
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                    >
                      <option value="deepseek">DeepSeek (官方原生/高速推理)</option>
                      <option value="gemini">Google Gemini (Gemini Flash)</option>
                      <option value="openai">OpenAI (GPT-4o Mini / Standard)</option>
                      <option value="anthropic">Anthropic (Claude 3.5 Haiku)</option>
                      <option value="ollama">Ollama (本地私有部署)</option>
                      <option value="qwen">阿里通义千问 (Qwen-2.5)</option>
                      <option value="custom">自定义兼容网关 (Custom OpenAI-Compatible)</option>
                    </select>
                  </div>

                  {/* Model Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-[#94A3B8]">
                        模型名称 (Model Name):
                      </label>
                      <div className="flex items-center gap-1">
                        {["deepseek-chat", "deepseek-reasoner", "qwen2.5:14b"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                global_llm: { ...config.global_llm, model_name: m },
                              })
                            }
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A20] text-slate-400 hover:text-white border border-[#2D2D33] cursor-pointer"
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={config.global_llm.model_name}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          global_llm: { ...config.global_llm, model_name: e.target.value },
                        })
                      }
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                      placeholder="e.g. deepseek-chat"
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      API 密钥 (API Key):
                    </label>
                    <div className="relative">
                      <input
                        type={showGlobalKey ? "text" : "password"}
                        value={config.global_llm.api_key}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            global_llm: { ...config.global_llm, api_key: e.target.value },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs pr-16 focus:border-[#4F46E5] outline-none"
                        placeholder="sk-xxxxxxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGlobalKey(!showGlobalKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#94A3B8] hover:text-white px-1.5 py-0.5 rounded bg-[#1A1A20] border border-[#2D2D33] cursor-pointer"
                      >
                        {showGlobalKey ? "隐藏" : "显示"}
                      </button>
                    </div>
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      Base URL (可选/反代支持):
                    </label>
                    <input
                      type="text"
                      value={config.global_llm.base_url}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          global_llm: { ...config.global_llm, base_url: e.target.value },
                        })
                      }
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                      placeholder="https://api.deepseek.com/v1"
                    />
                  </div>

                  {/* Advanced Parameters */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        Temperature:
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="2"
                        value={config.global_llm.temperature}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            global_llm: {
                              ...config.global_llm,
                              temperature: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        Max Tokens:
                      </label>
                      <input
                        type="number"
                        step="512"
                        min="512"
                        max="32768"
                        value={config.global_llm.max_tokens}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            global_llm: {
                              ...config.global_llm,
                              max_tokens: parseInt(e.target.value, 10) || 4096,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        超时 (秒):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={config.global_llm.timeout}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            global_llm: {
                              ...config.global_llm,
                              timeout: parseInt(e.target.value, 10) || 30,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Fallback settings */}
                  <div className="p-2.5 bg-[#0A0A0C] rounded-lg border border-[#2D2D33] space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block font-semibold">
                      🛡️ 备用降级模型 (Fallback Model)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] font-mono text-[#94A3B8] block mb-0.5">提供商:</span>
                        <input
                          type="text"
                          value={config.global_llm.fallback_provider}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              global_llm: { ...config.global_llm, fallback_provider: e.target.value },
                            })
                          }
                          className="w-full bg-[#141418] border border-[#2D2D33] rounded px-2 py-1 text-slate-300 font-mono text-[11px]"
                          placeholder="ollama"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#94A3B8] block mb-0.5">模型名:</span>
                        <input
                          type="text"
                          value={config.global_llm.fallback_model}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              global_llm: { ...config.global_llm, fallback_model: e.target.value },
                            })
                          }
                          className="w-full bg-[#141418] border border-[#2D2D33] rounded px-2 py-1 text-slate-300 font-mono text-[11px]"
                          placeholder="qwen2.5:14b"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Test Connection */}
              <div className="pt-2 border-t border-[#2D2D33] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTestConnection("global_llm")}
                  disabled={isTestingGlobal}
                  className="px-3 py-1.5 rounded bg-[#1A1A20] hover:bg-[#25252D] text-white border border-[#2D2D33] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isTestingGlobal ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#818CF8]" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-[#818CF8]" />
                  )}
                  <span>⚡ 测试连接 (Test)</span>
                </button>

                {globalTestResult && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                        globalTestResult.success
                          ? "bg-emerald-950/60 text-[#4ADE80] border border-emerald-800/60"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>延迟: {globalTestResult.latencyMs}ms</span>
                    </span>
                  </div>
                )}
              </div>

              {globalTestResult && globalTestResult.message && (
                <div className="p-2 bg-[#0A0A0C] border border-[#2D2D33] rounded text-[10px] font-mono text-[#94A3B8] leading-relaxed">
                  {globalTestResult.message}
                </div>
              )}
            </div>

            {/* 2. Multimodal Vision LLM Card */}
            <div className="p-4 bg-[#141418] border border-[#2D2D33] rounded-xl flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#2D2D33] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <span>👁️ 多模态大模型 (Multimodal LLM)</span>
                      </h3>
                      <span className="text-[10px] font-mono text-[#94A3B8]">
                        [ 图像解构 / 架构图识别 / OCR / 图表绘制 ]
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-[#1A1A20] text-[10px] font-mono text-purple-300 border border-[#2D2D33]">
                    {config.multimodal_llm.provider.toUpperCase()}
                  </span>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 text-xs">
                  {/* Provider */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      提供商 (Provider):
                    </label>
                    <select
                      value={config.multimodal_llm.provider}
                      onChange={(e) => {
                        const val = e.target.value;
                        let defUrl = config.multimodal_llm.base_url;
                        let defModel = config.multimodal_llm.model_name;
                        if (val === "anthropic") {
                          defUrl = "https://api.anthropic.com";
                          defModel = "claude-3-7-sonnet-20250219";
                        } else if (val === "gemini") {
                          defUrl = "https://generativelanguage.googleapis.com";
                          defModel = "gemini-3.8-flash";
                        } else if (val === "openai") {
                          defUrl = "https://api.openai.com/v1";
                          defModel = "gpt-4o";
                        } else if (val === "ollama") {
                          defUrl = "http://localhost:11434";
                          defModel = "qwen2.5-vl:7b";
                        }
                        setConfig({
                          ...config,
                          multimodal_llm: {
                            ...config.multimodal_llm,
                            provider: val,
                            base_url: defUrl,
                            model_name: defModel,
                          },
                        });
                      }}
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                    >
                      <option value="anthropic">Anthropic (Claude 3.7 Sonnet / 3.5 Sonnet)</option>
                      <option value="gemini">Google Gemini (Gemini Flash Vision)</option>
                      <option value="openai">OpenAI (GPT-4o / GPT-4o-Vision)</option>
                      <option value="qwen-vl">阿里千问视觉 (Qwen-VL)</option>
                      <option value="ollama">Ollama 本地视觉 (Qwen2.5-VL / LLaVA)</option>
                      <option value="custom">自定义多模态网关 (Custom Vision Gateway)</option>
                    </select>
                  </div>

                  {/* Model Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-[#94A3B8]">
                        模型名称 (Model Name):
                      </label>
                      <div className="flex items-center gap-1">
                        {["claude-3-7-sonnet-20250219", "gpt-4o", "qwen2.5-vl:7b"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() =>
                              setConfig({
                                ...config,
                                multimodal_llm: { ...config.multimodal_llm, model_name: m },
                              })
                            }
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1A1A20] text-slate-400 hover:text-white border border-[#2D2D33] cursor-pointer"
                          >
                            {m.length > 14 ? m.slice(0, 13) + "..." : m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={config.multimodal_llm.model_name}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          multimodal_llm: { ...config.multimodal_llm, model_name: e.target.value },
                        })
                      }
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                      placeholder="e.g. claude-3-7-sonnet-20250219"
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      API 密钥 (API Key):
                    </label>
                    <div className="relative">
                      <input
                        type={showMultimodalKey ? "text" : "password"}
                        value={config.multimodal_llm.api_key}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multimodal_llm: { ...config.multimodal_llm, api_key: e.target.value },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs pr-16 focus:border-[#4F46E5] outline-none"
                        placeholder="sk-ant-xxxxxxxxxxxx"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMultimodalKey(!showMultimodalKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#94A3B8] hover:text-white px-1.5 py-0.5 rounded bg-[#1A1A20] border border-[#2D2D33] cursor-pointer"
                      >
                        {showMultimodalKey ? "隐藏" : "显示"}
                      </button>
                    </div>
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="block text-[11px] font-mono text-[#94A3B8] mb-1">
                      Base URL (可选/反代支持):
                    </label>
                    <input
                      type="text"
                      value={config.multimodal_llm.base_url}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          multimodal_llm: { ...config.multimodal_llm, base_url: e.target.value },
                        })
                      }
                      className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg px-3 py-2 text-white font-mono text-xs focus:border-[#4F46E5] outline-none"
                      placeholder="https://api.anthropic.com"
                    />
                  </div>

                  {/* Advanced Parameters */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        Temperature:
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="2"
                        value={config.multimodal_llm.temperature}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multimodal_llm: {
                              ...config.multimodal_llm,
                              temperature: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        Max Tokens:
                      </label>
                      <input
                        type="number"
                        step="512"
                        min="512"
                        max="32768"
                        value={config.multimodal_llm.max_tokens}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multimodal_llm: {
                              ...config.multimodal_llm,
                              max_tokens: parseInt(e.target.value, 10) || 4096,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">
                        超时 (秒 - 视觉更长):
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="240"
                        value={config.multimodal_llm.timeout}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            multimodal_llm: {
                              ...config.multimodal_llm,
                              timeout: parseInt(e.target.value, 10) || 60,
                            },
                          })
                        }
                        className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded px-2 py-1 text-white font-mono text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Fallback settings */}
                  <div className="p-2.5 bg-[#0A0A0C] rounded-lg border border-[#2D2D33] space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block font-semibold">
                      🛡️ 本地/备用多模态降级模型 (Fallback Model)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] font-mono text-[#94A3B8] block mb-0.5">提供商:</span>
                        <input
                          type="text"
                          value={config.multimodal_llm.fallback_provider}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              multimodal_llm: { ...config.multimodal_llm, fallback_provider: e.target.value },
                            })
                          }
                          className="w-full bg-[#141418] border border-[#2D2D33] rounded px-2 py-1 text-slate-300 font-mono text-[11px]"
                          placeholder="ollama"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#94A3B8] block mb-0.5">模型名:</span>
                        <input
                          type="text"
                          value={config.multimodal_llm.fallback_model}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              multimodal_llm: { ...config.multimodal_llm, fallback_model: e.target.value },
                            })
                          }
                          className="w-full bg-[#141418] border border-[#2D2D33] rounded px-2 py-1 text-slate-300 font-mono text-[11px]"
                          placeholder="qwen2.5-vl:7b"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Test Connection */}
              <div className="pt-2 border-t border-[#2D2D33] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleTestConnection("multimodal_llm")}
                  disabled={isTestingMultimodal}
                  className="px-3 py-1.5 rounded bg-[#1A1A20] hover:bg-[#25252D] text-white border border-[#2D2D33] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isTestingMultimodal ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>⚡ 测试连接 (Test)</span>
                </button>

                {multimodalTestResult && (
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                        multimodalTestResult.success
                          ? "bg-purple-950/60 text-purple-300 border border-purple-800/60"
                          : "bg-rose-950/60 text-rose-400 border border-rose-800/60"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span>延迟: {multimodalTestResult.latencyMs}ms</span>
                    </span>
                  </div>
                )}
              </div>

              {multimodalTestResult && multimodalTestResult.message && (
                <div className="p-2 bg-[#0A0A0C] border border-[#2D2D33] rounded text-[10px] font-mono text-[#94A3B8] leading-relaxed">
                  {multimodalTestResult.message}
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="p-3 bg-[#141418] border border-[#2D2D33] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
              <Info className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>所有保存的模型驱动参数将即时写入 config.toml 并同步至 Python 调度流水线。</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded text-xs font-mono text-slate-400 hover:text-white bg-[#1A1A20] hover:bg-[#25252D] border border-[#2D2D33] flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复默认配置</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveConfig()}
                disabled={isSaving}
                className="px-4 py-1.5 rounded text-xs font-mono font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] border border-[#4F46E5] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存并应用全局模型配置</span>
              </button>
            </div>
          </div>

          {/* 🛰️ Dual-Engine Live Dispatch Playground (实时载荷探测与双引擎调度模拟实验室) */}
          <div className="p-4 bg-[#141418] border border-[#2D2D33] rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2D2D33] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-400 font-mono text-xs">
                  LAB
                </span>
                <div>
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    🛰️ 双引擎调度实时模拟实验室 (Payload Detection & Dispatch Playground)
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    输入任意 Markdown 或选择预设样本，实时观察自动检测与多模态/通用引擎分流决策。
                  </p>
                </div>
              </div>

              {/* Sample Buttons */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setSampleInput(SAMPLE_TEXT_PURE)}
                  className="px-2 py-1 rounded bg-[#1A1A20] text-slate-300 hover:text-white border border-[#2D2D33] cursor-pointer"
                >
                  纯文本样本
                </button>
                <button
                  type="button"
                  onClick={() => setSampleInput(SAMPLE_TEXT_WITH_IMAGE)}
                  className="px-2 py-1 rounded bg-[#1A1A20] text-slate-300 hover:text-white border border-[#2D2D33] cursor-pointer"
                >
                  含 Markdown 图片
                </button>
                <button
                  type="button"
                  onClick={() => setSampleInput(SAMPLE_TEXT_WITH_BASE64)}
                  className="px-2 py-1 rounded bg-[#1A1A20] text-slate-300 hover:text-white border border-[#2D2D33] cursor-pointer"
                >
                  含 Base64 图像
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <textarea
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                rows={4}
                className="w-full bg-[#0A0A0C] border border-[#2D2D33] rounded-lg p-3 text-xs font-mono text-slate-200 outline-none leading-relaxed resize-y focus:border-[#4F46E5]"
                placeholder="输入待测试的 Markdown 内容..."
              />

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleRunInspection}
                  disabled={isDetecting}
                  className="px-3.5 py-1.5 rounded bg-[#1A1A20] hover:bg-[#25252D] text-white border border-[#2D2D33] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isDetecting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#818CF8]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
                  )}
                  <span>🔍 执行载荷扫描与引擎路由模拟</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteSimulatedDispatch}
                  disabled={isExecutingSim}
                  className="px-3.5 py-1.5 rounded bg-[#4F46E5] hover:bg-[#4338CA] text-white border border-[#4F46E5] text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
                >
                  {isExecutingSim ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>⚡ 立即通过双引擎执行调用</span>
                </button>
              </div>
            </div>

            {/* Inspection Visualized Decision Block */}
            {detectionResult && (
              <div className="p-3.5 bg-[#0A0A0C] border border-[#2D2D33] rounded-xl space-y-3 font-mono text-xs animate-fadeIn">
                <div className="flex items-center justify-between border-b border-[#2D2D33] pb-2 text-[11px]">
                  <span className="text-[#818CF8] font-semibold">
                    [DISPATCHER DECISION REPORT]
                  </span>
                  <span className="text-[#4ADE80] font-semibold">
                    {detectionResult.costEfficiencyRatio}
                  </span>
                </div>

                {/* Visual Flow diagram */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 py-2 text-xs">
                  <div className="px-3 py-1.5 rounded bg-[#141418] border border-[#2D2D33] text-slate-300 text-center">
                    <span className="block text-[9px] text-[#94A3B8]">载荷检测</span>
                    <span>{detectionResult.hasImage ? `🖼️ 发现 ${detectionResult.detectedImages.length} 处图像` : "📄 纯文本载荷"}</span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#818CF8] rotate-90 sm:rotate-0" />

                  <div className="px-3 py-1.5 rounded bg-[#141418] border border-[#2D2D33] text-slate-300 text-center">
                    <span className="block text-[9px] text-[#94A3B8]">调度开关</span>
                    <span className={detectionResult.autoSwitchActive ? "text-[#4ADE80]" : "text-amber-400"}>
                      {detectionResult.autoSwitchActive ? "自动分流 (Active)" : "单引擎 (Bypass)"}
                    </span>
                  </div>

                  <ArrowRight className="w-4 h-4 text-[#818CF8] rotate-90 sm:rotate-0" />

                  <div
                    className={`px-4 py-1.5 rounded border text-center ${
                      detectionResult.targetEngine === "multimodal_llm"
                        ? "bg-purple-950/60 text-purple-300 border-purple-800/80 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                        : "bg-indigo-950/60 text-[#818CF8] border-indigo-800/80 shadow-[0_0_12px_rgba(129,140,248,0.2)]"
                    }`}
                  >
                    <span className="block text-[9px] text-slate-400">已路由至目标引擎</span>
                    <span className="font-bold text-white text-xs">
                      {detectionResult.targetEngineName} ({detectionResult.targetModel})
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed bg-[#141418] p-2.5 rounded border border-[#2D2D33]">
                  {detectionResult.reason}
                </p>
              </div>
            )}

            {/* Execution Simulated Output */}
            {executionOutput && (
              <div className="p-3 bg-[#0A0A0C] border border-[#4F46E5] rounded-xl font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {executionOutput}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Tab: Raw config.toml View */
        <div className="bg-[#141418] rounded-xl border border-[#2D2D33] overflow-hidden">
          <div className="bg-[#1A1A20] px-4 py-2.5 border-b border-[#2D2D33] text-xs font-mono text-[#94A3B8] flex items-center justify-between">
            <span className="text-white font-semibold flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#818CF8]" />
              <span>config.toml (Raw Configuration File)</span>
            </span>
            <span className="text-[11px] text-[#818CF8]">TOML Specification 1.0</span>
          </div>
          <textarea
            value={rawToml}
            onChange={(e) => setRawToml(e.target.value)}
            className="w-full h-96 p-4 font-mono text-xs text-slate-200 outline-none leading-relaxed resize-y bg-[#0A0A0C]"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
};
