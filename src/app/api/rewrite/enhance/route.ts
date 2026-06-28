import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/middleware";
import { enhanceRewriteInstructions } from "@/lib/converter/enhance-prompt";
import { sanitizeInput } from "@/lib/validators/sanitize";
import { ApiErrors, successResponse } from "@/lib/api-response";

const enhanceSchema = z.object({
  draft: z.string().max(2000, "草稿不能超过2000字符").optional().nullable(),
  title: z.string().max(200).optional().nullable(),
});

// POST /api/rewrite/enhance - 一键补全改写要求
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiErrors.validation("请求体格式无效");
  }

  const parsed = enhanceSchema.safeParse(body);
  if (!parsed.success) {
    return ApiErrors.validation("输入验证失败", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  const draft = parsed.data.draft ? sanitizeInput(parsed.data.draft) : "";
  const title = parsed.data.title ? sanitizeInput(parsed.data.title) : "";

  try {
    const enhanced = await enhanceRewriteInstructions({ draft, title });
    return successResponse({ enhanced });
  } catch (err) {
    return ApiErrors.internal(
      err instanceof Error ? err.message : "一键补全失败，请稍后重试"
    );
  }
}
