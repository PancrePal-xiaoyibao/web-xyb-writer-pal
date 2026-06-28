/**
 * Validate that a URL is a valid WeChat public account article URL
 * Must start with https://mp.weixin.qq.com/
 */
export function validateWechatUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "mp.weixin.qq.com"
    );
  } catch {
    return false;
  }
}
