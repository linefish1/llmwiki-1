import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Layers,
  FileCode,
} from "lucide-react";

interface IngestUploadProps {
  onIngestSuccess: () => void;
  onNavigateFile: (path: string) => void;
}

export const IngestUpload: React.FC<IngestUploadProps> = ({
  onIngestSuccess,
  onNavigateFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "warning" | "error" | "info";
    title: string;
    description: string;
    details?: string[];
    outputPath?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage({
      type: "info",
      title: "正在通过格式拦截管线...",
      description: `处理投递文件「${file.name}」：校验格式、提取图像并接入多模态编译队列...`,
    });

    try {
      const isMd = file.name.toLowerCase().endsWith(".md");

      // Read content
      let content = "";
      if (isMd) {
        content = await file.text();
      } else {
        // Non-md mock text payload for rejection pipeline
        content = `[Binary / Non-MD raw payload for ${file.name}]`;
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, content }),
      });

      const data = await res.json();

      if (data.rejected) {
        setStatusMessage({
          type: "warning",
          title: "格式拦截触发 (Format Guard Intercepted)",
          description: data.message,
          details: [
            "拦截原因：非 .md 格式文件禁止直接进入编译队列",
            "已隔离归档：raw/rejected/" + file.name,
            "已生成指导：raw/rejected/_READ_ME_NOTICE.txt",
            "处置建议：请使用 Pandoc 或 Markdown 转换工具转码后重新投递",
          ],
          outputPath: data.outputPath,
        });
      } else if (data.success) {
        setStatusMessage({
          type: "success",
          title: "资料入库与增量编译完成 (Ingest & Synthesis Complete)",
          description: data.message,
          details: [
            `归档源文件：${data.outputPath}`,
            `提取并本地化图片：${data.imagesExtracted || 0} 张`,
            `衍生结构化实体：${(data.entitiesCreated || []).join(", ") || "已挂载至全局索引"}`,
            "全局双链索引与审计日志 (wiki/shturl.md) 已同步更新",
          ],
          outputPath: data.outputPath,
        });
        onIngestSuccess();
      } else {
        setStatusMessage({
          type: "error",
          title: "编译管线异常",
          description: data.message || "未知错误",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        title: "投递上传失败",
        description: err.message || "网络或系统错误",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Preset sample test templates
  const triggerSampleTest = (type: "valid_md" | "multimodal_md" | "non_md") => {
    if (type === "non_md") {
      const fakePdf = new File(["%PDF-1.4 mock content..."], "2026年光学行业白皮书.pdf", {
        type: "application/pdf",
      });
      handleFileUpload(fakePdf);
    } else if (type === "multimodal_md") {
      const sampleWithImage = `# 衍射光波导显示模组设计规范

## 1. 简介
衍射光波导 (Diffractive Waveguide) 是下一代轻量化 AR 与近眼显示核心组件，与 [[微型高亮OLED屏]] 及 [[空中成像提词模组]] 形成互补。

![光波导表面光栅物理微观结构](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMjAwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzBkMTEyMCIvPjxwYXRoIGQ9Ik01MCAxNTBMMTUwIDUwTDI1MCAxNTBMMzUwIDUwIiBzdHJva2U9IiMzOGJkZjgiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPjx0ZXh0IHg9IjIwMCIgeT0iMTg1IiBmaWxsPSIjOTRhM2I4IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5YWJ5rOi5a+85YyF5YWJ5qSF5b6u6KeCMS4ya21pcjwvdGV4dD48L3N2Zz4=)

## 2. 光栅核心参数
- **材料**：高折射率光学玻璃 (n = 1.85)
- **浮雕光栅周期**：380nm ± 2nm
- **视场角 (FOV)**：42度双目立体
- **协同组件**：需要高刚性 [[CNC铝合金外壳工艺]] 提供 0.02mm 框镜贴合精度。
`;
      const file = new File([sampleWithImage], "衍射光波导显示模组设计规范.md", {
        type: "text/markdown",
      });
      handleFileUpload(file);
    } else {
      const simpleMd = `# 激光雷达固态多边形振镜光学技术

## 核心要点
- 利用多面棱镜高速旋转，配合 905nm 半导体激光管。
- 与 [[空中成像提词模组]] 同属于精密光学结构件范畴。
- 采用微秒级脉冲调制输出。
`;
      const file = new File([simpleMd], "激光雷达固态多边形振镜光学技术.md", {
        type: "text/markdown",
      });
      handleFileUpload(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 space-y-4">
      {/* Header Info */}
      <div className="border-b border-[#2D2D33] pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]"></span>
          <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            资料上传与拦截管线 (INGESTION & GUARD PIPELINE)
          </h2>
          <span className="high-density-token font-mono text-[10px]">
            HUMAN BOUNDARY #1
          </span>
        </div>
        <p className="text-xs text-[#94A3B8]">
          极简人类权能入口：投递资料后，系统自动执行「格式拦截校验 $\to$ Base64 图像提取本地化 $\to$ 多模态语义解构 $\to$ 增量融合编译 Wiki」。
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-[#818CF8] bg-[rgba(79,70,229,0.15)] scale-[1.01]"
            : "border-[#2D2D33] bg-[#141418] hover:bg-[#1A1A20] hover:border-[#4F46E5]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.pdf,.docx,.png,.jpg"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isProcessing
                ? "bg-[rgba(79,70,229,0.3)] text-[#818CF8] animate-spin"
                : "bg-[#1A1A20] text-[#818CF8] border border-[#2D2D33] shadow-md"
            }`}
          >
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-sm font-semibold text-white font-mono">
              {isProcessing
                ? "SYNTHESIZING & DECONSTRUCTING MULTIMODAL KNOWLEDGE..."
                : "拖拽 Markdown 文件到此处，或点击浏览选择文件"}
            </p>
            <p className="text-xs text-[#94A3B8] mt-1">
              支持标准 .md 文件（含 Base64 内联图片、Mermaid 语法）。非 .md 格式将自动触发格式拦截与隔离。
            </p>
          </div>

          <div className="inline-flex items-center gap-2 high-density-token text-[11px] font-mono">
            <span>RULE: STRICT PLAIN-TEXT SYNTHESIS | NON-MD QUARANTINED TO raw/rejected/</span>
          </div>
        </div>
      </div>

      {/* Preset Verification Buttons */}
      <div className="p-4 bg-[#141418] rounded-lg border border-[#2D2D33] space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-[#2D2D33] pb-2 font-mono">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#818CF8]" />
            PIPELINE QUICK TESTS (一键验证测试)
          </span>
          <span className="text-[#94A3B8]">无需本地准备文件，一键体验核心自主编译管线</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => triggerSampleTest("multimodal_md")}
            disabled={isProcessing}
            className="p-3 text-left rounded-lg border border-[#2D2D33] bg-[#1A1A20] hover:bg-[#22222B] hover:border-[#4F46E5] text-white transition group cursor-pointer"
          >
            <div className="flex items-center justify-between font-semibold text-xs text-[#818CF8] mb-1 font-mono">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#818CF8]" /> 多模态图像解构测试
              </span>
              <ArrowRight className="w-3 h-3 text-[#818CF8] group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-snug">
              投递含内联图片的《衍射光波导》MD，测试 Base64 提取与视觉语义/Mermaid 生成
            </p>
          </button>

          <button
            onClick={() => triggerSampleTest("valid_md")}
            disabled={isProcessing}
            className="p-3 text-left rounded-lg border border-[#2D2D33] bg-[#1A1A20] hover:bg-[#22222B] hover:border-[#4F46E5] text-white transition group cursor-pointer"
          >
            <div className="flex items-center justify-between font-semibold text-xs text-[#4ADE80] mb-1 font-mono">
              <span className="flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-[#4ADE80]" /> 增量实体演进测试
              </span>
              <ArrowRight className="w-3 h-3 text-[#4ADE80] group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-snug">
              投递《激光雷达振镜》，测试双向链接抽取、实体页生成与全库 Index 自动刷新
            </p>
          </button>

          <button
            onClick={() => triggerSampleTest("non_md")}
            disabled={isProcessing}
            className="p-3 text-left rounded-lg border border-[#2D2D33] bg-[#1A1A20] hover:bg-[#22222B] hover:border-amber-500/50 text-white transition group cursor-pointer"
          >
            <div className="flex items-center justify-between font-semibold text-xs text-amber-400 mb-1 font-mono">
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> 格式拦截守卫测试
              </span>
              <ArrowRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-[11px] text-[#94A3B8] leading-snug">
              投递 .pdf 文件，测试自动拦截、存入 raw/rejected/ 并生成转码指导通知
            </p>
          </button>
        </div>
      </div>

      {/* Result Status Card */}
      {statusMessage && (
        <div
          className={`p-4 rounded-lg border text-xs transition-all font-mono ${
            statusMessage.type === "success"
              ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
              : statusMessage.type === "warning"
              ? "bg-amber-950/20 border-amber-800/60 text-amber-200"
              : statusMessage.type === "info"
              ? "bg-indigo-950/20 border-indigo-800/60 text-indigo-200"
              : "bg-rose-950/20 border-rose-800/60 text-rose-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#4ADE80] shrink-0 mt-0.5" />
            ) : statusMessage.type === "warning" ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#818CF8] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white">{statusMessage.title}</h4>
                {statusMessage.outputPath && (
                  <button
                    onClick={() => onNavigateFile(statusMessage.outputPath!)}
                    className="px-2.5 py-1 bg-[#1A1A20] border border-[#2D2D33] hover:border-[#4F46E5] text-white rounded font-mono text-[11px] cursor-pointer"
                  >
                    VIEW IN EDITOR
                  </button>
                )}
              </div>
              <p className="leading-relaxed opacity-90">{statusMessage.description}</p>
              {statusMessage.details && (
                <ul className="mt-2 space-y-1 border-t border-[#2D2D33] pt-2 font-mono text-[11px]">
                  {statusMessage.details.map((d, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-[#818CF8]">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
