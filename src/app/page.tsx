import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Zap, Key, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">小胰宝文章服务</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">登录</Button>
            </Link>
            <Link href="/register">
              <Button>免费注册</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          微信公众号文章
          <span className="text-purple-600 block mt-2">一键格式转换</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          专为胰腺肿瘤患者社区内容运营团队打造，无需本地环境，通过浏览器即可完成文章格式转换，支持多种模板与配色方案。
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-base px-8">
              立即开始使用
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8">
              已有账户，登录
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Zap className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>智能转换</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                输入微信公众号链接，自动提取内容并按模板渲染，生成高质量 HTML 文件。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>多种模板</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                支持 template1/template2/template3 三种模板系列，配合莫兰迪紫、莫兰迪绿等配色方案。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Key className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>API 接入</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                创建 API Key，将转换服务集成到您的自动化工作流，轻松处理批量任务。
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="w-10 h-10 text-purple-600 mb-2" />
              <CardTitle>任务历史</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                保存历史转换记录 30 天，随时查看任务状态、重新下载结果文件。
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-gray-500 text-sm">
        <p>© 2024 小胰宝文章服务 · 专注胰腺肿瘤患者社区内容运营</p>
      </footer>
    </div>
  );
}
