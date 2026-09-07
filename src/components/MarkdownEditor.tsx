import React, { useState, useEffect } from "react";
import { Save, Eye, Edit3, Columns, Check, AlertCircle } from "lucide-react";
import { MarkdownViewer } from "./MarkdownViewer";

interface MarkdownEditorProps {
  filePath: string;
  initialContent: string;
  onSave: (path: string, newContent: string) => Promise<boolean>;
  onNavigateLink: (target: string) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  filePath,
  initialContent,
  onSave,
  onNavigateLink,
}) => {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<"edit" | "split" | "preview">("split");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(initialContent);
    setHasChanges(false);
  }, [initialContent, filePath]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(e.target.value !== initialContent);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const ok = await onSave(filePath, content);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141418] rounded-lg border border-[#2D2D33] overflow-hidden shadow-lg">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A20] border-b border-[#2D2D33] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-mono text-white font-semibold truncate max-w-md">
            {filePath}
          </span>
          {hasChanges && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/60 text-[10px] font-medium flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              DIRTY (UNSAVED)
            </span>
          )}
          {saveSuccess && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-[#4ADE80] border border-emerald-800/60 text-[10px] font-medium flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" />
              DIFF SYNCHRONIZED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex items-center bg-[#141418] border border-[#2D2D33] p-0.5 rounded text-xs font-mono">
            <button
              onClick={() => setMode("edit")}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition cursor-pointer ${
                mode === "edit" ? "bg-[#4F46E5] text-white shadow-xs font-medium" : "text-[#94A3B8] hover:text-white"
              }`}
              title="仅编辑"
            >
              <Edit3 className="w-3 h-3" />
              <span>EDIT</span>
            </button>
            <button
              onClick={() => setMode("split")}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition cursor-pointer ${
                mode === "split" ? "bg-[#4F46E5] text-white shadow-xs font-medium" : "text-[#94A3B8] hover:text-white"
              }`}
              title="分栏对照"
            >
              <Columns className="w-3 h-3" />
              <span>SPLIT</span>
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition cursor-pointer ${
                mode === "preview" ? "bg-[#4F46E5] text-white shadow-xs font-medium" : "text-[#94A3B8] hover:text-white"
              }`}
              title="仅预览"
            >
              <Eye className="w-3 h-3" />
              <span>PREVIEW</span>
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`px-3 py-1 rounded font-medium text-xs font-mono flex items-center gap-1.5 transition ${
              hasChanges
                ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white border border-[#4F46E5] shadow-xs cursor-pointer"
                : "bg-[#1A1A20] text-slate-500 border border-[#2D2D33] cursor-not-allowed"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "SYNCING DIFF..." : "SAVE DIFF"}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        {(mode === "edit" || mode === "split") && (
          <div
            className={`flex-1 flex flex-col h-full bg-[#0A0A0C] ${
              mode === "split" ? "border-r border-[#2D2D33]" : ""
            }`}
          >
            <textarea
              value={content}
              onChange={handleTextChange}
              placeholder="编写 Markdown 内容..."
              className="w-full h-full p-4 font-mono text-xs text-slate-200 bg-[#0A0A0C] resize-none outline-none leading-relaxed overflow-auto selection:bg-[rgba(79,70,229,0.3)]"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Preview Area */}
        {(mode === "preview" || mode === "split") && (
          <div className="flex-1 h-full overflow-auto p-4 bg-[#141418]">
            <MarkdownViewer
              content={content}
              filePath={filePath}
              onNavigateLink={onNavigateLink}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-1.5 bg-[#0A0A0C] border-t border-[#2D2D33] text-[11px] font-mono text-[#94A3B8] flex items-center justify-between">
        <span>CHARS: {content.length} | LINES: {content.split("\n").length}</span>
        <span className="text-[#818CF8]">
          AI PROTOCOL: AUTO-SCANNING LOCAL REFS & HEALING TOPOLOGY INDEX
        </span>
      </div>
    </div>
  );
};
