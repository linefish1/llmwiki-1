import React, { useState, useEffect } from "react";
import { Terminal, Play, CheckCircle2, Copy, Check, Search, BookOpen, MessageSquareCode } from "lucide-react";
import { McpTool } from "../types";

export const McpPlayground: React.FC = () => {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>("search_wiki");
  const [argsInput, setArgsInput] = useState<string>('{"query": "空中成像"}');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMcpConfig, setCopiedMcpConfig] = useState(false);

  useEffect(() => {
    fetch("/api/mcp/tools")
      .then((r) => r.json())
      .then((data) => {
        if (data.tools) setTools(data.tools);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    if (toolName === "search_wiki") {
      setArgsInput('{"query": "空中成像"}');
    } else if (toolName === "read_entity_page") {
      setArgsInput('{"entity_name": "空中成像提词模组"}');
    } else if (toolName === "query_wiki_synthesis") {
      setArgsInput('{"question": "空中成像提词模组的负折射透镜与OLED是如何协同工作的？"}');
    }
  };

  const handleCallTool = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(argsInput);
      } catch (e) {
        alert("参数 JSON 格式不合法，请检查！");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/mcp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: selectedTool, arguments: parsedArgs }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (err: any) {
      setResult(`执行错误: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const mcpJsonConfig = JSON.stringify(
    {
      mcpServers: {
        "personal-wiki": {
          command: "python",
          args: ["D:\\PersonalWiki\\scripts\\mcp_server.py"],
          env: {},
        },
      },
    },
    null,
    2
  );

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-4">
      {/* Header */}
      <div className="border-b border-[#2D2D33] pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#818CF8]"></span>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            本地 FastMCP 服务端与外部 AI 工具接口 (MCP PROTOCOL)
          </h2>
          <span className="high-density-token font-mono text-[10px]">
            MCP PROTOCOL v1.0
          </span>
        </div>
        <p className="text-xs text-[#94A3B8]">
          通过标准 Model Context Protocol 向 Cursor、Claude Code、VS Code 等外部 AI 客户端无缝暴露知识库检索、实体抽取与深度综合能力。
        </p>
      </div>

      {/* External AI Client Config Card */}
      <div className="p-4 bg-[#141418] text-slate-100 rounded-lg border border-[#2D2D33] shadow-md text-xs space-y-3 font-mono">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#818CF8] flex items-center gap-1.5">
            <Terminal className="w-4 h-4" /> CURSOR / CLAUDE CODE CONFIG (claude_desktop_config.json)
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mcpJsonConfig);
              setCopiedMcpConfig(true);
              setTimeout(() => setCopiedMcpConfig(false), 2000);
            }}
            className="px-2.5 py-1 bg-[#1A1A20] hover:bg-[#25252D] text-slate-200 border border-[#2D2D33] rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
          >
            {copiedMcpConfig ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedMcpConfig ? "COPIED" : "COPY CONFIG"}</span>
          </button>
        </div>
        <pre className="p-3 bg-[#0A0A0C] border border-[#2D2D33] rounded font-mono text-[11px] text-[#4ADE80] overflow-x-auto">
          <code>{mcpJsonConfig}</code>
        </pre>
      </div>

      {/* Interactive Tool Playground */}
      <div className="bg-[#141418] rounded-lg border border-[#2D2D33] shadow-md overflow-hidden space-y-4 p-5 font-mono">
        <div className="flex items-center justify-between border-b border-[#2D2D33] pb-3">
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-[#818CF8]" />
            MCP TOOL INTERACTIVE PLAYGROUND
          </span>
          <span className="text-xs text-[#94A3B8]">RUNTIME: LOCAL FASTMCP DAEMON</span>
        </div>

        {/* Tool Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tools.map((t) => (
            <button
              key={t.name}
              onClick={() => handleToolChange(t.name)}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                selectedTool === t.name
                  ? "border-[#818CF8] bg-[rgba(79,70,229,0.2)] text-white shadow-xs"
                  : "border-[#2D2D33] hover:border-[#4F46E5] text-slate-300 bg-[#1A1A20]"
              }`}
            >
              <div className="font-mono font-bold text-xs flex items-center gap-1.5 mb-1">
                {t.name === "search_wiki" && <Search className="w-3.5 h-3.5 text-[#818CF8]" />}
                {t.name === "read_entity_page" && <BookOpen className="w-3.5 h-3.5 text-[#4ADE80]" />}
                {t.name === "query_wiki_synthesis" && <MessageSquareCode className="w-3.5 h-3.5 text-indigo-400" />}
                <span className="text-white">{t.name}()</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                {t.description}
              </p>
            </button>
          ))}
        </div>

        {/* Arguments Input */}
        <div>
          <label className="block text-xs font-semibold text-white mb-1.5">
            调用参数 (JSON SCHEMA ARGUMENTS)
          </label>
          <textarea
            value={argsInput}
            onChange={(e) => setArgsInput(e.target.value)}
            className="w-full h-20 p-3 font-mono text-xs bg-[#0A0A0C] border border-[#2D2D33] text-slate-200 rounded-lg outline-none focus:border-[#818CF8] transition"
            spellCheck={false}
          />
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleCallTool}
            disabled={isLoading}
            className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-medium flex items-center gap-2 border border-[#4F46E5] shadow-xs cursor-pointer transition font-mono"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "EXECUTING..." : `EXECUTE @mcp.tool() ${selectedTool}`}</span>
          </button>
        </div>

        {/* Execution Output */}
        {result !== null && (
          <div className="mt-4 border-t border-[#2D2D33] pt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#94A3B8]">
              <span className="font-semibold text-white">RESULT PAYLOAD</span>
              <span className="text-[11px] text-[#4ADE80] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK
              </span>
            </div>
            <div className="p-4 bg-[#0A0A0C] text-slate-200 rounded-lg font-mono text-xs max-h-96 overflow-auto leading-relaxed border border-[#2D2D33]">
              {typeof result === "object" ? (
                <pre>{JSON.stringify(result, null, 2)}</pre>
              ) : (
                <div className="whitespace-pre-wrap">{result}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
