"use client";

import useSWR from "swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Key, Copy, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ApiKeysPage() {
  const { toast } = useToast();
  const { data, mutate } = useSWR("/api/api-keys", fetcher);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const apiKeys: ApiKey[] = data?.apiKeys ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "创建失败",
          description: data.error?.message ?? "请重试",
        });
        return;
      }
      setCreatedKey(data.apiKey.fullKey);
      setNewName("");
      mutate();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除该 API Key 吗？删除后将立即失效。")) return;
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "已删除" });
      mutate();
    } else {
      toast({ variant: "destructive", title: "删除失败" });
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    toast({ title: "已复制到剪贴板" });
  }

  function closeCreateDialog() {
    setCreateOpen(false);
    setCreatedKey(null);
    setNewName("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            管理您的 API 密钥用于程序化访问（最多 5 个）
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)} disabled={apiKeys.length >= 5}>
          <Plus className="w-4 h-4" />
          创建 API Key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Key className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-1">还没有 API Key</h3>
            <p className="text-muted-foreground text-sm">创建 API Key 以便通过编程方式调用服务</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{key.name}</span>
                  </div>
                  <code className="text-sm text-muted-foreground mt-1 block">
                    {key.keyPrefix}••••••••••••••••••••••••••••
                  </code>
                  <p className="text-xs text-muted-foreground mt-1">
                    创建于 {formatDate(key.createdAt)}
                    {key.lastUsedAt && ` · 最近使用 ${formatDate(key.lastUsedAt)}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(key.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => (open ? setCreateOpen(true) : closeCreateDialog())}>
        <DialogContent>
          {createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>API Key 创建成功</DialogTitle>
                <DialogDescription>
                  请立即复制并妥善保管，此密钥仅显示一次，关闭后将无法再次查看。
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <code className="text-sm flex-1 break-all">{createdKey}</code>
                <Button variant="outline" size="icon" onClick={() => copyKey(createdKey)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreateDialog}>我已保存</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>创建 API Key</DialogTitle>
                <DialogDescription>为您的 API Key 取一个便于识别的名称</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label htmlFor="keyName">名称</Label>
                <Input
                  id="keyName"
                  placeholder="例如：自动化脚本"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={creating}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  创建
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
