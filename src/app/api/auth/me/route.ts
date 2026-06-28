import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { ApiErrors, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      _count: { select: { jobs: true, apiKeys: true } },
    },
  });

  if (!user) return ApiErrors.unauthorized();

  return successResponse({ user });
}
