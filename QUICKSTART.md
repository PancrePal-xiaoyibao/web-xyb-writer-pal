# 快速开始

## 前置要求

- Node.js 20+
- pnpm 9+
- PostgreSQL（Supabase 或本地 Docker）
- Python 3.10+（用于 MCP 服务端点）
- 阶跃星辰 API Key（https://platform.stepfun.com）

## 1. 克隆与安装

```bash
git clone https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal.git
cd web-xyb-writer-pal

# 安装依赖
pnpm install
```

## 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env，填写关键配置
vi .env
```

### 关键配置项

```bash
# 数据库（Supabase）
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 或本地 Docker PostgreSQL
# DATABASE_URL="postgresql://xyb_user:your_password@localhost:5432/xyb_article"
# DIRECT_URL="postgresql://xyb_user:your_password@localhost:5432/xyb_article"

# JWT 密钥（32字符随机字符串）
JWT_SECRET="openssl-rand-hex-32-输出结果"

# LLM 配置
LLM_PROVIDER="stepfun"
LLM_MODEL="step-3.5-flash"
STEPFUN_API_KEY="your-stepfun-api-key-here"

# 其他（默认即可）
MCP_URL="https://changfengbox.top/api/mcp"
OUTPUT_DIR="./output"
LOG_LEVEL="info"
PORT="3000"
```

## 3. 数据库初始化

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 创建数据表
pnpm db:migrate:dev

# 创建初始管理员账号
pnpm db:seed
```

## 4. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000`。

默认管理员账号（seed 生成）：

- 邮箱：`admin@xyb.local`
- 密码：`admin123456`

## 5. 部署（Docker）

### 使用本地 PostgreSQL

```bash
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

### 使用 Supabase（外部数据库）

```bash
# 确保 .env 中 DATABASE_URL 指向 Supabase
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f app
```

## 常见问题

**Q: LLM 报错 "未配置"？**

A: 检查 `.env` 中 `LLM_PROVIDER`、`LLM_MODEL`、`STEPFUN_API_KEY` 是否正确填写。

**Q: 数据库连接失败？**

A: Supabase 用户请确认：
- 使用 Transaction pooler 端口（6543）配置 `DATABASE_URL`
- 使用 Direct connection 端口（5432）配置 `DIRECT_URL`
- 数据库密码是否正确（可通过 Supabase 控制台重置）

**Q: 文章转换耗时较长？**

A: 正常。`step-3.5-flash` 是推理模型，产出详尽内容约需 90 秒。如需更快响应，可更换为非推理快模型（如 dashscope 的 qwen-flash）。

**Q: 想用本地 Docker PostgreSQL？**

A: 确保安装 Docker，然后运行：
```bash
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

## 下一步

1. 使用管理员账号登录
2. 查看「任务列表」创建转换任务
3. 在「API Keys」管理 API Key，用于程序化调用
4. 管理员访问「管理后台」查看用户统计和系统健康
