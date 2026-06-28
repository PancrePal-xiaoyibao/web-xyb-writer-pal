import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { ApiErrors, successResponse } from "@/lib/api-response";

// DELETE /api/api-keys/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const apiKey = await prisma.apiKey.findUnique({ where: { id } });
  if (!apiKey) return ApiErrors.notFound("API Key 不存在");

  if (apiKey.userId !== auth.payload.userId) {
    return ApiErrors.forbidden();
  }

  await prisma.apiKey.delete({ where: { id } });

  return successResponse({ message: "API Key 已删除" });
}
