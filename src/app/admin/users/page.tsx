"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { ShieldCheck, User as UserIcon, Plus, Trash2, Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  _count: { jobs: number };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const { data, mutate } = useSWR(`/api/admin/users?page=${page}`, fetcher);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "USER" });

  const users: UserRow[] = data?.users ?? [];
  const pagination = data?.pagination;

  async function toggleStatus(user: UserRow) {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = newStatus === "DISABLED" ? "禁用" : "启用";
    if (!confirm(`确定${action}用户 ${user.email} 吗？`)) return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast({ title: `已${action}` });
      mutate();
    } else {
      const d = await res.json();
      toast({ variant: "destructive", title: "操作失败", description: d.error?.message });
    }
  }

  async function deleteUser(user: UserRow) {
    if (!confirm(`确定删除用户 ${user.email} 吗？该用户的所有任务和 API Key 也会被删除，且不可恢复。`))
      return;

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "已删除用户" });
      mutate();
    } else {
      const d = await res.json();
      toast({ variant: "destructive", title: "删除失败", description: d.error?.message });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const d = await res.json();
      if (!res.ok) {
        const msg =
          d.error?.details?.fields?.password?.[0] ??
          d.error?.details?.fields?.email?.[0] ??
          d.error?.message ??
          "创建失败";
        toast({ variant: "destructive", title: "创建失败", description: msg });
        return;
      }
      toast({ title: "已创建用户", description: newUser.email });
      setCreateOpen(false);
      setNewUser({ email: "", password: "", role: "USER" });
      mutate();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">用户管理</h2>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          创建用户
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground bg-muted/50">
              <div className="col-span-4">邮箱</div>
              <div className="col-span-2">角色</div>
              <div className="col-span-1">任务数</div>
              <div className="col-span-2">注册时间</div>
              <div className="col-span-3 text-right">操作</div>
            </div>
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm">
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  {user.role === "ADMIN" ? (
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="truncate">{user.email}</span>
                  {user.status === "DISABLED" && (
                    <Badge className="bg-red-100 text-red-700 border-0 hover:bg-red-100">已禁用</Badge>
                  )}
                </div>
                <div className="col-span-2">
                  <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                    {user.role === "ADMIN" ? "管理员" : "用户"}
                  </Badge>
                </div>
                <div className="col-span-1">{user._count.jobs}</div>
                <div className="col-span-2 text-muted-foreground text-xs">
                  {formatDate(user.createdAt)}
                </div>
                <div className="col-span-3 text-right flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(user)}>
                    {user.status === "ACTIVE" ? "禁用" : "启用"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteUser(user)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">暂无用户</div>
            )}
          </div>
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>创建用户</DialogTitle>
              <DialogDescription>为新用户设置邮箱、初始密码和角色</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">邮箱</Label>
                <Input
                  id="newEmail"
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">初始密码</Label>
                <Input
                  id="newPassword"
                  type="text"
                  required
                  placeholder="至少8位，含字母和数字"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  disabled={creating}
                />
              </div>
              <div className="space-y-2">
                <Label>角色</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">普通用户</SelectItem>
                    <SelectItem value="ADMIN">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
