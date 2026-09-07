import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export interface GenerateTextOptions {
  contents: any;
  config?: any;
  models?: string[];
  maxRetriesPerModel?: number;
}

/**
 * Resilient text generation helper with automatic model cascade and exponential backoff retry.
 * Primary: gemini-3.8-flash
 * Fallbacks: gemini-flash-latest, gemini-3.1-flash-lite
 */
export async function generateTextWithFallback(
  options: GenerateTextOptions
): Promise<{ text: string; modelUsed: string } | null> {
  const gemini = getGemini();
  if (!gemini) {
    return null;
  }

  const models =
    options.models && options.models.length > 0
      ? options.models
      : ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

  const maxRetries = options.maxRetriesPerModel ?? 1;

  for (const model of models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await gemini.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const status = err?.status || err?.code;

        const isTransient =
          status === 503 ||
          status === 429 ||
          status === "UNAVAILABLE" ||
          status === "RESOURCE_EXHAUSTED" ||
          errMsg.includes("503") ||
          errMsg.includes("429") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("temporarily unavailable") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 900 + Math.floor(Math.random() * 300);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Move to the next model in the cascade
        break;
      }
    }
  }

  // Gracefully return null if all models failed, allowing rule-based fallback without throwing unhandled exceptions
  return null;
}

