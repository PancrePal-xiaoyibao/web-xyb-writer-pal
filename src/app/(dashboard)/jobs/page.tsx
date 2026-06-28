"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { Plus, Download, Trash2, RefreshCw, FileText, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface Job {
  id: string;
  sourceUrl: string;
  templateFamily: string;
  colorStyle: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  title: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function JobsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const { data, mutate, isLoading } = useSWR(`/api/jobs?page=${page}`, fetcher, {
    refreshInterval: 5000, // poll for status updates
  });

  const jobs: Job[] = data?.jobs ?? [];
  const pagination = data?.pagination;

  async function handleDelete(id: string) {
    if (!confirm("确定删除该任务及其结果文件吗？")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "已删除", description: "任务已成功删除" });
      mutate();
    } else {
      toast({ variant: "destructive", title: "删除失败" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">任务列表</h1>
          <p className="text-muted-foreground text-sm mt-1">查看和管理您的文章转换任务</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link href="/jobs/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新建任务
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">还没有任务</h3>
            <p className="text-muted-foreground text-sm mb-4">创建第一个文章转换任务吧</p>
            <Link href="/jobs/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                新建任务
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <JobStatusBadge status={job.status} />
                      {(job.status === "PENDING" || job.status === "PROCESSING") && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {job.status === "PENDING" ? "排队中" : "转换中"}
                        </span>
                      )}
                      <Badge variant="outline">{job.templateFamily}</Badge>
                      <Badge variant="outline">{job.colorStyle}</Badge>
                    </div>
                    <Link href={`/jobs/${job.id}`} className="block group">
                      <h3 className="font-medium truncate group-hover:text-primary group-hover:underline">
                        {job.title ?? "（未获取标题）"}
                      </h3>
                    </Link>
                    <a
                      href={job.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline truncate block"
                    >
                      {job.sourceUrl}
                    </a>
                    {job.status === "FAILED" && job.errorMessage && (
                      <p className="text-xs text-destructive mt-1 truncate">
                        错误: {job.errorMessage}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link href={`/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">
                        查看
                      </Button>
                    </Link>
                    {job.status === "SUCCESS" && (
                      <a href={`/api/jobs/${job.id}/download`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="w-4 h-4" />
                          下载
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
