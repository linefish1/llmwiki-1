import fs from "fs";
import path from "path";

export interface WikiFileInfo {
  path: string;
  name: string;
  folder: string;
  category: "raw_archive" | "raw_inbox" | "raw_rejected" | "wiki_entity" | "wiki_synthesis" | "wiki_summary" | "wiki_root" | "schema" | "config" | "script" | "asset";
  content?: string;
  size: number;
  updatedAt: string;
  isImage?: boolean;
}

export interface WikiStats {
  entitiesCount: number;
  sourceSummariesCount: number;
  rawArchiveCount: number;
  rejectedCount: number;
  synthesisCount: number;
  linksCount: number;
  totalImages: number;
  lastLintAt: string;
}

export const WORKSPACE_ROOT = path.join(process.cwd(), "PersonalWiki");

export function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function initWorkspace() {
  const folders = [
    "schema",
    "raw/inbox",
    "raw/archive",
    "raw/assets",
    "raw/rejected",
    "wiki/entities",
    "wiki/synthesis",
    "wiki/source_summaries",
    "scripts",
  ];

  folders.forEach((sub) => ensureDirectory(path.join(WORKSPACE_ROOT, sub)));

  // 1. schema/AGENTS.md
  const agentsMdPath = path.join(WORKSPACE_ROOT, "schema/AGENTS.md");
  if (!fs.existsSync(agentsMdPath)) {
    fs.writeFileSync(
      agentsMdPath,
      `# AGENTS.md - LLM Wiki AI 编译器控制协议与冲突解决规范

## 一、 核心准则
1. **真实性与证据溯源**：所有实体提取与摘要总结必须标注来源文件（如 \`来源: [[空中成像提词模组设计文档]]\`）。严禁捏造未在原始文档中出现的参数。
2. **结构化双向链接**：在提到任何概念、材料、工艺、产品或组件时，必须使用 \`[[双链]]\` 语法包裹，确保知识图谱互联互通。
3. **多模态图像解构**：针对每张图片必须保留原生相对路径引用，紧随其后附带 \`<details open><summary><b>🔍 AI 图像视觉语义解构</b></summary>...</details>\`，解析空间布局、外观、材质与视觉标签，并尽可能生成 Mermaid 架构图。
4. **冲突调和策略**：
   - 若不同资料出现参数冲突，不要擅自覆盖，必须使用标记：
     > [!WARNING] 冲突标识: 来源 A 标注工作电压为 5V，来源 B 标注工作电压为 9V (需人工校验)
5. **增量演进与实体维护**：
   - 实体页采用倒序或模块化追加。
   - 保持 \`wiki/index.md\` 全局目录与 \`wiki/shturl.md\` 时间线日志同步更新。
`,
      "utf-8"
    );
  }

  // 2. config.toml
  const configTomlPath = path.join(WORKSPACE_ROOT, "config.toml");
  if (!fs.existsSync(configTomlPath)) {
    fs.writeFileSync(
      configTomlPath,
      `# LLM Wiki Multi-Model Configuration
# 存储 API Keys、模型路由与巡检频率

[general]
workspace_path = "D:\\\\PersonalWiki"
version = "1.0.0"
auto_heal_interval_hours = 24
last_lint_timestamp = "2026-09-07T02:00:00Z"

[engines.triage]
# 快速预处理 & Diff 路由 (追求极速/低成本)
provider = "deepseek"
model = "deepseek-chat"
api_key = "sk-deepseek-default-placeholder"
fallback_provider = "gemini"
fallback_model = "gemini-3.8-flash"

[engines.vision]
# 图像/架构图解构 (必须支持 Vision)
provider = "gemini"
model = "gemini-3.8-flash"
fallback_provider = "local_ollama"
fallback_model = "qwen2.5-vl:7b"

[engines.synthesis]
# 深度编译与实体融合 (强 Markdown & 上下文)
provider = "gemini"
model = "gemini-3.8-flash"
fallback_provider = "anthropic"
fallback_model = "claude-3-7-sonnet-20250219"

[engines.lint]
# 全库逻辑巡检 (强 Reasoning 思考链)
provider = "gemini"
model = "gemini-3.8-flash"
fallback_provider = "deepseek"
fallback_model = "deepseek-reasoner"
`,
      "utf-8"
    );
  }

  // 3. raw/assets sample image
  const sampleAssetPath = path.join(WORKSPACE_ROOT, "raw/assets/teleprompter_hardware_01.svg");
  if (!fs.existsSync(sampleAssetPath)) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="100%" height="100%">
  <defs>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="50%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="beam" x1="0%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#60a5fa" stop-opacity="0.1"/>
    </linearGradient>
  </defs>
  <rect width="600" height="360" fill="#090d16" rx="8"/>
  <rect x="60" y="240" width="480" height="70" rx="10" fill="url(#metal)" stroke="#475569" stroke-width="2"/>
  <text x="300" y="280" fill="#94a3b8" font-family="sans-serif" font-size="14" font-weight="bold" text-anchor="middle">CNC 发丝纹铝合金外壳底座 (120x65x15mm)</text>
  <rect x="180" y="228" width="240" height="12" rx="4" fill="#0284c7" opacity="0.9"/>
  <text x="300" y="222" fill="#38bdf8" font-family="sans-serif" font-size="12" text-anchor="middle">高亮微型 OLED 屏 (2000 nits)</text>
  <line x1="200" y1="228" x2="380" y2="90" stroke="#0ea5e9" stroke-width="6" stroke-dasharray="6,4" stroke-linecap="round"/>
  <rect x="240" y="110" width="160" height="18" rx="3" transform="rotate(-35 320 120)" fill="#7dd3fc" opacity="0.45" stroke="#38bdf8" stroke-width="2"/>
  <text x="440" y="115" fill="#a5f3fc" font-family="sans-serif" font-size="13" font-weight="bold">45° 倾斜负折射透镜组</text>
  <polygon points="200,228 360,110 320,60 160,180" fill="url(#beam)"/>
  <ellipse cx="300" cy="55" rx="75" ry="20" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="300" y="60" fill="#f0f9ff" font-family="sans-serif" font-size="15" font-weight="bold" text-anchor="middle">✨ 空中悬浮立体提词虚像 (距离透镜 80mm)</text>
</svg>`;
    fs.writeFileSync(sampleAssetPath, svgContent, "utf-8");
  }

  // 4. raw/rejected notice sample
  const rejectedNoticePath = path.join(WORKSPACE_ROOT, "raw/rejected/_READ_ME_NOTICE.txt");
  if (!fs.existsSync(rejectedNoticePath)) {
    fs.writeFileSync(
      rejectedNoticePath,
      `[系统格式拦截提醒]
检测到非 .md 格式文件投递 (例如 .pdf, .docx, .png, .txt)。
根据 LLM Wiki 协议第一条，知识库仅接收标准 Markdown 格式以确保纯文本可编译演进。
请使用 Pandoc 或 Markdown 转换工具转码后重新投递至 raw/inbox/。
已拦截文件将暂存于当前 rejected 目录供人工查验。
`,
      "utf-8"
    );
  }

  // 5. raw/archive sample docs
  const rawDoc1 = path.join(WORKSPACE_ROOT, "raw/archive/空中成像提词模组设计文档.md");
  if (!fs.existsSync(rawDoc1)) {
    fs.writeFileSync(
      rawDoc1,
      `# 空中成像提词模组设计文档

## 概述
空中成像提词模组是一种基于负折射光学平板的新型无介质悬浮显示设备。设计目标是在演讲、直播或会议场景下，将提词文本直接投影在讲者视线前方空中，无需反射玻璃，达到真正“直视观众不移开视线”的效果。

![提词充电宝物理结构图](../../raw/assets/teleprompter_hardware_01.svg)

## 硬件规格
- **物理尺寸**：120 x 65 x 15 mm，重量约 180g。
- **外壳工艺**：[[CNC铝合金外壳工艺]]，深空灰发丝纹处理，表面阳极氧化，厚度 1.2mm。
- **显示面板**：[[微型高亮OLED屏]]，分辨率 1280x720，峰值亮度达到 2000 nits，保证强光下空中成像清晰度。
- **光学组件**：[[负折射透镜组]]，采用纳米级微阵列微镜片排列，45度角放置，成像距离 80mm。

## 驱动与功耗
- 工作电压：5V / 2A (USB-C 供电)
- 功耗：日常运行 4.2W，峰值 6.5W。
`,
      "utf-8"
    );
  }

  const rawDoc2 = path.join(WORKSPACE_ROOT, "raw/archive/微型负折射透镜光学标准.md");
  if (!fs.existsSync(rawDoc2)) {
    fs.writeFileSync(
      rawDoc2,
      `# 微型负折射透镜光学标准

## 理论基础
负折射透镜 (Negative Index Flat Lens) 利用超构表面 (Metasurface) 或正交双层微反光柱阵列，将发散光束重新汇聚为同尺寸真实实像，实现无介质空中悬浮成像。

## 制造公差与检验
- **光线透射率**：> 78% (550nm 主波长)
- **微结构间距**：0.15mm ± 0.005mm
- **装配倾角**：必须严格保持与光源夹角 45.0° ± 0.2°
- **关联组件**：与 [[微型高亮OLED屏]] 配合使用，形成完整 [[空中成像提词模组]]。
`,
      "utf-8"
    );
  }

  // 6. wiki/source_summaries
  const summary1 = path.join(WORKSPACE_ROOT, "wiki/source_summaries/空中成像提词模组设计文档.md");
  if (!fs.existsSync(summary1)) {
    fs.writeFileSync(
      summary1,
      `# 来源摘要：空中成像提词模组设计文档

- **原始文件**：\`raw/archive/空中成像提词模组设计文档.md\`
- **编译时间**：2026-09-07 03:15:00
- **核心要点**：
  1. 提出基于无介质负折射光学平板的便携提词模组。
  2. 确立 120x65x15mm [[CNC铝合金外壳工艺]] 硬件形态与 180g 便携重量。
  3. 整合 2000 nits [[微型高亮OLED屏]] 与 45° [[负折射透镜组]]。
  4. 功耗约 4.2W，采用 5V Type-C 供电。
- **派生实体**：
  - [[空中成像提词模组]]
  - [[负折射透镜组]]
  - [[CNC铝合金外壳工艺]]
  - [[微型高亮OLED屏]]
`,
      "utf-8"
    );
  }

  const summary2 = path.join(WORKSPACE_ROOT, "wiki/source_summaries/微型负折射透镜光学标准.md");
  if (!fs.existsSync(summary2)) {
    fs.writeFileSync(
      summary2,
      `# 来源摘要：微型负折射透镜光学标准

- **原始文件**：\`raw/archive/微型负折射透镜光学标准.md\`
- **编译时间**：2026-09-07 03:20:00
- **核心要点**：
  1. 明确负折射平板超构表面聚光理论与无介质实像形成机理。
  2. 规定光线透射率 > 78% 以及 0.15mm 阵列制造公差。
  3. 强调 45.0° 光源倾角对 [[空中成像提词模组]] 悬浮聚焦的核心影响。
- **派生实体**：
  - [[负折射透镜组]]
  - [[微型高亮OLED屏]]
  - [[空中成像提词模组]]
`,
      "utf-8"
    );
  }

  // 7. wiki/entities
  const entity1 = path.join(WORKSPACE_ROOT, "wiki/entities/空中成像提词模组.md");
  if (!fs.existsSync(entity1)) {
    fs.writeFileSync(
      entity1,
      `# 实体：空中成像提词模组

> **类型**：硬件产品 / 智能显示组件  
> **状态**：已编译演进 (Compiled)  
> **核心标签**：\`#空中成像\` \`#智能硬件\` \`#无介质显示\`

---

## 📸 视觉资产与语义解构

![提词模组硬件光路](../../raw/assets/teleprompter_hardware_01.svg)

<details open>
<summary><b>🔍 AI 图像视觉语义解构</b></summary>

- **空间布局与外观**：120x65x15mm 哑光铝合金外壳底座；中间嵌装高亮显示面板；上半部分设置 45 度倾斜透镜组，虚像生成于透镜上方 80mm 空中。
- **色彩与材质**：深空灰发丝纹金属，结合高透射光学玻璃板与蓝色悬浮光束示意。
- **视觉标签**：\`#空中成像\` \`#CNC铝合金\` \`#负折射玻璃\` \`#微型OLED\`

</details>

\`\`\`mermaid
graph LR
    A[高亮微型OLED屏 (2000 nits)] -->|高亮度发散光| B[45° 负折射透镜组]
    B -->|光线正交反折聚光| C[无介质空中悬浮虚像 (80mm)]
    D[CNC发丝纹铝合金外壳] -.->|结构承载与散热| A
    D -.->|45°固定卡槽| B
\`\`\`

---

## 🛠️ 技术原理与系统构成
本实体是整机集成系统，通过将高亮屏幕光源通过特殊平板微透镜阵列形成空间立体汇聚。

- **显示驱动源**：采用 [[微型高亮OLED屏]]，输出高对比度提词文本。
- **光学聚光核心**：采用 [[负折射透镜组]] 实现零介质空中悬空像。
- **结构与散热**：采用 [[CNC铝合金外壳工艺]]，提供坚固防护与被动导热。

---

## 📚 溯源与关联
- **支撑来源**：
  - [[空中成像提词模组设计文档]]
  - [[微型负折射透镜光学标准]]
- **被引列表 (Backlinks)**：
  - [[微型高亮OLED屏]]
  - [[负折射透镜组]]
  - [[下一代近眼与悬浮显示技术对比]]
`,
      "utf-8"
    );
  }

  const entity2 = path.join(WORKSPACE_ROOT, "wiki/entities/负折射透镜组.md");
  if (!fs.existsSync(entity2)) {
    fs.writeFileSync(
      entity2,
      `# 实体：负折射透镜组

> **类型**：光学元器件  
> **状态**：已编译演进  
> **核心标签**：\`#负折射光学\` \`#超构表面\` \`#微阵列反光柱\`

---

## 🔬 工作机理
负折射透镜组（Micro-Reflective Array / Metasurface Plate）采用纳米/微米级正交反光微柱。入射光线进入微结构后经受两次直角正交反射，以与入射角对称的反向矢量射出，从而在空气对称距离处汇聚成为真实光点，不需要凹凸透镜的球差色差校正。

\`\`\`mermaid
flowchart TD
    In[光源点发出光线] --> Surf[平板超构表面]
    Surf -->|正交反射| Re[反向折射光束]
    Re --> Focal[空中对称焦点 (实像)]
\`\`\`

## 📐 制造工艺指标
- **透射率**：> 78% (550nm)
- **微阵列间距公差**：0.15mm ± 0.005mm
- **安装倾角精度**：45.0° ± 0.2°

## 🔗 关联实体与来源
- **母产品**：[[空中成像提词模组]]
- **协同元件**：[[微型高亮OLED屏]]
- **文献来源**：[[微型负折射透镜光学标准]]、[[空中成像提词模组设计文档]]
`,
      "utf-8"
    );
  }

  const entity3 = path.join(WORKSPACE_ROOT, "wiki/entities/CNC铝合金外壳工艺.md");
  if (!fs.existsSync(entity3)) {
    fs.writeFileSync(
      entity3,
      `# 实体：CNC铝合金外壳工艺

> **类型**：结构与制造工艺  
> **核心标签**：\`#CNC精雕\` \`#阳极氧化\` \`#铝合金\`

---

## ⚙️ 工艺规程
1. **毛坯选材**：6063-T6 航空级铝合金型材。
2. **五轴 CNC 铣削**：精密加工 45° 光学透镜卡槽与 OLED 散热背板腔体。
3. **表面处理**：深空灰色阳极氧化，结合表面精密微发丝纹抛光。
4. **配合公差**：光学镜片卡槽单边公差 ≤ +0.03mm。

## 🔗 应用设备
- [[空中成像提词模组]]
`,
      "utf-8"
    );
  }

  const entity4 = path.join(WORKSPACE_ROOT, "wiki/entities/微型高亮OLED屏.md");
  if (!fs.existsSync(entity4)) {
    fs.writeFileSync(
      entity4,
      `# 实体：微型高亮OLED屏

> **类型**：显示器件  
> **核心标签**：\`#OLED\` \`#2000nits\` \`#微显示\`

---

## 💡 规格参数
- **亮度**：2000 nits (峰值)，常规室内 800 nits
- **分辨率**：1280 x 720 (0.71 英寸)
- **刷新率**：60Hz
- **驱动接口**：MIPI-DSI 转 Type-C

## 🔗 配合组件
- 为 [[负折射透镜组]] 提供高对比度、纯黑背景的自发光源。
- 构成 [[空中成像提词模组]] 的核心发光部件。
`,
      "utf-8"
    );
  }

  // 8. wiki/synthesis
  const synthesis1 = path.join(WORKSPACE_ROOT, "wiki/synthesis/下一代近眼与悬浮显示技术对比.md");
  if (!fs.existsSync(synthesis1)) {
    fs.writeFileSync(
      synthesis1,
      `# 综合报告：下一代近眼与悬浮显示技术对比

> **生成引擎**：AI 跨文档多源融合编译器  
> **生成时间**：2026-09-07 03:30:00

---

## 1. 核心架构对比

| 显示方案 | 核心器件 | 介质要求 | 亮度要求 | 典型应用 |
| :--- | :--- | :--- | :--- | :--- |
| **空中无介质成像** | [[负折射透镜组]] + [[微型高亮OLED屏]] | 纯空气（无需透镜/眼镜） | 2000 nits | [[空中成像提词模组]]、车载空中触控 |
| **衍射光波导近眼** | 表面浮雕光栅波导 + MicroLED | 需佩戴波导眼镜 | 5000+ nits | AR 智能眼镜、全息 HUD |
| **传统棱镜折射** | 半透半分半反镜片 | 需实体半透反射板 | 800 nits | 传统演播室提词器 |

## 2. 演进趋势与知识缺口
当前知识库已完备覆盖基于负折射微阵列的空中悬浮提词方案，但对于**室外高光强直射（5000 nits+）**环境下的光学抗反光涂层暂缺详细实验记录。

> [!NOTE] 知识缺口提示
> 建议补充《微透镜阵列抗眩光多层增透镀膜规范》以完善强光场景下的光学对比度分析。
`,
      "utf-8"
    );
  }

  // 9. wiki/index.md
  const indexMd = path.join(WORKSPACE_ROOT, "wiki/index.md");
  if (!fs.existsSync(indexMd)) {
    fs.writeFileSync(
      indexMd,
      `# 📚 LLM Wiki 全局知识目录 (Index)

> 知识库状态：运行正常 (Healthy)  
> 结构化实体总数：4 | 来源摘要：2 | 综合报告：1  
> 最近自愈巡检：2026-09-07 02:00:00

---

## 🎯 核心实体库 (Entities)
- [[空中成像提词模组]] - 便携无介质空中悬浮提词整机方案
- [[负折射透镜组]] - 纳米级微阵列正交反光超构表面聚光器件
- [[微型高亮OLED屏]] - 2000 nits 自发光微型显示源
- [[CNC铝合金外壳工艺]] - 6063-T6 深空灰发丝纹精雕结构件

## 📊 综合研报 (Synthesis)
- [[下一代近眼与悬浮显示技术对比]] - 空中成像 vs 衍射光波导 vs 传统分光棱镜

## 📑 原始来源摘要 (Source Summaries)
- [[空中成像提词模组设计文档]] (对应 raw: \`空中成像提词模组设计文档.md\`)
- [[微型负折射透镜光学标准]] (对应 raw: \`微型负折射透镜光学标准.md\`)

## 🛠️ 系统控制协议
- \`schema/AGENTS.md\` - AI 编译协议与冲突准则
- \`config.toml\` - 多模型调度与路由配置文件
- \`wiki/shturl.md\` - 知识库全自动自主演进流水线时间线
`,
      "utf-8"
    );
  }

  // 10. wiki/shturl.md
  const shturlMd = path.join(WORKSPACE_ROOT, "wiki/shturl.md");
  if (!fs.existsSync(shturlMd)) {
    fs.writeFileSync(
      shturlMd,
      `# ⏱️ LLM Wiki 自主演进审计日志 (Timeline Log)

### [2026-09-07 03:30:15] [Auto-Synthesis]
- **事件**：生成跨文档综合研报 \`wiki/synthesis/下一代近眼与悬浮显示技术对比.md\`
- **涉及实体**：[[空中成像提词模组]], [[负折射透镜组]], [[微型高亮OLED屏]]

### [2026-09-07 03:20:42] [Ingest & Compile]
- **文件**：\`raw/archive/微型负折射透镜光学标准.md\`
- **动作**：提取双链实体，更新 [[负折射透镜组]]，刷新 \`wiki/index.md\`
- **状态**：成功融合，无冲突

### [2026-09-07 03:15:10] [Ingest & Multimodal Vision]
- **文件**：\`raw/archive/空中成像提词模组设计文档.md\`
- **动作**：识别嵌入图片并归一化为 \`raw/assets/teleprompter_hardware_01.svg\`
- **多模态**：完成 1 张硬件结构图解构，自动生成 Mermaid 流程图与视觉语义折叠标签
- **状态**：成功生成 3 个新实体与 1 个来源摘要

### [2026-09-07 02:00:00] [Auto-Healing Lint]
- **巡检结果**：全库巡检 4 个实体页，断链数 0，冲突标注数 0，知识库健康度 100%
`,
      "utf-8"
    );
  }

  // 11. scripts/
  const daemonPy = path.join(WORKSPACE_ROOT, "scripts/daemon.py");
  if (!fs.existsSync(daemonPy)) {
    fs.writeFileSync(
      daemonPy,
      `"""
LLM Wiki Background Daemon Service
File Watcher + Periodic Auto-Healing Scheduler
"""
import time
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

WORKSPACE = r"D:\\PersonalWiki"

class IngestHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        filename = os.path.basename(event.src_path)
        print(f"[Watcher] New file detected in inbox: {filename}")
        # Process via pipeline.py

def start_daemon():
    print("[Daemon] Starting Personal Wiki file watcher & scheduler...")
    observer = Observer()
    inbox_dir = os.path.join(WORKSPACE, "raw", "inbox")
    os.makedirs(inbox_dir, exist_ok=True)
    observer.schedule(IngestHandler(), inbox_dir, recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    start_daemon()
`,
      "utf-8"
    );
  }

  const routerPy = path.join(WORKSPACE_ROOT, "scripts/router.py");
  if (!fs.existsSync(routerPy)) {
    fs.writeFileSync(
      routerPy,
      `"""
Multi-Model Router Dispatcher
Distributes requests to DeepSeek / Claude / Gemini / Ollama
"""
import tomllib
import os

class MultiModelRouter:
    def __init__(self, config_path="config.toml"):
        with open(config_path, "rb") as f:
            self.config = tomllib.load(f)
            
    def get_engine(self, task_type: str):
        engines = self.config.get("engines", {})
        engine_cfg = engines.get(task_type, {})
        return {
            "provider": engine_cfg.get("provider", "gemini"),
            "model": engine_cfg.get("model", "gemini-3.8-flash"),
            "fallback": engine_cfg.get("fallback_model")
        }
`,
      "utf-8"
    );
  }

  const pipelinePy = path.join(WORKSPACE_ROOT, "scripts/pipeline.py");
  if (!fs.existsSync(pipelinePy)) {
    fs.writeFileSync(
      pipelinePy,
      `"""
LLM Wiki Ingest & Image Pipeline
- Format Ingress Guard
- Base64 image extraction
- Visual semantic deconstruction (<details> & Mermaid)
- Incremental synthesis compiler
"""
import os
import re

def process_markdown_file(file_path: str):
    print(f"[Pipeline] Ingesting {file_path}...")
    # 1. Guard check
    if not file_path.endswith(".md"):
        print("[Guard] Non-MD file rejected")
        return False
    # 2. Extract images & compile
    return True
`,
      "utf-8"
    );
  }

  const mcpServerPy = path.join(WORKSPACE_ROOT, "scripts/mcp_server.py");
  if (!fs.existsSync(mcpServerPy)) {
    fs.writeFileSync(
      mcpServerPy,
      `"""
Local FastMCP Server for LLM Wiki
Exposes search_wiki, read_entity_page, query_wiki_synthesis to external AI
"""
from mcp.server.fastmcp import FastMCP
import os

mcp = FastMCP("PersonalWiki-MCP")
WORKSPACE = r"D:\\PersonalWiki"

@mcp.tool()
def search_wiki(query: str) -> str:
    """毫秒级检索 Wiki 中相关的实体页、总结与 Mermaid 架构代码"""
    return f"Search results for: {query}"

@mcp.tool()
def read_entity_page(entity_name: str) -> str:
    """读取指定 Wiki 实体的完整结构化 Markdown 内容"""
    path = os.path.join(WORKSPACE, "wiki", "entities", f"{entity_name}.md")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return f"Entity {entity_name} not found."

@mcp.tool()
def query_wiki_synthesis(question: str) -> str:
    """调用 Wiki 深度引擎，基于知识库全量内容给出权威综合解答"""
    return f"Synthesis answer for: {question}"

if __name__ == "__main__":
    mcp.run()
`,
      "utf-8"
    );
  }

  const reqTxt = path.join(WORKSPACE_ROOT, "requirements.txt");
  if (!fs.existsSync(reqTxt)) {
    fs.writeFileSync(
      reqTxt,
      `fastapi>=0.110.0
uvicorn>=0.28.0
watchdog>=4.0.0
apscheduler>=3.10.4
mcp>=1.0.0
anthropic>=0.18.0
google-genai>=2.4.0
requests>=2.31.0
pillow>=10.2.0
tomli>=2.0.1
`,
      "utf-8"
    );
  }
}

