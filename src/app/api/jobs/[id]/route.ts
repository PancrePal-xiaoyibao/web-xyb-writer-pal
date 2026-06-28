import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { ApiErrors, successResponse } from "@/lib/api-response";
import fs from "fs/promises";

// GET /api/jobs/:id - get job details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return ApiErrors.notFound("任务不存在");

  // Users can only see their own jobs; admins can see all
  if (job.userId !== auth.payload.userId && auth.payload.role !== "ADMIN") {
    return ApiErrors.forbidden();
  }

  return successResponse({ job });
}

// DELETE /api/jobs/:id - delete a job
export async function DELETE(
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

  // Delete result file if it exists
  if (job.resultPath) {
    try {
      await fs.unlink(job.resultPath);
    } catch {
      // Ignore file not found errors
    }
  }

  await prisma.job.delete({ where: { id } });

  return successResponse({ message: "任务已删除" });
}
