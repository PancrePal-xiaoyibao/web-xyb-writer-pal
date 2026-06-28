"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const TEMPLATES = [
  { value: "template1", label: "模板一 (Template 1)" },
  { value: "template2", label: "模板二 (Template 2)" },
  { value: "template3", label: "模板三 (Template 3)" },
];

const COLOR_STYLES = [
  { value: "morandi_purple", label: "莫兰迪紫" },
  { value: "morandi_green", label: "莫兰迪绿" },
  { value: "raw_original", label: "原始配色" },
];

export default function NewJobPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [form, setForm] = useState({
    sourceUrl: "",
    templateFamily: "template1",
    colorStyle: "morandi_purple",
    rewriteInstructions: "",
  });

  async function handleEnhance() {
    setEnhancing(true);
    try {
      const res = await fetch("/api/rewrite/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: form.rewriteInstructions || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "补全失败",
          description: data.error?.message ?? "请稍后重试",
        });
        return;
      }
      setForm((f) => ({ ...f, rewriteInstructions: data.enhanced }));
      toast({ title: "已补全改写要求", description: "可继续手动微调" });
    } finally {
      setEnhancing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rewriteInstructions: form.rewriteInstructions || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data.error?.details?.fields?.sourceUrl?.[0] ??
          data.error?.message ??
          "创建任务失败";
        toast({ variant: "destructive", title: "创建失败", description: msg });
        return;
      }
      toast({ title: "任务已创建", description: "正在后台转换，请稍候查看结果" });
      router.push("/jobs");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1">
        <ArrowLeft className="w-4 h-4" />
        返回任务列表
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>新建转换任务</CardTitle>
          <CardDescription>输入微信公众号文章链接并选择转换参数</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">文章链接 *</Label>
              <Input
                id="sourceUrl"
                type="url"
                placeholder="https://mp.weixin.qq.com/s/..."
                required
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                仅支持 mp.weixin.qq.com 域名的文章链接
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>模板系列</Label>
                <Select
                  value={form.templateFamily}
                  onValueChange={(v) => setForm({ ...form, templateFamily: v })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>配色方案</Label>
                <Select
                  value={form.colorStyle}
                  onValueChange={(v) => setForm({ ...form, colorStyle: v })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_STYLES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rewrite">重写指令（可选）</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-7 text-xs"
                  onClick={handleEnhance}
                  disabled={enhancing || loading}
                >
                  {enhancing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  一键补全
                </Button>
              </div>
              <Textarea
                id="rewrite"
                placeholder="例如：精简内容，突出重点段落...（也可留空，点“一键补全”自动生成）"
                rows={6}
                maxLength={2000}
                value={form.rewriteInstructions}
                onChange={(e) => setForm({ ...form, rewriteInstructions: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {form.rewriteInstructions.length}/2000 字符 · “一键补全”会调用 AI 把要求整理为覆盖标题/风格/视角/结构的改写指令
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              开始转换
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
