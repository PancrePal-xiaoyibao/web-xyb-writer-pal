/**
 * Lightweight structured logger for operational visibility.
 *
 * Writes JSON lines to stdout/stderr (easy to ship to log collectors) and,
 * when LOG_DIR is set, appends to a daily-rotated file for ops/debugging.
 */
import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";
const LOG_DIR = process.env.LOG_DIR || "";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

function writeToFile(line: string): void {
  if (!LOG_DIR) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const day = new Date().toISOString().slice(0, 10);
    fs.appendFileSync(path.join(LOG_DIR, `app-${day}.log`), line + "\n");
  } catch {
    // Never let logging break the app
  }
}

export interface LogContext {
  scope?: string;
  jobId?: string;
  userId?: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  if (!shouldLog(level)) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
  writeToFile(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit("debug", message, context),
  info: (message: string, context?: LogContext) => emit("info", message, context),
  warn: (message: string, context?: LogContext) => emit("warn", message, context),
  error: (message: string, context?: LogContext) => emit("error", message, context),
  /** Create a child logger that always includes the given context. */
  child: (base: LogContext) => ({
    debug: (m: string, c?: LogContext) => emit("debug", m, { ...base, ...c }),
    info: (m: string, c?: LogContext) => emit("info", m, { ...base, ...c }),
    warn: (m: string, c?: LogContext) => emit("warn", m, { ...base, ...c }),
    error: (m: string, c?: LogContext) => emit("error", m, { ...base, ...c }),
  }),
};

export type Logger = typeof logger;
