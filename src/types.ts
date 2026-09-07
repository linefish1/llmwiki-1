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
