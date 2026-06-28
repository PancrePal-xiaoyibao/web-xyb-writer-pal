"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Cog,
} from "lucide-react";

interface JobDetail {
  id: string;
  sourceUrl: string;
  templateFamily: string;
  colorStyle: string;
  rewriteInstructions: string | null;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  title: string | null;
  errorMessage: string | null;
  resultPath: string | null;
  logs: Array<{ ts: string; level: string; message: string }> | null;
  createdAt: string;
  completedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STEPS = [
  { key: "PENDING", label: "已提交", icon: Clock },
  { key: "PROCESSING", label: "转换中", icon: Cog },
  { key: "DONE", label: "完成", icon: CheckCircle2 },
] as const;

function stepIndex(status: string): number {
  if (status === "PENDING") return 0;
  if (status === "PROCESSING") return 1;
  return 2; // SUCCESS or FAILED
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data } = useSWR(`/api/jobs/${id}`, fetcher, {
    refreshInterval: (latest) => {
      const s = latest?.job?.status;
      // Keep polling while the job is still running
      return s === "PENDING" || s === "PROCESSING" ? 2000 : 0;
    },
  });

  const job: JobDetail | undefined = data?.job;
  const isError = data?.error;

  const active = job ? stepIndex(job.status) : 0;
  const failed = job?.status === "FAILED";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/jobs"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1"
      >
        <ArrowLeft className="w-4 h-4" />
        返回任务列表
      </Link>

      {isError && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            任务不存在或无权访问
          </CardContent>
        </Card>
      )}

      {job && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-lg truncate">
                  {job.title ?? "文章转换任务"}
                </CardTitle>
                <JobStatusBadge status={job.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress stepper */}
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const reached = i <= active;
                  const isCurrentProcessing =
                    i === active && (job.status === "PENDING" || job.status === "PROCESSING");
                  const isFailedFinal = i === 2 && failed;
                  const Icon = isFailedFinal ? XCircle : step.icon;
                  return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={[
                            "w-9 h-9 rounded-full flex items-center justify-center border-2",
                            isFailedFinal
                              ? "border-red-500 bg-red-50 text-red-600"
                              : reached
                                ? "border-purple-600 bg-purple-50 text-purple-600"
                                : "border-muted bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          {isCurrentProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={[
                            "text-xs",
                            isFailedFinal
                              ? "text-red-600"
                              : reached
                                ? "text-purple-700"
                                : "text-muted-foreground",
                          ].join(" ")}
                        >
                          {isFailedFinal ? "失败" : step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div
                          className={[
                            "h-0.5 flex-1 mx-2",
                            i < active ? "bg-purple-600" : "bg-muted",
                          ].join(" ")}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live hint */}
              {(job.status === "PENDING" || job.status === "PROCESSING") && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {job.status === "PENDING"
                    ? "任务已排队，等待开始..."
                    : "正在抓取文章并进行 AI 改写排版，请稍候（通常 30-90 秒）..."}
                </div>
              )}

              {failed && job.errorMessage && (
                <div className="text-sm text-destructive bg-red-50 rounded-md p-3">
                  转换失败：{job.errorMessage}
                </div>
              )}

              {job.status === "SUCCESS" && (
                <a href={`/api/jobs/${job.id}/download`}>
                  <Button className="gap-2">
                    <Download className="w-4 h-4" />
                    下载 HTML 结果
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">任务详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="原文链接">
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {job.sourceUrl}
                </a>
              </InfoRow>
              <InfoRow label="模板 / 配色">
                <span className="flex gap-2">
                  <Badge variant="outline">{job.templateFamily}</Badge>
                  <Badge variant="outline">{job.colorStyle}</Badge>
                </span>
              </InfoRow>
              {job.rewriteInstructions && (
                <InfoRow label="改写要求">
                  <span className="whitespace-pre-wrap text-muted-foreground">
                    {job.rewriteInstructions}
                  </span>
                </InfoRow>
              )}
              <InfoRow label="创建时间">{formatDate(job.createdAt)}</InfoRow>
              {job.completedAt && (
                <InfoRow label="完成时间">{formatDate(job.completedAt)}</InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Task monitoring logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">任务监控日志</CardTitle>
            </CardHeader>
            <CardContent>
              {job.logs && job.logs.length > 0 ? (
                <div className="rounded-md bg-zinc-950 text-zinc-100 font-mono text-xs p-3 max-h-72 overflow-auto space-y-1">
                  {job.logs.map((entry, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-500 shrink-0">
                        {new Date(entry.ts).toLocaleTimeString("zh-CN", { hour12: false })}
                      </span>
                      <span
                        className={[
                          "shrink-0 uppercase",
                          entry.level === "error"
                            ? "text-red-400"
                            : entry.level === "warn"
                              ? "text-amber-400"
                              : "text-emerald-400",
                        ].join(" ")}
                      >
                        {entry.level}
                      </span>
                      <span className="break-all">{entry.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无日志</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}
