import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/api-response";
import fs from "fs/promises";

const RETENTION_DAYS = parseInt(process.env.JOB_RETENTION_DAYS ?? "30", 10);

// POST /api/admin/cleanup - manually trigger cleanup (admin only)
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  // Find expired jobs
  const expiredJobs = await prisma.job.findMany({
    where: { createdAt: { lt: cutoffDate } },
    select: { id: true, resultPath: true },
  });

  // Delete result files
  let deletedFiles = 0;
  for (const job of expiredJobs) {
    if (job.resultPath) {
      try {
        await fs.unlink(job.resultPath);
        deletedFiles++;
      } catch {
        // Ignore if file doesn't exist
      }
    }
  }

  // Delete job records
  const { count: deletedJobs } = await prisma.job.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  });

  return successResponse({
    message: `清理完成`,
    deletedJobs,
    deletedFiles,
    cutoffDate: cutoffDate.toISOString(),
  });
}
