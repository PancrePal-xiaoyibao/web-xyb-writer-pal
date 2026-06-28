import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { ApiErrors } from "@/lib/api-response";
import fs from "fs/promises";
import path from "path";

// GET /api/jobs/:id/download - download job result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return ApiErrors.notFound("任务不存在");

  if (job.userId !== auth.payload.userId && auth.payload.role !== "ADMIN") {
    return ApiErrors.forbidden();
  }

  if (job.status !== "SUCCESS" || !job.resultPath) {
    return ApiErrors.notFound("转换结果不存在或任务未完成");
  }

  try {
    const fileBuffer = await fs.readFile(job.resultPath);
    const filename = job.title
      ? `${job.title.replace(/[/\\?%*:|"<>]/g, "-")}.html`
      : `article-${job.id}.html`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return ApiErrors.notFound("结果文件不存在");
  }
}
