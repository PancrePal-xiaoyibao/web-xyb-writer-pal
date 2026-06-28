/**
 * LLM provider abstraction.
 *
 * Supports multiple providers through the OpenAI-compatible Chat Completions
 * protocol. Each provider only differs by base URL and API key; the request
 * and response shapes are identical.
 *
 * Supported providers: stepfun | siliconflow | dashscope | deepseek | openai
 * Default: stepfun + step-3.5-flash
 */

export type LlmProvider =
  | "stepfun"
  | "siliconflow"
  | "dashscope"
  | "deepseek"
  | "openai";

const PROVIDER_BASE_URLS: Record<LlmProvider, string> = {
  stepfun: "https://api.stepfun.com/v1",
  siliconflow: "https://api.siliconflow.cn/v1",
  dashscope: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  deepseek: "https://api.deepseek.com/v1",
  openai: "https://api.openai.com/v1",
};

// Per-provider API key env var names
const PROVIDER_KEY_ENV: Record<LlmProvider, string> = {
  stepfun: "STEPFUN_API_KEY",
  siliconflow: "SILICONFLOW_API_KEY",
  dashscope: "DASHSCOPE_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  openai: "OPENAI_API_KEY",
};

const DEFAULT_PROVIDER: LlmProvider = "stepfun";
const DEFAULT_MODEL = "step-3.5-flash";

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  baseUrl: string;
}

function isValidProvider(value: string): value is LlmProvider {
  return value in PROVIDER_BASE_URLS;
}

/**
 * Pick one API key from a possibly comma-separated list (simple rotation).
 */
function pickApiKey(raw: string | undefined): string {
  if (!raw) return "";
  const keys = raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keys.length === 0) return "";
  // Random rotation across configured keys
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Resolve LLM configuration from environment variables.
 * Returns null if no API key is configured for the selected provider.
 */
export function resolveLlmConfig(): LlmConfig | null {
  const providerRaw = (process.env.LLM_PROVIDER ?? DEFAULT_PROVIDER).trim().toLowerCase();
  const provider: LlmProvider = isValidProvider(providerRaw)
    ? providerRaw
    : DEFAULT_PROVIDER;

  const model = (process.env.LLM_MODEL ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;

  // Base URL: explicit override (mainly for openai-compatible custom endpoints),
  // otherwise the provider default.
  const baseUrl =
    (process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "").trim() ||
    PROVIDER_BASE_URLS[provider];

  // API key resolution order:
  // 1) generic LLM_API_KEY (highest priority, lets you override per-provider keys)
  // 2) provider-specific key env var
  const apiKey =
    pickApiKey(process.env.LLM_API_KEY) ||
    pickApiKey(process.env[PROVIDER_KEY_ENV[provider]]);

  if (!apiKey) return null;

  return { provider, model, apiKey, baseUrl };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call the chat completions endpoint and return the assistant message content.
 */
export async function chatCompletion(
  config: LlmConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
): Promise<string> {
  const { temperature = 0.4, maxTokens = 8000, timeoutMs = 110_000 } = options;

  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `LLM 请求失败 (${config.provider}/${config.model}): HTTP ${res.status} ${text.slice(0, 300)}`
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`LLM 返回为空 (${config.provider}/${config.model})`);
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export { DEFAULT_PROVIDER, DEFAULT_MODEL, PROVIDER_BASE_URLS };
