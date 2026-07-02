# web-xyb-writer-pal

小胰宝文章服务 Web 端，将微信公众号文章自动转换为 xyb 风格 HTML。

## 功能特性

- ✅ 微信公众号文章下载与解析
- ✅ 多模板支持（template1/template2/template3）
- ✅ 多配色方案（莫兰迪紫/莫兰迪绿/原始配色）
- ✅ AI 改写排版（基于阶跃星辰 Step-3.5-Flash）
- ✅ 任务历史与结果管理
- ✅ API Key 管理与 API 调用
- ✅ 管理员面板（用户管理、统计监控）

## 技术栈

- **运行环境**：Node.js 22 LTS（Active LTS，支持至 2027 年 4 月）
  - ⚠️ **必需**：pnpm 11.9.0+ 需要 Node.js ≥22.13
  - Docker 部署使用 `node:22-alpine` 镜像
- **前端**：Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：PostgreSQL（支持 Supabase 或自建 Docker PostgreSQL）
- **LLM**：阶跃星辰 Step-3.5-Flash（OpenAI 兼容协议）

## 环境要求

### 开发环境

- **Node.js 22 LTS**（Active LTS 版本）
  - ⚠️ **必需**：pnpm 11.9.0+ 需要 Node.js ≥22.13（使用了 `node:sqlite` 模块）
  - 验证：`node --version` 应显示 `v22.x.x`
  - 推荐使用 [nvm](https://github.com/nvm-sh/nvm) 或 [fnm](https://github.com/Schniz/fnm) 管理 Node 版本

### 生产环境

- Docker（推荐使用 `docker compose` 部署）
- PostgreSQL 数据库（Supabase 或自建）
- 阶跃星辰 API Key（用于 AI 改写功能）

### 为什么选择 Node.js 22 LTS？

根据 [Node.js 官方发布计划](https://nodejs.org/en/about/previous-releases)：

| 版本 | 状态 | 支持周期 | 推荐场景 |
|------|------|---------|---------|
| **Node.js 22** | **Active LTS** | 2024.10 - 2027.04 | ✅ **生产环境首选** |
| Node.js 20 | Maintenance LTS | 2023.10 - 2026.04 | ✅ 旧项目维护 |
| Node.js 24 | Current → LTS | 2025.10 - 2028.04 | ⚠️ 测试新特性 |

**最佳实践**：
- ✅ 生产环境使用 Active LTS 或 Maintenance LTS
- ❌ 避免使用 Current 版本（仅在测试新特性时使用）
- 🔄 定期升级 LTS 版本，保持安全更新

> **注意**：pnpm 11.9.0+ 使用了 Node.js 22.13 引入的 `node:sqlite` 模块，因此 Node 20 无法运行最新版 pnpm。

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal.git
cd web-xyb-writer-pal
```

### 2. 配置环境变量

复制并编辑 `.env`：

```bash
cp .env.example .env
```

编辑 `.env`，配置以下关键项：

**数据库（二选一）**

- **Supabase（推荐）**：将 `DATABASE_URL` 和 `DIRECT_URL` 替换为 Supabase 连接串

- **本地 Docker PostgreSQL**：保持默认值或设置密码

**LLM 配置**

```bash
LLM_PROVIDER="stepfun"
LLM_MODEL="step-3.5-flash"
STEPFUN_API_KEY="your-stepfun-api-key"
```

**JWT 密钥**

```bash
JWT_SECRET="openssl-rand-hex-32-输出结果"
```

### 3. 数据库初始化

```bash
pnpm db:generate
pnpm db:migrate:dev
pnpm db:seed
```

### 4. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000`。

## 部署

### Docker 部署（推荐）

Dockerfile 使用 `node:22-alpine` 镜像，确保生产环境使用正确的 Node.js LTS 版本。

#### 使用 Docker Compose（自建 PostgreSQL）

```bash
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

#### 使用外部数据库（Supabase）

```bash
docker compose up -d --build
```

确保 `.env` 中的 `DATABASE_URL` 指向 Supabase 或任意 PostgreSQL 服务。

#### Docker 部署优势

- ✅ 自动使用 Node.js 22 LTS 环境
- ✅ 包含原生依赖构建工具（python3、make、g++）
- ✅ 支持 pnpm native packages（prisma、sharp、esbuild）
- ✅ 优化镜像大小（~450MB）

## 项目结构

```
src/
├── app/                  # Next.js App Router
│   ├── (auth)/          # 认证相关页面（登录/注册）
│   ├── (dashboard)/     # 主应用页面（任务/API Key/设置）
│   ├── admin/           # 管理员面板
│   ├── api/             # API Routes
│   └── page.tsx         # 首页
├── components/          # React 组件（UI/布局/业务组件）
├── lib/                 # 核心逻辑
│   ├── auth/           # 认证（JWT/密码/API Key）
│   ├── converter/      # 文章转换（fetch/LLM/渲染）
│   ├── db/             # Prisma 客户端
│   ├── rate-limiter/   # 速率限制
│   ├── validators/     # 输入验证
│   └── logger.ts       # 结构化日志
└── middleware.ts       # 路由保护中间件
```

## 开发

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint
```

## API 文档

### 认证端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| GET  | `/api/auth/me` | 获取当前用户信息 |

### 任务端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/jobs` | 获取任务列表 |
| POST | `/api/jobs` | 创建新任务 |
| GET  | `/api/jobs/:id` | 获取任务详情 |
| GET  | `/api/jobs/:id/download` | 下载结果 |
| DELETE | `/api/jobs/:id` | 删除任务 |

### API Key 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/api-keys` | 获取 API Key 列表 |
| POST | `/api/api-keys` | 创建新 API Key |
| DELETE | `/api/api-keys/:id` | 删除 API Key |

### 管理员端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/admin/users` | 用户列表（分页） |
| POST | `/api/admin/users` | 创建用户 |
| PATCH | `/api/admin/users/:id` | 更新用户状态 |
| DELETE | `/api/admin/users/:id` | 删除用户 |
| GET  | `/api/admin/stats` | 系统统计 |
| GET  | `/api/admin/health` | 系统健康检查 |

## 后续改进计划

### Phase 2: 多源支持

- [ ] **文本文件导入** - 支持 .txt / .md / .docx 直接上传转换
- [ ] **小红书内容提取** - 从小红书笔记 URL 自动下载并转换
- [ ] **微博转录** - 支持微博长文章链接
- [ ] **哔哩哔哩字幕提取** - 从 B 站视频提取字幕并转成文章
- [ ] **通用 URL 提取** - 支持任意网页内容爬取与转换

### Phase 3: 增强功能

- [ ] **批量转换** - 支持任务队列和批处理
- [ ] **自定义模板编辑器** - 用户可自己设计模板
- [ ] **多语言支持** - 翻译改写功能
- [ ] **预览模式** - 实时预览转换效果
- [ ] **CDN 图片优化** - 自动上传图片至 CDN

### Phase 4: 社区建设

- [ ] **开发者市场** - 分享模板与转换工具
- [ ] **插件系统** - 允许第三方扩展
- [ ] **API 限流优化** - 为开发者友好的调用体验

## 贡献指南

我们欢迎并感谢所有贡献者！无论是修复 Bug、改进功能还是完善文档，你的贡献都对小胰宝项目很重要。

### 如何开始

1. **Fork 仓库** - 点击 GitHub 右上角的 Fork 按钮
2. **创建特性分支** - `git checkout -b feature/your-feature-name`
3. **开发并测试** - 遵循项目代码风格，确保功能完整
4. **提交 PR** - 描述清楚你的改进，关联相关 Issue

### 代码规范

- 使用 TypeScript，类型必须完整
- 遵循 Next.js 最佳实践
- 每个 API 端点都需要相应的错误处理和日志
- 提交前运行 `pnpm lint` 检查代码

### 报告问题

发现 Bug 或有改进建议？欢迎提交 Issue，包括：

- 问题描述
- 复现步骤
- 预期行为 vs 实际行为
- 系统环境信息

### 讨论与建议

- GitHub Discussions - 参与功能讨论
- Issues - 跟踪具体任务和 Bug
- Email - info@xiaoyibao.com.cn

## 许可

本项目遵循 MIT 许可证。详情请参阅 `LICENSE` 文件。

## 联系我们

- 小胰宝官网：[www.xiaoyibao.com.cn](https://www.xiaoyibao.com.cn)
- 公众号：@小胰宝助手
- 邮箱：info@xiaoyibao.com.cn
- GitHub Issues：[提交问题](https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal/issues)
