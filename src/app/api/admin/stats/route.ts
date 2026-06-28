import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { successResponse } from "@/lib/api-response";

// GET /api/admin/stats
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalJobs,
    successJobs,
    failedJobs,
    todayJobs,
    weekJobs,
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: "SUCCESS" } }),
    prisma.job.count({ where: { status: "FAILED" } }),
    prisma.job.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.job.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
  ]);

  const successRate = totalJobs > 0 ? (successJobs / totalJobs) * 100 : 0;
  const dailyAverage = weekJobs / 7;

  return successResponse({
    jobs: {
      total: totalJobs,
      success: successJobs,
      failed: failedJobs,
      successRate: Math.round(successRate * 10) / 10,
      today: todayJobs,
      dailyAverage: Math.round(dailyAverage * 10) / 10,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
    },
  });
}
