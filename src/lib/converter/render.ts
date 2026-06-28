import {
  TemplateFamily,
  ColorStyle,
  normalizeChoice,
  getColorMeta,
  loadTemplate,
  applyColorsAndFooter,
  type ColorMeta,
} from "./templates";
import { resolveLlmConfig, chatCompletion, type LlmConfig } from "./llm";
import { buildComponentGuide } from "./component-guide";
import { DEFAULT_FOOTER } from "./footer";

const MAX_CONTENT_CHARS = 24_000;

export interface RenderInput {
  family: TemplateFamily;
  style: ColorStyle;
  title: string;
  bodyText: string;
  rewriteInstructions?: string | null;
}

export interface RenderResult {
  html: string;
  usedLlm: boolean;
}

interface ArticleContent {
  subtitle: string;
  summary: string;
  bodyHtml: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip markdown code fences the model may wrap output in. */
function stripCodeFences(text: string): string {
  let out = text.trim();
  const fenceMatch = out.match(/^```(?:html|json)?\s*\n([\s\S]*?)\n```$/i);
  if (fenceMatch) {
    out = fenceMatch[1].trim();
  } else {
    out = out.replace(/^```(?:html|json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  return out;
}

/** Parse delimiter-based model output into structured content. */
function parseContentDelimited(raw: string): ArticleContent | null {
  const text = raw.replace(/\r/g, "");
  const subMatch = text.match(/\[\[SUBTITLE\]\]([\s\S]*?)\[\[SUMMARY\]\]/);
  const sumMatch = text.match(/\[\[SUMMARY\]\]([\s\S]*?)\[\[BODY\]\]/);
  const bodyMatch = text.match(/\[\[BODY\]\]([\s\S]*)$/);

  if (!bodyMatch) return null;
  let bodyHtml = bodyMatch[1].trim();
  bodyHtml = stripCodeFences(bodyHtml);
  if (bodyHtml.length < 50) return null;

  return {
    subtitle: (subMatch?.[1] ?? "").trim().slice(0, 20),
    summary: (sumMatch?.[1] ?? "").trim().slice(0, 60),
    bodyHtml,
  };
}

/**
 * Ask the LLM to rewrite the article into structured content
 * (subtitle hook + summary + styled body HTML).
 */
async function generateContentWithLlm(
  config: LlmConfig,
  input: RenderInput,
  meta: ColorMeta
): Promise<ArticleContent | null> {
  const content = input.bodyText.slice(0, MAX_CONTENT_CHARS);
  const guide = buildComponentGuide(meta);

  const system = [
    "你是「小胰宝」公众号（面向胰腺肿瘤患者及家属的公益科普社区）的资深排版编辑。",
    "任务：把用户提供的微信公众号原文，改写、排版成结构化的公众号正文内容。",
    "硬性要求：",
    "1. 严格保留原文事实：数据、人名、日期、百分比、试验编号、机构名、论文结论，不得编造或新增；",
    "2. 完整覆盖原文的所有小节与要点，不要遗漏或过度精简，正文篇幅应与原文相当（通常 1500 字以上），逐节展开；",
    "3. 正文必须使用给定的 xyb 组件内联样式拼装，颜色用给定 hex 值，适配微信移动端；",
    "4. 结构建议（按原文实际内容取舍）：导语段落 → 核心数据（数据卡片）→ 研究/事件详情（信息框+正文）→ 机制或方案解读 → 意义与亮点 → 给患者和家属的提示；每个小节用组件1的竖条小标题，正文用组件2，关键数据用数据卡片或信息框；",
    "5. 面向患者/家属，语言通俗温暖；为专业术语补充简短解释（括号说明）；关键信息加粗；",
    "6. 不要包含文章大标题、页眉、页脚、关于小胰宝等固定区域（系统会自动添加），只产出正文主体；",
    "7. 严格按下面的分隔格式输出，不要输出任何解释或多余文字、不要用代码块包裹：",
    "[[SUBTITLE]]",
    "4字·4字 的标题副标题钩子（中间用·分隔）",
    "[[SUMMARY]]",
    "一句话摘要（40字以内）",
    "[[BODY]]",
    "<这里是用 xyb 组件拼装的、完整详尽的正文 HTML>",
    "",
    guide,
  ].join("\n");

  const user = [
    `原文标题：${input.title}`,
    "",
    `原文正文：\n${content}`,
    "",
    `改写要求：${input.rewriteInstructions?.trim() || "（无特殊要求，按公众号科普风格自然改写）"}`,
    "",
    "请按规定的分隔格式输出：",
  ].join("\n");

  const raw = await chatCompletion(
    config,
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.4, maxTokens: 16000, timeoutMs: 170_000 }
  );

  return parseContentDelimited(raw);
}

/**
 * Build article content deterministically from plain text (no LLM).
 */
function buildContentMechanical(input: RenderInput, meta: ColorMeta): ArticleContent {
  const paragraphs = input.bodyText
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const summary = (paragraphs[0] ?? input.title).slice(0, 40);
  const subtitle = "科普前沿·胰路同心";

  const bodyHtml =
    `<section style="font-family:'PingFangSC-light','PingFang SC',sans-serif;font-size:14px;padding:0 20px;letter-spacing:1px;line-height:2;text-align:justify;margin:15px 0;">` +
    paragraphs.map((p) => `<p style="margin:0 0 10px;">${escapeHtml(p)}</p>`).join("\n") +
    `</section>`;

  return { subtitle, summary, bodyHtml };
}

/**
 * Assemble the final HTML document from template shell + article content.
 */
function assemble(
  family: TemplateFamily,
  style: ColorStyle,
  title: string,
  c: ArticleContent,
  meta: ColorMeta
): string {
  let html = loadTemplate(family, style);
  html = html
    .replace(/__TITLE__/g, escapeHtml(title))
    .replace(/__SUBTITLE__/g, escapeHtml(c.subtitle || "科普前沿"))
    .replace(/__SUMMARY__/g, escapeHtml(c.summary || title))
    .replace(/__INTRO__/g, "")
    .replace(/__BODY__/g, c.bodyHtml);
  return applyColorsAndFooter(html, meta);
}

/**
 * Render an article. Uses the configured LLM when available, otherwise falls
 * back to deterministic mechanical rendering. The template shell (header,
 * title card, footer) is always applied deterministically so structure and
 * the "关于小胰宝" footer are never lost.
 */
export async function renderArticle(rawInput: RenderInput): Promise<RenderResult> {
  const { family, style } = normalizeChoice(rawInput.family, rawInput.style);
  const input: RenderInput = { ...rawInput, family, style };
  const meta = getColorMeta(family, style);

  const llmConfig = resolveLlmConfig();
  if (llmConfig) {
    try {
      const content = await generateContentWithLlm(llmConfig, input, meta);
      if (content) {
        return { html: assemble(family, style, input.title, content, meta), usedLlm: true };
      }
      // Parsing failed — fall back
    } catch (err) {
      console.error("[converter] LLM 渲染失败，回退到机械渲染:", err);
    }
  }

  const fallback = buildContentMechanical(input, meta);
  return { html: assemble(family, style, input.title, fallback, meta), usedLlm: false };
}

export { DEFAULT_FOOTER };
