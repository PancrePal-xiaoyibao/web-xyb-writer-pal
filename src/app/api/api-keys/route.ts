import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/middleware";
import { generateApiKey } from "@/lib/auth/api-key";
import { createApiKeySchema } from "@/lib/validators/schemas";
import { ApiErrors, successResponse } from "@/lib/api-response";

const MAX_API_KEYS = 5;

// GET /api/api-keys - list API keys (show prefix only)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: auth.payload.userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return successResponse({ apiKeys });
}

// POST /api/api-keys - create new API key
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = createApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  // Check limit
  const count = await prisma.apiKey.count({
    where: { userId: auth.payload.userId },
  });

  if (count >= MAX_API_KEYS) {
    return ApiErrors.conflict(`每个用户最多只能创建 ${MAX_API_KEYS} 个 API Key`);
  }

  const { fullKey, keyPrefix, keyHash } = await generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: auth.payload.userId,
      keyPrefix,
      keyHash,
      name: parsed.data.name,
    },
    select: {
      id: true,
      keyPrefix: true,
      name: true,
      createdAt: true,
    },
  });

  // Return full key once — it won't be shown again
  return successResponse({ apiKey: { ...apiKey, fullKey } }, 201);
}
