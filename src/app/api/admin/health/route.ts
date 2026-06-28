import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/api-response";
import fs from "fs/promises";
import path from "path";
import { resolveLlmConfig } from "@/lib/converter/llm";

const OUTPUT_DIR = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "output");

async function checkDatabase(): Promise<{ status: "ok" | "error"; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Unknown error" };
  }
}

function checkLlm(): { status: "ok" | "error"; provider?: string; model?: string; error?: string } {
  const config = resolveLlmConfig();
  if (!config) {
    return { status: "error", error: "未配置 LLM API Key（将回退到机械渲染）" };
  }
  return { status: "ok", provider: config.provider, model: config.model };
}

async function checkStorage(): Promise<{ usedBytes: number; status: "ok" | "warning" | "error" }> {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    let usedBytes = 0;
    async function walk(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
        } else {
          const stat = await fs.stat(full);
          usedBytes += stat.size;
        }
      }
    }
    await walk(OUTPUT_DIR);
    return { usedBytes, status: "ok" };
  } catch {
    return { usedBytes: 0, status: "error" };
  }
}

// GET /api/admin/health
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const [db, storage] = await Promise.all([checkDatabase(), checkStorage()]);
  const llm = checkLlm();

  const overall = db.status === "ok" ? "ok" : "degraded";

  return successResponse({
    status: overall,
    database: db,
    llm,
    storage,
    timestamp: new Date().toISOString(),
  });
}