// File system querying & manipulating functions
export function getAllFiles(): WikiFileInfo[] {
  initWorkspace();
  const files: WikiFileInfo[] = [];

  function scanDir(
    relDir: string,
    category: WikiFileInfo["category"],
    isImage: boolean = false
  ) {
    const fullDir = path.join(WORKSPACE_ROOT, relDir);
    if (!fs.existsSync(fullDir)) return;
    const entries = fs.readdirSync(fullDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) {
        const fullFilePath = path.join(fullDir, ent.name);
        const stat = fs.statSync(fullFilePath);
        files.push({
          path: `${relDir}/${ent.name}`,
          name: ent.name,
          folder: relDir,
          category,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
          isImage,
        });
      }
    }
  }

  scanDir("raw/archive", "raw_archive");
  scanDir("raw/inbox", "raw_inbox");
  scanDir("raw/rejected", "raw_rejected");
  scanDir("raw/assets", "asset", true);
  scanDir("wiki/entities", "wiki_entity");
  scanDir("wiki/synthesis", "wiki_synthesis");
  scanDir("wiki/source_summaries", "wiki_summary");
  scanDir("scripts", "script");

  // root files
  ["wiki/index.md", "wiki/shturl.md", "schema/AGENTS.md", "config.toml", "requirements.txt"].forEach(
    (relPath) => {
      const full = path.join(WORKSPACE_ROOT, relPath);
      if (fs.existsSync(full)) {
        const stat = fs.statSync(full);
        let cat: WikiFileInfo["category"] = "wiki_root";
        if (relPath.startsWith("schema")) cat = "schema";
        else if (relPath.startsWith("config")) cat = "config";
        else if (relPath.endsWith(".txt")) cat = "script";

        files.push({
          path: relPath,
          name: path.basename(relPath),
          folder: path.dirname(relPath),
          category: cat,
          size: stat.size,
          updatedAt: stat.mtime.toISOString(),
        });
      }
    }
  );

  return files;
}

