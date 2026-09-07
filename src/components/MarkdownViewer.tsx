import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  ExternalLink,
  ZoomIn,
  X,
  AlertTriangle,
  Info,
  Layers,
  FileText,
  Copy,
  Check,
  Clock,
} from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  filePath: string;
  onNavigateLink: (target: string) => void;
  backlinks?: string[];
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  filePath,
  onNavigateLink,
  backlinks = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "'JetBrains Mono', 'Inter', system-ui, sans-serif",
      themeVariables: {
        darkMode: true,
        background: "#0A0A0C",
        mainBkg: "#141418",
        nodeBorder: "#4F46E5",
        lineColor: "#818CF8",
        textColor: "#E2E8F0",
      },
    });

    if (containerRef.current) {
      const mermaidBlocks = containerRef.current.querySelectorAll(".mermaid-container");
      mermaidBlocks.forEach(async (el, idx) => {
        const rawCode = el.getAttribute("data-code");
        if (rawCode && !el.getAttribute("data-rendered")) {
          try {
            const id = `mermaid-svg-${Date.now()}-${idx}`;
            const { svg } = await mermaid.render(id, rawCode);
            el.innerHTML = svg;
            el.setAttribute("data-rendered", "true");
          } catch (e) {
            console.warn("Mermaid rendering error:", e);
            el.innerHTML = `<div class="p-3 bg-[#1A1A20] text-amber-400 text-xs rounded border border-[#2D2D33] font-mono overflow-auto">Mermaid 预览渲染异常:<br>${rawCode}</div>`;
          }
        }
      });
    }
  }, [content]);

  // Convert raw markdown into blocks with custom handling
  const renderFormattedContent = () => {
    if (!content) return <div className="text-[#94A3B8] py-8 text-center font-mono text-xs">暂无内容</div>;

    // Split markdown into chunks
    const lines = content.split("\n");
    const blocks: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer: string[] = [];
    let inDetails = false;
    let detailsSummary = "";
    let detailsBuffer: string[] = [];
    let inTimeline = false;
    let timelineBuffer: string[] = [];

    const flushCode = (idx: number) => {
      const fullCode = codeBuffer.join("\n");
      if (codeLanguage === "mermaid") {
        blocks.push(
          <div
            key={`mermaid-${idx}`}
            className="my-4 p-3 bg-[#0A0A0C] border border-[#2D2D33] rounded-lg overflow-x-auto"
          >
            <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2 border-b border-[#2D2D33] pb-1.5 font-mono">
              <span className="font-semibold flex items-center gap-1.5 text-[#818CF8]">
                <Layers className="w-3.5 h-3.5" /> MERMAID ARCHITECTURE TOPOLOGY
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fullCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
              >
                {copied ? <Check className="w-3 h-3 text-[#4ADE80]" /> : <Copy className="w-3 h-3" />}
                {copied ? "COPIED" : "COPY CODE"}
              </button>
            </div>
            <div
              className="mermaid-container flex justify-center py-2"
              data-code={fullCode}
            />
            <div className="text-[10px] text-[#94A3B8] italic text-center font-mono mt-1">
              Auto-generated Mermaid diagram (v1.0.4)
            </div>
          </div>
        );
      } else {
        blocks.push(
          <pre
            key={`code-${idx}`}
            className="my-3 p-3 bg-[#0A0A0C] text-[#E2E8F0] rounded-lg font-mono text-xs overflow-x-auto border border-[#2D2D33]"
          >
            <code>{fullCode}</code>
          </pre>
        );
      }
      codeBuffer = [];
      codeLanguage = "";
    };

    const flushDetails = (idx: number) => {
      const innerText = detailsBuffer.join("\n");
      blocks.push(
        <details
          key={`details-${idx}`}
          open
          className="my-3 border-l-4 border-[#4F46E5] bg-[rgba(79,70,229,0.06)] border border-[#2D2D33] rounded-r-lg p-3 text-xs text-slate-300 transition-all"
        >
          <summary className="font-bold text-[10px] uppercase tracking-wider text-[#818CF8] cursor-pointer select-none outline-none hover:text-white flex items-center gap-2">
            {detailsSummary || "🔍 AI MULTIMODAL SEMANTIC DECONSTRUCTION"}
          </summary>
          <div className="mt-2.5 pt-2.5 border-t border-[#2D2D33] text-xs leading-relaxed space-y-1.5 text-slate-300">
            {innerText.split("\n").map((line, lidx) => {
              if (line.trim().startsWith("- ")) {
                return (
                  <div key={lidx} className="flex items-start gap-2">
                    <span className="text-[#818CF8] font-bold">•</span>
                    <span>{renderInline(line.replace(/^- /, ""))}</span>
                  </div>
                );
              }
              return <p key={lidx}>{renderInline(line)}</p>;
            })}
          </div>
        </details>
      );
      detailsBuffer = [];
      detailsSummary = "";
    };

    const flushTimeline = (idx: number) => {
      const rawXml = timelineBuffer.join("\n");
      const eventRegex = /<TimelineEvent\s+time=["'](.*?)["']\s+title=["'](.*?)["']>([\s\S]*?)<\/TimelineEvent>/g;
      const events: Array<{ time: string; title: string; desc: string }> = [];
      let m;
      while ((m = eventRegex.exec(rawXml)) !== null) {
        events.push({
          time: m[1].trim(),
          title: m[2].trim(),
          desc: m[3].trim(),
        });
      }

      blocks.push(
        <div key={`timeline-${idx}`} className="my-6 p-4 rounded-xl bg-[#0F0F14] border border-[#2D2D33] shadow-md">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2D2D33]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#818CF8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#818CF8] font-mono">
                CHRONOLOGICAL TIMELINE (事件演进编年史)
              </span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {events.length} 个事件节点
            </span>
          </div>
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-indigo-900">
            {events.map((ev, eIdx) => (
              <div key={eIdx} className="relative group">
                {/* Indicator Dot */}
                <div className="absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full bg-[#818CF8] ring-4 ring-[#818CF8]/20 group-hover:scale-125 transition-transform" />
                
                {/* Header / Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-mono font-semibold">
                    {ev.time}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {ev.title}
                  </h4>
                </div>

                {/* Description */}
                <div className="text-xs text-slate-300 leading-relaxed bg-[#15151B] p-2.5 rounded-lg border border-[#26262C] mt-1.5">
                  {renderInline(ev.desc)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      timelineBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          flushCode(i);
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().replace("```", "").trim();
          codeBuffer = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // <details>
      if (line.includes("<details")) {
        inDetails = true;
        detailsBuffer = [];
        continue;
      }
      if (line.includes("</details>")) {
        if (inDetails) {
          flushDetails(i);
          inDetails = false;
        }
        continue;
      }
      if (inDetails) {
        if (line.includes("<summary>")) {
          const match = line.match(/<summary>(.*?)<\/summary>/);
          if (match) {
            // Strip tags
            detailsSummary = match[1].replace(/<[^>]+>/g, "").trim();
          }
        } else {
          detailsBuffer.push(line);
        }
        continue;
      }

      // <Timeline>
      if (line.includes("<Timeline>")) {
        inTimeline = true;
        timelineBuffer = [];
        continue;
      }
      if (line.includes("</Timeline>")) {
        if (inTimeline) {
          flushTimeline(i);
          inTimeline = false;
        }
        continue;
      }
      if (inTimeline) {
        timelineBuffer.push(line);
        continue;
      }

      // Image
      const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
      if (imgMatch) {
        const alt = imgMatch[1];
        let src = imgMatch[2];
        // If relative to raw/assets
        if (src.includes("raw/assets/")) {
          const assetName = src.split("raw/assets/")[1];
          src = `/raw/assets/${assetName}`;
        }
        blocks.push(
          <div key={`img-${i}`} className="my-4 group relative inline-block max-w-full">
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-900/5 shadow-sm p-1">
              <img
                src={src}
                alt={alt}
                className="max-h-80 max-w-full rounded object-contain cursor-zoom-in"
                onClick={() => setZoomImage(src)}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#94A3B8] mt-1 px-1">
              <span>{alt || "示意图"}</span>
              <button
                onClick={() => setZoomImage(src)}
                className="text-[#818CF8] hover:text-white flex items-center gap-1 cursor-pointer font-mono text-[11px]"
              >
                <ZoomIn className="w-3 h-3" /> 查看原图
              </button>
            </div>
          </div>
        );
        continue;
      }

      // Blockquote / Callout
      if (line.startsWith("> [!WARNING]")) {
        const warnText = line.replace("> [!WARNING]", "").trim();
        blocks.push(
          <div
            key={`warn-${i}`}
            className="my-3 p-3 bg-amber-950/30 border-l-4 border-amber-500 border-y border-r border-[#2D2D33] rounded-r text-amber-200 text-xs flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5 font-mono text-amber-300">CONFLICT & ALERT</strong>
              {renderInline(warnText)}
            </div>
          </div>
        );
        continue;
      }

      if (line.startsWith("> [!NOTE]")) {
        const noteText = line.replace("> [!NOTE]", "").trim();
        blocks.push(
          <div
            key={`note-${i}`}
            className="my-3 p-3 bg-indigo-950/30 border-l-4 border-[#4F46E5] border-y border-r border-[#2D2D33] rounded-r text-indigo-200 text-xs flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-[#818CF8] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5 font-mono text-[#818CF8]">NOTE & SPEC</strong>
              {renderInline(noteText)}
            </div>
          </div>
        );
        continue;
      }

      if (line.startsWith("> ")) {
        blocks.push(
          <blockquote
            key={`quote-${i}`}
            className="my-2 pl-3 border-l-2 border-[#4F46E5] text-[#94A3B8] italic text-xs font-mono"
          >
            {renderInline(line.replace(/^>\s*/, ""))}
          </blockquote>
        );
        continue;
      }

      // Headings
      if (line.startsWith("# ")) {
        blocks.push(
          <h1 key={`h1-${i}`} className="text-2xl font-bold text-white mt-5 mb-3 border-b border-[#2D2D33] pb-2 tracking-tight">
            {renderInline(line.replace(/^#\s*/, ""))}
          </h1>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        blocks.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-slate-100 mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#4F46E5] rounded-full inline-block"></span>
            {renderInline(line.replace(/^##\s*/, ""))}
          </h2>
        );
        continue;
      }
      if (line.startsWith("### ")) {
        blocks.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-[#818CF8] mt-3 mb-1.5 font-mono">
            {renderInline(line.replace(/^###\s*/, ""))}
          </h3>
        );
        continue;
      }

      // HR
      if (line.trim() === "---" || line.trim() === "***") {
        blocks.push(<hr key={`hr-${i}`} className="my-4 border-[#2D2D33]" />);
        continue;
      }

      // Bullet lists
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        blocks.push(
          <div key={`li-${i}`} className="flex items-start gap-2 text-xs text-slate-300 my-1 pl-2">
            <span className="text-[#818CF8] font-bold">•</span>
            <span className="leading-relaxed">{renderInline(line.trim().replace(/^[-*]\s*/, ""))}</span>
          </div>
        );
        continue;
      }

      // Table formatting helper
      if (line.startsWith("|") && line.endsWith("|")) {
        if (line.includes("---")) continue; // separator
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        blocks.push(
          <div key={`tbl-${i}`} className="grid grid-flow-col auto-cols-fr gap-2 py-1.5 px-2 bg-[#1A1A20] border-b border-[#2D2D33] text-xs font-mono">
            {cells.map((cell, cidx) => (
              <span key={cidx} className="font-medium text-slate-300">
                {renderInline(cell)}
              </span>
            ))}
          </div>
        );
        continue;
      }

      // Regular paragraph
      if (line.trim().length > 0) {
        blocks.push(
          <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed my-1.5">
            {renderInline(line)}
          </p>
        );
      }
    }

    return blocks;
  };

  // Inline formatting: parse `[[WikiLink]]`, `code`, **bold**, *italic*, #tags
  const renderInline = (text: string): React.ReactNode => {
    // Match [[WikiLink]]
    const parts = text.split(/(\[\[.*?\]\]|`[^`]+`|\*\*.*?\*\*|#[^\s#]+)/g);

    return parts.map((part, idx) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const linkName = part.slice(2, -2).trim();
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateLink(linkName);
            }}
            className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-[rgba(79,70,229,0.2)] text-[#818CF8] hover:bg-[#4F46E5] hover:text-white border border-[rgba(79,70,229,0.35)] font-mono text-[11px] transition-colors cursor-pointer"
            title={`跳转至实体：${linkName}`}
          >
            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            {linkName}
          </button>
        );
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="mx-0.5 px-1.5 py-0.5 bg-[#0A0A0C] text-[#818CF8] rounded font-mono text-[11px] border border-[#2D2D33]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("#") && part.length > 1) {
        return (
          <span
            key={idx}
            className="high-density-token mx-0.5"
          >
            {part}
          </span>
        );
      }

      return part;
    });
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto py-1">
      {/* Main rendered blocks */}
      <div className="space-y-1">{renderFormattedContent()}</div>

      {/* Backlinks (反向链接) section if available */}
      {backlinks.length > 0 && (
        <div className="mt-8 pt-4 border-t border-[#2D2D33]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] mb-2.5 font-mono">
            <FileText className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>BACKLINKS TOPOLOGY ({backlinks.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {backlinks.map((bl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onNavigateLink(bl)}
                className="high-density-token hover:bg-[#4F46E5] hover:text-white transition-colors cursor-pointer"
              >
                <span>[[{bl}]]</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Full Image Zoom */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 p-2 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage}
              alt="High Resolution Preview"
              className="max-h-[85vh] max-w-full rounded object-contain mx-auto"
            />
            <div className="text-center text-xs text-slate-400 mt-2">
              原生高清资产图 · 点击背景或右上角关闭
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
