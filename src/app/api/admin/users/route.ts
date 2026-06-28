import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { z } from "zod";

const PAGE_SIZE = 20;

const createUserSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少需要8位")
    .refine(validatePasswordStrength, "密码必须包含字母和数字"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

// GET /api/admin/users
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { jobs: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return successResponse({
    users,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}

// POST /api/admin/users - 管理员创建用户
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return ApiErrors.conflict("该邮箱已被注册");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, status: true, createdAt: true },
  });

  return successResponse({ user }, 201);
}
