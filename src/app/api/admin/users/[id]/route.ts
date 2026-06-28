import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { z } from "zod";

const updateUserSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

// PATCH /api/admin/users/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return ApiErrors.notFound("用户不存在");

  // Prevent admin from disabling themselves
  if (id === auth.payload.userId) {
    return ApiErrors.forbidden("不能修改自己的账户状态");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, email: true, status: true },
  });

  return successResponse({ user: updated });
}

// DELETE /api/admin/users/:id - 管理员删除用户（级联删除其任务与 API Key）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return ApiErrors.notFound("用户不存在");

  // Prevent admin from deleting themselves
  if (id === auth.payload.userId) {
    return ApiErrors.forbidden("不能删除自己的账户");
  }

  await prisma.user.delete({ where: { id } });

  return successResponse({ message: "用户已删除" });
}
