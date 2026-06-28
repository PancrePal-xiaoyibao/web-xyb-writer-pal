import * as cheerio from "cheerio";

const MCP_URL = process.env.MCP_URL ?? "https://changfengbox.top/api/mcp";
const FETCH_TIMEOUT = 60_000;

export interface ExtractedArticle {
  title: string;
  /** Cleaned inner HTML of the article body (#js_content) */
  bodyHtml: string;
  /** Plain-text version of the body for token-efficient LLM input */
  bodyText: string;
}

/**
 * Build the downloader config payload (ported from the Python skill).
 */
function buildConfig(): Record<string, boolean> {
  return {
    保存离线网页: true,
    文件开头添加日期: true,
    HTML: true,
    MD: true,
    PDF: false,
    WORD: false,
    TXT: false,
    MHTML: false,
  };
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Download the raw WeChat article HTML via the MCP downloader service.
 */
async function downloadViaMcp(articleUrl: string): Promise<string> {
  const payload = {
    jsonrpc: "2.0",
    method: "tools/call",
    id: 1,
    params: { name: "wechat", arguments: { url: articleUrl, config: buildConfig() } },
  };

  const res = await fetchWithTimeout(MCP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`MCP 下载服务返回 HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    result?: { content?: Array<{ text?: string }> };
  };

  const items = data.result?.content ?? [];
  for (const item of items) {
    if (!item.text) continue;
    let parsed: { urls?: string[] };
    try {
      parsed = JSON.parse(item.text);
    } catch {
      continue;
    }
    for (const remoteUrl of parsed.urls ?? []) {
      // Prefer the HTML artifact
      if (!/\.html?($|\?)/i.test(remoteUrl) && !remoteUrl.toLowerCase().includes("html")) {
        continue;
      }
      const contentRes = await fetchWithTimeout(remoteUrl, undefined, 30_000);
      if (contentRes.ok) {
        return await contentRes.text();
      }
    }
    // Fall back to first available url if no html matched
    const first = (parsed.urls ?? [])[0];
    if (first) {
      const contentRes = await fetchWithTimeout(first, undefined, 30_000);
      if (contentRes.ok) return await contentRes.text();
    }
  }

  throw new Error("MCP 未返回可下载的文章内容");
}

/**
 * Direct fetch fallback (WeChat sometimes serves the article directly).
 */
async function downloadDirect(articleUrl: string): Promise<string> {
  const res = await fetchWithTimeout(articleUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`直接抓取文章失败: HTTP ${res.status}`);
  return await res.text();
}

const TAIL_TEXT_MARKERS = [
  "在线就诊指南",
  "近期热文",
  "有爱不惧癌",
  "点击上方告诉我们您的抗癌故事",
  "点击专家名片预约门诊",
  "喜欢此内容的人还喜欢",
  "继续滑动看下一个",
  "轻触阅读原文",
  "阅读原文",
  "微信扫一扫",
];

/**
 * Extract title and cleaned body from raw WeChat article HTML using cheerio.
 */
export function extractArticle(rawHtml: string): ExtractedArticle {
  const $ = cheerio.load(rawHtml);

  // Title: try og:title, twitter:title, rich_media_title, then <title>
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $('meta[name="twitter:title"]').attr("content")?.trim() ||
    $(".rich_media_title").first().text().trim() ||
    $("title").first().text().trim() ||
    "微信公众号文章";

  const root = $("#js_content");
  const container = root.length ? root : $("body");

  // Remove scripts, styles and obviously hidden / promotional nodes
  container.find("script, style, iframe, mp-style-type").remove();
  container.find('[style*="display:none"], [style*="display: none"]').remove();
  container.find('[aria-hidden="true"]').remove();

  // Truncate tail boilerplate
  container.find("*").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, "").trim();
    if (!text || text.length > 40) return;
    if (TAIL_TEXT_MARKERS.some((m) => text.includes(m))) {
      // Remove this node and all following siblings up the tree
      let node = $(el);
      node.nextAll().remove();
      node.remove();
    }
  });

  const bodyHtml = container.html()?.trim() ?? "";
  const bodyText = container
    .text()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title: cleanTitle(title), bodyHtml, bodyText };
}

function cleanTitle(title: string): string {
  return title
    .replace(/\u00a0/g, " ")
    .replace(/^\[\d{8,}\]/, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Fetch and extract a WeChat article. Tries MCP first, then direct fetch.
 */
export async function fetchArticle(articleUrl: string): Promise<ExtractedArticle> {
  let rawHtml: string;
  try {
    rawHtml = await downloadViaMcp(articleUrl);
  } catch (mcpErr) {
    try {
      rawHtml = await downloadDirect(articleUrl);
    } catch {
      throw new Error(
        `文章下载失败: ${mcpErr instanceof Error ? mcpErr.message : String(mcpErr)}`
      );
    }
  }
  return extractArticle(rawHtml);
}
