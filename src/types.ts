export type FileCategory =
  | "raw_archive"
  | "raw_inbox"
  | "raw_rejected"
  | "wiki_entity"
  | "wiki_synthesis"
  | "wiki_summary"
  | "wiki_root"
  | "schema"
  | "config"
  | "script"
  | "asset";

export interface WikiFileInfo {
  path: string;
  name: string;
  folder: string;
  category: FileCategory;
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

export interface McpTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface LintResult {
  healedEntities: string[];
  conflictsFound: number;
  gapNotes: string[];
  report: string;
}

export interface CascadingDeleteReport {
  purgedSummaries: string[];
  purgedEntities: string[];
  modifiedEntities: string[];
}

export type MainTab =
  | "view"
  | "upload"
  | "edit"
  | "graph"
  | "control"
  | "mcp"
  | "timeline"
  | "enrichment";

export interface EngineConfig {
  provider: string; // "deepseek" | "openai" | "anthropic" | "gemini" | "ollama" | "qwen" | "custom"
  model_name: string;
  api_key: string;
  base_url: string;
  temperature: number;
  max_tokens: number;
  timeout: number;
  fallback_provider: string;
  fallback_model: string;
  fallback_base_url: string;
}

export interface SystemConfig {
  auto_switch_multimodal: boolean;
}

export interface WikiTomlConfig {
  system: SystemConfig;
  global_llm: EngineConfig;
  multimodal_llm: EngineConfig;
  general?: {
    workspace_path?: string;
    version?: string;
    auto_heal_interval_hours?: number;
    last_lint_timestamp?: string;
  };
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  status: string;
  message: string;
  provider: string;
  model: string;
  timestamp: string;
}

export interface PayloadInspectionResult {
  hasImage: boolean;
  detectedImages: Array<{
    type: "markdown" | "base64" | "asset";
    reference: string;
  }>;
  autoSwitchActive: boolean;
  targetEngine: "global_llm" | "multimodal_llm";
  targetEngineName: string;
  targetModel: string;
  targetProvider: string;
  reason: string;
  costEfficiencyRatio: string;
}
