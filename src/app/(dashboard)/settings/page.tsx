"use client";

import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data } = useSWR("/api/auth/me", fetcher);
  const user = data?.user;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">个人资料</h1>

      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>查看您的账户详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="邮箱" value={user?.email ?? "-"} />
          <InfoRow
            label="角色"
            value={
              <Badge variant={user?.role === "ADMIN" ? "default" : "outline"}>
                {user?.role === "ADMIN" ? "管理员" : "普通用户"}
              </Badge>
            }
          />
          <InfoRow label="任务总数" value={user?._count?.jobs ?? 0} />
          <InfoRow label="API Key 数量" value={user?._count?.apiKeys ?? 0} />
          <InfoRow label="注册时间" value={user ? formatDate(user.createdAt) : "-"} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
