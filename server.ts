import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import {
  initWorkspace,
  getAllFiles,
  readWikiFile,
  writeWikiFile,
  deleteWikiFile,
  getStats,
  WORKSPACE_ROOT,
} from "./server/wikiStore.js";
import {
  processIngressFile,
  cascadingDeleteRawFile,
  runAutoHealingLint,
  mcpSearchWiki,
  mcpReadEntityPage,
  mcpQueryWikiSynthesis,
  refreshWikiIndex,
} from "./server/aiPipeline.js";
import { enrichmentRouter } from "./server/enrichmentRoutes.js";
import {
  loadCurrentConfig,
  saveCurrentConfig,
  testModelConnection,
  inspectPayload,
  completeWithDualEngine,
  serializeConfigToml,
} from "./server/smartRouter.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize workspace files & folders
  initWorkspace();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static assets from raw/assets if needed
  app.use("/raw/assets", express.static(path.join(WORKSPACE_ROOT, "raw/assets")));

  // 1. Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", system: "LLM-Wiki-Autonomous-Daemon", timestamp: new Date() });
  });

  // 2. Stats
  app.get("/api/stats", (req, res) => {
    try {
      const stats = getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. File Listing
  app.get("/api/files", (req, res) => {
    try {
      const files = getAllFiles();
      res.json(files);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. File Content
  app.get("/api/files/content", (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) {
      return res.status(400).json({ error: "Missing path parameter" });
    }
    const result = readWikiFile(filePath);
    if (!result) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json(result);
  });

  // 5. File Save / Edit (Human Operation #3)
  app.post("/api/files/save", (req, res) => {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: "Missing path or content" });
    }
    try {
      writeWikiFile(filePath, content);
      refreshWikiIndex();
      res.json({ success: true, message: `已成功保存修改「${filePath}」` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Ingest Upload (Human Operation #1: Ingest & Guard)
  app.post("/api/files/upload", async (req, res) => {
    const { fileName, content } = req.body;
    if (!fileName || content === undefined) {
      return res.status(400).json({ error: "Missing fileName or content" });
    }
    try {
      const result = await processIngressFile(fileName, content);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Delete File (Human Operation #4: Cascading Auto-Clean)
  app.post("/api/files/delete", async (req, res) => {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: "Missing filePath" });
    }
    try {
      if (filePath.startsWith("raw/archive")) {
        const cleanReport = await cascadingDeleteRawFile(filePath);
        return res.json({
          success: true,
          cascaded: true,
          message: `已触发级联清理：删除源文件「${path.basename(filePath)}」，销毁摘要及 ${cleanReport.purgedEntities.length} 个独家实体，更新多源实体与索引。`,
          report: cleanReport,
        });
      } else {
        const success = deleteWikiFile(filePath);
        refreshWikiIndex();
        return res.json({ success, cascaded: false, message: `已删除文件「${filePath}」` });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Auto-Healing Lint (Periodic / Manual trigger)
  app.post("/api/lint/run", async (req, res) => {
    try {
      const result = await runAutoHealingLint();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Config & Protocol (Human Operation #5: Control)
  app.get("/api/config", (req, res) => {
    const configResult = readWikiFile("config.toml");
    const agentsResult = readWikiFile("schema/AGENTS.md");
    res.json({
      configToml: configResult ? configResult.content : "",
      agentsMd: agentsResult ? agentsResult.content : "",
    });
  });

  app.post("/api/config", (req, res) => {
    const { configToml, agentsMd } = req.body;
    try {
      if (configToml !== undefined) writeWikiFile("config.toml", configToml);
      if (agentsMd !== undefined) writeWikiFile("schema/AGENTS.md", agentsMd);
      res.json({ success: true, message: "AI 协议与模型调度配置已即时更新生效！" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9.1 Dual-Engine Router Configuration & Testing APIs
  app.get("/api/router/config", (req, res) => {
    try {
      const config = loadCurrentConfig();
      const rawToml = serializeConfigToml(config);
      res.json({ success: true, config, rawToml });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/router/config", (req, res) => {
    try {
      const { config, rawToml } = req.body;
      if (config) {
        saveCurrentConfig(config);
      } else if (rawToml) {
        writeWikiFile("config.toml", rawToml);
      }
      const updated = loadCurrentConfig();
      res.json({
        success: true,
        message: "全局模型与双引擎调度配置已成功保存并热重载生效！",
        config: updated,
        rawToml: serializeConfigToml(updated),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/router/test-connection", async (req, res) => {
    try {
      const { engineType, config } = req.body;
      const targetType = engineType === "multimodal_llm" ? "multimodal_llm" : "global_llm";
      const result = await testModelConnection(targetType, config);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        latencyMs: 0,
        status: "ERROR",
        message: err.message || "测试连接失败",
        provider: req.body?.config?.provider || "unknown",
        model: req.body?.config?.model_name || "unknown",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  });

  app.post("/api/router/detect", (req, res) => {
    try {
      const { text, images, config } = req.body;
      const result = inspectPayload(text || "", images, config);
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/router/complete", async (req, res) => {
    try {
      const { prompt, systemPrompt, text, images, docTitle, json } = req.body;
      const result = await completeWithDualEngine({
        prompt: prompt || text || "",
        systemPrompt,
        text,
        images,
        docTitle,
        json,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Local MCP Protocol API
  app.get("/api/mcp/tools", (req, res) => {
    res.json({
      server: "PersonalWiki-FastMCP",
      version: "1.0.0",
      tools: [
        {
          name: "search_wiki",
          description: "毫秒级检索 Wiki 中相关的实体页、总结与 Mermaid 架构代码",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "检索关键词或技术术语" },
            },
            required: ["query"],
          },
        },
        {
          name: "read_entity_page",
          description: "读取指定 Wiki 实体的完整结构化 Markdown 内容",
          parameters: {
            type: "object",
            properties: {
              entity_name: { type: "string", description: "实体全名，例如 空中成像提词模组" },
            },
            required: ["entity_name"],
          },
        },
        {
          name: "query_wiki_synthesis",
          description: "调用 Wiki 深度引擎，基于知识库全量内容给出权威综合解答",
          parameters: {
            type: "object",
            properties: {
              question: { type: "string", description: "向知识库发起的深度提问" },
            },
            required: ["question"],
          },
        },
      ],
    });
  });

  app.post("/api/mcp/call", async (req, res) => {
    const { tool, arguments: args } = req.body;
    try {
      if (tool === "search_wiki") {
        const results = mcpSearchWiki(args?.query || "");
        return res.json({ result: results });
      }
      if (tool === "read_entity_page") {
        const content = mcpReadEntityPage(args?.entity_name || "");
        return res.json({ result: content });
      }
      if (tool === "query_wiki_synthesis") {
        const answer = await mcpQueryWikiSynthesis(args?.question || "");
        return res.json({ result: answer });
      }
      return res.status(404).json({ error: `未知工具：${tool}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Enrichment Pipeline & AI routes
  app.use("/api/enrichment", enrichmentRouter);
  app.use("/api", enrichmentRouter);

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LLM Wiki Autonomous Daemon running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