export function readWikiFile(relPath: string): { content: string; info: WikiFileInfo } | null {
  const full = path.join(WORKSPACE_ROOT, relPath);
  if (!fs.existsSync(full)) return null;

  const stat = fs.statSync(full);
  const isImg = /\.(png|jpg|jpeg|svg|webp|gif)$/i.test(relPath);
  let content = "";
  if (isImg) {
    const buf = fs.readFileSync(full);
    const mime = relPath.endsWith(".svg") ? "image/svg+xml" : "image/png";
    content = `data:${mime};base64,${buf.toString("base64")}`;
  } else {
    content = fs.readFileSync(full, "utf-8");
  }

  return {
    content,
    info: {
      path: relPath,
      name: path.basename(relPath),
      folder: path.dirname(relPath),
      category: "wiki_entity", // generalized
      size: stat.size,
      updatedAt: stat.mtime.toISOString(),
      isImage: isImg,
    },
  };
}

export function writeWikiFile(relPath: string, content: string): boolean {
  const full = path.join(WORKSPACE_ROOT, relPath);
  ensureDirectory(path.dirname(full));
  fs.writeFileSync(full, content, "utf-8");
  return true;
}

export function deleteWikiFile(relPath: string): boolean {
  const full = path.join(WORKSPACE_ROOT, relPath);
  if (fs.existsSync(full)) {
    fs.unlinkSync(full);
    return true;
  }
  return false;
}

