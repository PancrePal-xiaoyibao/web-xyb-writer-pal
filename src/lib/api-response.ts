import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  );
}

export const ApiErrors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    errorResponse("VALIDATION_ERROR", message, 400, details),
  unauthorized: (message = "未认证，请先登录") =>
    errorResponse("AUTHENTICATION_ERROR", message, 401),
  forbidden: (message = "权限不足") =>
    errorResponse("AUTHORIZATION_ERROR", message, 403),
  notFound: (message = "资源不存在") =>
    errorResponse("NOT_FOUND", message, 404),
  conflict: (message: string) =>
    errorResponse("CONFLICT", message, 409),
  rateLimit: (message = "请求过于频繁，请稍后重试") =>
    errorResponse("RATE_LIMIT_ERROR", message, 429),
  internal: (message = "内部服务器错误") =>
    errorResponse("INTERNAL_ERROR", message, 500),
};
