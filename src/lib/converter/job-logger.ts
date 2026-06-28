import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";

export type JobLogLevel = "info" | "warn" | "error";

export interface JobLogEntry {
  ts: string;
  level: JobLogLevel;
  message: string;
}

/**
 * Accumulates structured log entries for a single job and persists them to the
 * Job.logs JSON column, while also emitting to the application logger so ops
 * can follow along in stdout / log files.
 */
export class JobLogger {
  private entries: JobLogEntry[] = [];

  constructor(private readonly jobId: string) {}

  private async flush(): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: this.jobId },
        data: { logs: this.entries as unknown as object },
      });
    } catch (err) {
      logger.warn("写入任务日志失败", {
        scope: "job-logger",
        jobId: this.jobId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async log(level: JobLogLevel, message: string): Promise<void> {
    this.entries.push({ ts: new Date().toISOString(), level, message });
    logger[level](message, { scope: "converter", jobId: this.jobId });
    await this.flush();
  }

  info(message: string) {
    return this.log("info", message);
  }
  warn(message: string) {
    return this.log("warn", message);
  }
  error(message: string) {
    return this.log("error", message);
  }

  getEntries(): JobLogEntry[] {
    return this.entries;
  }
}
