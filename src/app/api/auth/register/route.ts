import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashPassword } from "@/lib/auth/password";
import { generateToken, setAuthCookie } from "@/lib/auth/jwt";
import { registerSchema } from "@/lib/validators/schemas";
import { ApiErrors, successResponse } from "@/lib/api-response";
import { checkIpLimit } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = checkIpLimit(ip);
  if (!ipLimit.allowed) return ApiErrors.rateLimit();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parsed.data;

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return ApiErrors.conflict("该邮箱已被注册");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await setAuthCookie(token);

  return successResponse({ user }, 201);
}
