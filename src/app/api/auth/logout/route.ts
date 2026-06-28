import { NextRequest } from "next/server";
import { clearAuthCookie } from "@/lib/auth/jwt";
import { successResponse } from "@/lib/api-response";

export async function POST(_request: NextRequest) {
  await clearAuthCookie();
  return successResponse({ message: "已成功登出" });
}
