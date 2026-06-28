import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyPassword } from "@/lib/auth/password";
import { generateToken, setAuthCookie } from "@/lib/auth/jwt";
import { loginSchema } from "@/lib/validators/schemas";
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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return ApiErrors.validation("邮箱或密码不正确");
  }

  if (user.status === "DISABLED") {
    return ApiErrors.forbidden("账户已被禁用，请联系管理员");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return ApiErrors.validation("邮箱或密码不正确");
  }

  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await setAuthCookie(token);

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}
