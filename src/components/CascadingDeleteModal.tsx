import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Check, RefreshCw } from "lucide-react";
import { CascadingDeleteReport } from "../types";

interface CascadingDeleteModalProps {
  filePath: string;
  onClose: () => void;
  onConfirmDelete: (path: string) => Promise<{ success: boolean; cascaded: boolean; report?: CascadingDeleteReport }>;
}

export const CascadingDeleteModal: React.FC<CascadingDeleteModalProps> = ({
  filePath,
  onClose,
  onConfirmDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [resultReport, setResultReport] = useState<CascadingDeleteReport | null>(null);

  const isRawFile = filePath.startsWith("raw/archive");

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await onConfirmDelete(filePath);
    setIsDeleting(false);
    if (res.report) {
      setResultReport(res.report);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141418] rounded-xl max-w-md w-full p-5 shadow-2xl border border-[#2D2D33] space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#2D2D33] pb-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>CONFIRM CASCADING AUTO-CLEAN (级联删除)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#94A3B8] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!resultReport ? (
          <>
            <div className="text-xs text-[#94A3B8] space-y-2">
              <p>
                即将从知识库中删除目标文件：
                <span className="font-mono font-bold text-white block mt-1 p-2 bg-[#0A0A0C] border border-[#2D2D33] rounded text-[11px]">
                  {filePath}
                </span>
              </p>

              {isRawFile ? (
                <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded text-amber-200 text-[11px] space-y-1.5 font-mono">
                  <span className="font-bold block flex items-center gap-1 text-amber-400">
                    ⚡ 级联清理引擎触发机制 (AUTO-CLEAN ENGINE):
                  </span>
                  <ul className="list-disc list-inside space-y-1 opacity-90">
                    <li>自动销毁对应的 <code className="text-white">wiki/source_summaries/</code> 提炼摘要</li>
                    <li>扫描全库依赖该文件的 <code className="text-white">wiki/entities/</code> 实体页</li>
                    <li>
                      <strong className="text-amber-300">独家支撑实体</strong>：将被自动彻底物理删除
                    </li>
                    <li>
                      <strong className="text-amber-300">多来源支撑实体</strong>：仅剥离引述此文件的段落，保持其他知识完好
                    </li>
                    <li>自动修复全局引用断链并重新生成 <code className="text-white">wiki/index.md</code></li>
                  </ul>
                </div>
              ) : (
                <p className="text-[#94A3B8]">
                  此为 Wiki 派生文档或系统文件。删除后系统将自动重新校验并刷新全局索引。
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2D2D33]">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded text-xs font-mono font-medium text-[#94A3B8] hover:text-white bg-[#1A1A20] border border-[#2D2D33] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-rose-600/90 text-white hover:bg-rose-600 border border-rose-500/50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "PURGING & HEALING..." : "CONFIRM PURGE"}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3 font-mono">
            <div className="p-3 bg-emerald-950/20 border border-emerald-800/60 rounded text-emerald-200 text-xs space-y-1.5">
              <span className="font-bold flex items-center gap-1 text-[#4ADE80]">
                <Check className="w-4 h-4 text-[#4ADE80]" />
                CASCADING AUTO-CLEAN COMPLETED
              </span>
              <div className="text-[11px] space-y-1 pt-1 opacity-90">
                <div>• PURGED SUMMARIES: {resultReport.purgedSummaries.join(", ") || "NONE"}</div>
                <div>• PURGED ENTITIES: {resultReport.purgedEntities.join(", ") || "NONE"}</div>
                <div>• TRIMMED MULTI-SOURCE: {resultReport.modifiedEntities.join(", ") || "NONE"}</div>
                <div>• TOPOLOGY & REFS RE-INDEXED</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded text-xs font-mono font-medium bg-[#4F46E5] text-white hover:bg-[#4338CA] cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
