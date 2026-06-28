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

- **前端**：Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**：Next.js API Routes + Prisma ORM
- **数据库**：PostgreSQL（支持 Supabase 或自建 Docker PostgreSQL）
- **LLM**：阶跃星辰 Step-3.5-Flash（OpenAI 兼容协议）

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

### 使用 Docker Compose（自建 PostgreSQL）

```bash
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

### 使用外部数据库

```bash
docker compose up -d --build
```

确保 `.env` 中的 `DATABASE_URL` 指向 Supabase 或任意 PostgreSQL 服务。

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

## 许可

本项目遵循 MIT 许可证。详情请参阅 `LICENSE` 文件。

## 联系我们

- 小胰宝官网：[www.xiaoyibao.com.cn](https://www.xiaoyibao.com.cn)
- 公众号：@小胰宝助手
- 邮箱：info@xiaoyibao.com.cn
