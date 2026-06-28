import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db/client";
import { fetchArticle } from "./fetch-article";
import { renderArticle } from "./render";
import { JobLogger } from "./job-logger";
import type { TemplateFamily, ColorStyle } from "./templates";

const OUTPUT_DIR = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "output");
const MAX_CONCURRENT = 10;

// Simple in-process concurrency limiter
let activeJobs = 0;
const jobQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeJobs < MAX_CONCURRENT) {
      activeJobs++;
      resolve();
    } else {
      jobQueue.push(() => {
        activeJobs++;
        resolve();
      });
    }
  });
}

function releaseSlot(): void {
  activeJobs--;
  const next = jobQueue.shift();
  if (next) next();
}

function safeFilename(title: string): string {
  const cleaned = title.replace(/[^0-9A-Za-z\u4e00-\u9fff_-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "xyb_article";
}

/**
 * Process a conversion job end-to-end:
 * fetch article -> render (LLM or mechanical) -> save HTML -> update status.
 * Fully self-contained; no external Python/skill dependency.
 */
export async function processJob(jobId: string): Promise<void> {
  const jlog = new JobLogger(jobId);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: "PROCESSING" },
  });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return;

  await jlog.info("任务开始处理");
  await acquireSlot();

  const startedAt = Date.now();
  try {
    // 1. Fetch + extract the source article
    await jlog.info(`开始抓取文章：${job.sourceUrl}`);
    const article = await fetchArticle(job.sourceUrl);
    await jlog.info(
      `文章抓取成功，标题：「${article.title}」，正文约 ${article.bodyText.length} 字`
    );

    // 2. Render into the chosen template
    await jlog.info(
      `开始渲染（模板 ${job.templateFamily} / 配色 ${job.colorStyle}）...`
    );
    const { html, usedLlm } = await renderArticle({
      family: job.templateFamily as TemplateFamily,
      style: job.colorStyle as ColorStyle,
      title: article.title,
      bodyText: article.bodyText,
      rewriteInstructions: job.rewriteInstructions,
    });
    await jlog.info(
      usedLlm
        ? "AI 改写排版完成"
        : "未配置/调用 LLM，已使用机械排版兜底完成"
    );

    // 3. Persist the output HTML
    const outDir = path.join(OUTPUT_DIR, job.userId);
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(
      outDir,
      `${safeFilename(article.title)}_公众号_${job.colorStyle}_${job.id}.html`
    );
    await fs.writeFile(outPath, html, "utf-8");
    await jlog.info(
      `结果已生成（${(html.length / 1024).toFixed(1)} KB），耗时 ${((Date.now() - startedAt) / 1000).toFixed(1)} 秒`
    );

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "SUCCESS",
        resultPath: outPath,
        title: article.title,
        completedAt: new Date(),
      },
    });
    await jlog.info("任务完成 ✅");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    await jlog.error(`任务失败：${msg}`);
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: msg,
        completedAt: new Date(),
      },
    });
  } finally {
    releaseSlot();
  }
}

export function getUserOutputDir(userId: string): string {
  return path.join(OUTPUT_DIR, userId);
}
