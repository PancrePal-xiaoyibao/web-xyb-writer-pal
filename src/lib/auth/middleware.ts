import { NextRequest } from "next/server";
import { getCurrentUser, verifyToken, type TokenPayload } from "./jwt";
import { prisma } from "@/lib/db/client";
import { checkIpLimit, checkUserLimit, checkApiKeyLimit } from "@/lib/rate-limiter";
import { ApiErrors } from "@/lib/api-response";
import { isValidApiKeyFormat } from "./api-key";
import bcrypt from "bcryptjs";

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Authenticate via JWT cookie or API Key header
 * Returns the token payload or null
 */
export async function authenticate(
  request: NextRequest
): Promise<{ payload: TokenPayload; apiKeyId?: string } | null> {
  // 1. Try JWT cookie
  const cookieHeader = request.headers.get("cookie") ?? "";
  const tokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
  if (tokenMatch) {
    const payload = await verifyToken(tokenMatch[1]);
    if (payload) return { payload };
  }

  // 2. Try Bearer token in Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // Check if it's an API Key
    if (isValidApiKeyFormat(token)) {
      return authenticateApiKey(token);
    }
    // Otherwise treat as JWT
    const payload = await verifyToken(token);
    if (payload) return { payload };
  }

  return null;
}

/**
 * Authenticate via API Key
 */
async function authenticateApiKey(
  key: string
): Promise<{ payload: TokenPayload; apiKeyId: string } | null> {
  const prefix = key.slice(0, 8);

  // Find API keys with matching prefix
  const apiKeys = await prisma.apiKey.findMany({
    where: { keyPrefix: prefix },
    include: { user: true },
  });

  for (const apiKey of apiKeys) {
    const valid = await bcrypt.compare(key, apiKey.keyHash);
    if (valid) {
      if (apiKey.user.status === "DISABLED") return null;

      // Update last used timestamp (fire-and-forget)
      prisma.apiKey
        .update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(console.error);

      return {
        payload: {
          userId: apiKey.user.id,
          email: apiKey.user.email,
          role: apiKey.user.role as "USER" | "ADMIN",
        },
        apiKeyId: apiKey.id,
      };
    }
  }

  return null;
}

/**
 * Apply rate limiting and authentication to an API handler
 * Returns an error response or the authenticated payload
 */
export async function requireAuth(request: NextRequest) {
  const ip = getClientIp(request);

  // Check IP rate limit
  const ipLimit = checkIpLimit(ip);
  if (!ipLimit.allowed) {
    return { error: ApiErrors.rateLimit() };
  }

  const auth = await authenticate(request);
  if (!auth) {
    return { error: ApiErrors.unauthorized() };
  }

  // Check user rate limit
  const userLimit = checkUserLimit(auth.payload.userId);
  if (!userLimit.allowed) {
    return { error: ApiErrors.rateLimit() };
  }

  // Check API Key rate limit (if using API Key)
  if (auth.apiKeyId) {
    const apiKeyLimit = checkApiKeyLimit(auth.apiKeyId);
    if (!apiKeyLimit.allowed) {
      return { error: ApiErrors.rateLimit() };
    }
  }

  return { payload: auth.payload };
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest) {
  const result = await requireAuth(request);
  if ("error" in result) return result;

  if (result.payload.role !== "ADMIN") {
    return { error: ApiErrors.forbidden() };
  }

  return result;
}
