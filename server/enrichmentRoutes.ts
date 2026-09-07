import { Router } from "express";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { WORKSPACE_ROOT } from "./wikiStore.js";
import { generateTextWithFallback } from "./gemini.js";

export const enrichmentRouter = Router();

// Helper to locate files in namespace
function getNamespacePaths(namespace: string = "books/hongloumeng") {
  const rawDir = path.join(WORKSPACE_ROOT, "raw", namespace);
  const wikiDir = path.join(WORKSPACE_ROOT, "wiki");
  const aliasPath = path.join(wikiDir, namespace, "alias_map.json");
  return { rawDir, wikiDir, aliasPath };
}

// 1. List available namespaces & chapters
enrichmentRouter.get("/chapters", (req, res) => {
  try {
    const namespace = (req.query.namespace as string) || "books/hongloumeng";
    const { rawDir } = getNamespacePaths(namespace);

    if (!fs.existsSync(rawDir)) {
      return res.json({ chapters: [], namespace });
    }

    const files = fs.readdirSync(rawDir);
    const chapters = files
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((f) => {
        const fullPath = path.join(rawDir, f);
        const stat = fs.statSync(fullPath);
        const content = fs.readFileSync(fullPath, "utf-8");
        const titleMatch = content.match(/#\s*第\s*\d+\s*回[:：\s]*([^\n]+)/);
        const title = titleMatch ? titleMatch[1].trim() : f.replace(".md", "");
        const numMatch = f.match(/\d+/);
        const chapNum = numMatch ? parseInt(numMatch[0], 10) : 0;

        return {
          id: f.replace(".md", "").replace("ch", ""),
          filename: f,
          title,
          chapterNum: chapNum,
          size: stat.size,
          preview: content.slice(0, 150).replace(/\n/g, " "),
        };
      });

    res.json({ chapters, namespace });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Alias Map
enrichmentRouter.get("/alias-map", (req, res) => {
  try {
    const namespace = (req.query.namespace as string) || "books/hongloumeng";
    const { aliasPath, wikiDir } = getNamespacePaths(namespace);

    let targetPath = aliasPath;
    if (!fs.existsSync(targetPath)) {
      // Fallback
      targetPath = path.join(wikiDir, "books/hongloumeng/alias_map.json");
    }

    if (fs.existsSync(targetPath)) {
      const data = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      return res.json(data);
    }

    res.json({ entity_mappings: [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Alias Map
enrichmentRouter.post("/alias-map", (req, res) => {
  try {
    const namespace = (req.body.namespace as string) || "books/hongloumeng";
    const { aliasPath } = getNamespacePaths(namespace);
    const mappings = req.body.entity_mappings;

    if (!Array.isArray(mappings)) {
      return res.status(400).json({ error: "entity_mappings 必须为数组" });
    }

    fs.mkdirSync(path.dirname(aliasPath), { recursive: true });
    fs.writeFileSync(aliasPath, JSON.stringify({ entity_mappings: mappings }, null, 2), "utf-8");

    res.json({ success: true, count: mappings.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Run Python Enrichment Pipeline
enrichmentRouter.post("/pipeline/run", (req, res) => {
  const {
    namespace = "books/hongloumeng",
    chapter = "",
    plugins = "all",
    dryRun = false,
  } = req.body;

  const scriptPath = path.join(process.cwd(), "scripts/enrichments/run_pipeline.py");
  let cmd = `python3 "${scriptPath}" --namespace "${namespace}"`;

  if (chapter && chapter !== "all") {
    cmd += ` --chapter "${chapter}"`;
  } else if (chapter === "all") {
    cmd += ` --chapter all`;
  }

  if (plugins && plugins !== "all") {
    cmd += ` --plugins "${plugins}"`;
  } else {
    cmd += ` --plugins all`;
  }

  if (dryRun) {
    cmd += ` --dry-run`;
  }

  cmd += ` --workspace "${WORKSPACE_ROOT}"`;

  exec(cmd, { cwd: process.cwd(), timeout: 60000 }, (error, stdout, stderr) => {
    let extractedJson: any = null;
    try {
      const marker = "--- 提取数据详情 (Enrichment Extraction Data) ---";
      if (stdout.includes(marker)) {
        const jsonPart = stdout.split(marker)[1].split("🎉")[0].trim();
        extractedJson = JSON.parse(jsonPart);
      }
    } catch {
      // JSON parse failed or not present
    }

    res.json({
      success: !error,
      command: cmd,
      stdout: stdout || "",
      stderr: stderr || "",
      extractedData: extractedJson,
      error: error ? error.message : null,
    });
  });
});

// 5. Get Chronological Timeline
enrichmentRouter.get("/timeline", (req, res) => {
  try {
    const timelineFile = path.join(WORKSPACE_ROOT, "wiki/synthesis/chronological_timeline.md");
    if (!fs.existsSync(timelineFile)) {
      return res.json({ events: [], rawContent: "" });
    }
    const content = fs.readFileSync(timelineFile, "utf-8");
    const eventRegex = /<TimelineEvent\s+time=["'](.*?)["']\s+title=["'](.*?)["']>([\s\S]*?)<\/TimelineEvent>/g;
    const events: Array<{ time: string; title: string; desc: string }> = [];
    let m;
    while ((m = eventRegex.exec(content)) !== null) {
      events.push({
        time: m[1].trim(),
        title: m[2].trim(),
        desc: m[3].trim(),
      });
    }
    res.json({ events, rawContent: content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Spatial Architecture
enrichmentRouter.get("/spatial", (req, res) => {
  try {
    const spatialFile = path.join(WORKSPACE_ROOT, "wiki/synthesis/spatial_architecture.md");
    if (!fs.existsSync(spatialFile)) {
      return res.json({ content: "" });
    }
    const content = fs.readFileSync(spatialFile, "utf-8");
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get Synthesis Foreshadowing Matrix
enrichmentRouter.get("/synthesis", (req, res) => {
  try {
    const synthFile = path.join(WORKSPACE_ROOT, "wiki/synthesis/hongloumeng_foreshadowing_matrix.md");
    if (!fs.existsSync(synthFile)) {
      return res.json({ content: "" });
    }
    const content = fs.readFileSync(synthFile, "utf-8");
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. General AI Generate endpoint
enrichmentRouter.post("/ai/generate", async (req, res) => {
  try {
    const { prompt, systemPrompt, json: isJson } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }
    const result = await generateTextWithFallback({
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: isJson ? "application/json" : undefined,
      },
    });
    res.json({ text: result?.text || "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
