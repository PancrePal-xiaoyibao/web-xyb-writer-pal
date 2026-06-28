import { z } from "zod";
import { validateWechatUrl } from "./url";
import { validatePasswordStrength } from "@/lib/auth/password";

export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少需要8位")
    .refine(validatePasswordStrength, "密码必须包含字母和数字"),
});

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

export const createJobSchema = z.object({
  sourceUrl: z
    .string()
    .min(1, "请输入文章链接")
    .refine(validateWechatUrl, "请输入有效的微信公众号文章链接（https://mp.weixin.qq.com/）"),
  templateFamily: z.enum(["template1", "template2", "template3"], {
    errorMap: () => ({ message: "请选择有效的模板" }),
  }),
  colorStyle: z.enum(["morandi_purple", "morandi_green", "raw_original"], {
    errorMap: () => ({ message: "请选择有效的配色方案" }),
  }),
  rewriteInstructions: z.string().max(2000, "重写指令不能超过2000字符").optional().nullable(),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "请输入名称").max(100, "名称不能超过100字符"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
