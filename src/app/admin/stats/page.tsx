"use client";

import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Database,
  Server,
  HardDrive,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export default function AdminStatsPage() {
  const { data: stats } = useSWR("/api/admin/stats", fetcher, { refreshInterval: 10000 });
  const { data: health } = useSWR("/api/admin/health", fetcher, { refreshInterval: 10000 });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">统计与监控</h2>

      {/* Job stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">任务统计</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            label="任务总数"
            value={stats?.jobs?.total ?? "-"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            label="成功率"
            value={stats ? `${stats.jobs.successRate}%` : "-"}
          />
          <StatCard
            icon={<XCircle className="w-5 h-5 text-red-600" />}
            label="失败任务"
            value={stats?.jobs?.failed ?? "-"}
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
            label="日均任务"
            value={stats?.jobs?.dailyAverage ?? "-"}
          />
        </div>
      </div>

      {/* User stats */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">用户统计</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="用户总数"
            value={stats?.users?.total ?? "-"}
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-green-600" />}
            label="活跃用户"
            value={stats?.users?.active ?? "-"}
          />
          <StatCard
            icon={<FileText className="w-5 h-5 text-purple-600" />}
            label="今日任务"
            value={stats?.jobs?.today ?? "-"}
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
            label="成功任务"
            value={stats?.jobs?.success ?? "-"}
          />
        </div>
      </div>

      {/* System health */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">系统健康</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                数据库
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthStatus status={health?.database?.status} />
              {health?.database?.latencyMs != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  延迟 {health.database.latencyMs}ms
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Server className="w-4 h-4" />
                LLM 服务
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HealthStatus status={health?.llm?.status} />
              {health?.llm?.provider && (
                <p className="text-xs text-muted-foreground mt-1">
                  {health.llm.provider} · {health.llm.model}
                </p>
              )}
              {health?.llm?.error && (
                <p className="text-xs text-muted-foreground mt-1">{health.llm.error}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                存储空间
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {health?.storage ? formatBytes(health.storage.usedBytes) : "-"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">输出目录占用</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">{icon}</div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function HealthStatus({ status }: { status?: string }) {
  if (!status) return <Badge variant="outline">检查中...</Badge>;
  if (status === "ok") {
    return <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">正常</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 border-0 hover:bg-red-100">异常</Badge>;
}