export function appendToShturl(eventTitle: string, details: string) {
  const shturlPath = path.join(WORKSPACE_ROOT, "wiki/shturl.md");
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  const logEntry = `\n### [${now}] [${eventTitle}]\n${details}\n`;
  if (fs.existsSync(shturlPath)) {
    fs.appendFileSync(shturlPath, logEntry, "utf-8");
  }
}

export function getStats(): WikiStats {
  const files = getAllFiles();
  let linksCount = 0;

  // calculate links
  const entityDir = path.join(WORKSPACE_ROOT, "wiki/entities");
  if (fs.existsSync(entityDir)) {
    const list = fs.readdirSync(entityDir);
    list.forEach((f) => {
      if (f.endsWith(".md")) {
        const text = fs.readFileSync(path.join(entityDir, f), "utf-8");
        const matches = text.match(/\[\[(.*?)\]\]/g);
        if (matches) linksCount += matches.length;
      }
    });
  }

  const configPath = path.join(WORKSPACE_ROOT, "config.toml");
  let lastLintAt = "2026-09-07 02:00:00";
  if (fs.existsSync(configPath)) {
    const toml = fs.readFileSync(configPath, "utf-8");
    const m = toml.match(/last_lint_timestamp\s*=\s*"([^"]+)"/);
    if (m) lastLintAt = m[1];
  }

  return {
    entitiesCount: files.filter((f) => f.category === "wiki_entity").length,
    sourceSummariesCount: files.filter((f) => f.category === "wiki_summary").length,
    rawArchiveCount: files.filter((f) => f.category === "raw_archive").length,
    rejectedCount: files.filter((f) => f.category === "raw_rejected").length,
    synthesisCount: files.filter((f) => f.category === "wiki_synthesis").length,
    linksCount,
    totalImages: files.filter((f) => f.isImage).length,
    lastLintAt,
  };
}
