import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { createJobSchema } from "@/lib/validators/schemas";
import { sanitizeRewriteInstructions } from "@/lib/validators/sanitize";
import { processJob } from "@/lib/converter";
import { ApiErrors, successResponse } from "@/lib/api-response";

const PAGE_SIZE = 20;

// GET /api/jobs - list jobs for current user (paginated)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status = searchParams.get("status") ?? undefined;

  const where = {
    userId: auth.payload.userId,
    ...(status ? { status: status as "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" } : {}),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        sourceUrl: true,
        templateFamily: true,
        colorStyle: true,
        status: true,
        title: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.job.count({ where }),
  ]);

  return successResponse({
    jobs,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

// POST /api/jobs - create a new job
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { sourceUrl, templateFamily, colorStyle, rewriteInstructions } = parsed.data;

  const job = await prisma.job.create({
    data: {
      userId: auth.payload.userId,
      sourceUrl,
      templateFamily,
      colorStyle,
      rewriteInstructions: sanitizeRewriteInstructions(rewriteInstructions),
      status: "PENDING",
    },
  });

  // Start processing asynchronously (don't await)
  processJob(job.id).catch((err) => {
    console.error(`[Job ${job.id}] Processing error:`, err);
  });

  return successResponse({ job }, 201);
}
