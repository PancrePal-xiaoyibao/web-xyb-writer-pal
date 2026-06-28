import { resolveLlmConfig, chatCompletion } from "./llm";

const MAX_DRAFT_CHARS = 2000;
const MAX_TITLE_CHARS = 200;

export interface EnhanceInput {
  /** 用户输入的改写要求草稿（可为空，表示从零生成一份通用要求） */
  draft?: string | null;
  /** 可选：文章标题，用于让补全更贴合内容 */
  title?: string | null;
}

const SYSTEM_PROMPT = [
  "你是微信公众号文章「改写需求」的提炼助手，服务于面向胰腺肿瘤患者及家属的公益科普账号「小胰宝」。",
  "任务：把用户给出的零散、口语化的改写要求，整理成一份简洁清晰、可直接执行的改写指令。",
  "改写指令需覆盖以下公众号要素（每项一句话，没有则给出合理默认）：",
  "1. 标题：是否需要重拟标题及风格方向；",
  "2. 风格语气：面向患者/家属的通俗、温暖、专业可信的科普语气；",
  "3. 视角：以谁的口吻叙述（如科普编辑、病友视角等）；",
  "4. 结构：分段/小标题/要点提炼方式；",
  "5. 公众号要素：重点加粗、关键数据保留、术语解释、阅读引导等。",
  "硬性要求：",
  "- 输出必须简洁，无废话、无寒暄、无解释说明；",
  "- 用简短的分点（每点一行，以「- 」开头），总长度控制在 200 字以内；",
  "- 必须保留原文事实/数据/人名/结论，不得编造；",
  "- 只输出改写指令本身，不要输出任何额外文字或代码块。",
].join("\n");

/**
 * 调用 LLM 将用户的改写要求草稿补全为一份规范的改写指令。
 * 若未配置 LLM，则抛出错误（由调用方转成友好提示）。
 */
export async function enhanceRewriteInstructions(input: EnhanceInput): Promise<string> {
  const config = resolveLlmConfig();
  if (!config) {
    throw new Error("未配置 LLM，无法使用一键补全。请先在环境变量中配置 LLM API Key。");
  }

  const draft = (input.draft ?? "").slice(0, MAX_DRAFT_CHARS).trim();
  const title = (input.title ?? "").slice(0, MAX_TITLE_CHARS).trim();

  const userParts: string[] = [];
  if (title) userParts.push(`文章标题：${title}`);
  userParts.push(
    draft
      ? `用户的改写要求草稿：\n${draft}`
      : "用户未填写具体要求，请生成一份适用于公众号科普文章的通用改写指令。"
  );
  userParts.push("请输出整理后的改写指令：");

  const result = await chatCompletion(
    config,
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userParts.join("\n\n") },
    ],
    { temperature: 0.5, maxTokens: 1200, timeoutMs: 60_000 }
  );

  return result.trim();
}
