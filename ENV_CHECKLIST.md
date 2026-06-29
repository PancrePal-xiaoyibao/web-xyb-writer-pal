# 环境变量配置检查清单

> 这份文档帮助你在新的 Linux 环境中正确配置 `.env` 文件

## 🔑 必需变量（必须配置）

### 数据库配置（二选一）

#### 方案 A: Supabase (推荐生产环境)

```bash
# 从 Supabase 控制台获取连接字符串
# Project Settings → Database → Connection string

# 选择 "Connection pooler" (使用于应用连接)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 选择 "Direct connection" (用于迁移)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**获取步骤:**
1. 登录 [Supabase Console](https://app.supabase.com)
2. 选择你的项目
3. 进入 `Settings` → `Database`
4. 在 "Connection string" 中选择 `URI`
5. 选择 `Connection pooler` (推荐) 或 `Session` 配置
6. 复制连接字符串，替换 `[PASSWORD]`

**注意:**
- `[PASSWORD]` 是创建项目时设置的数据库密码
- `[PROJECT_REF]` 例如: `xcfyimkdrrpvsmfmvabr`
- `[REGION]` 例如: `ap-southeast-1` 或 `us-east-1`
- 确保 `pgbouncer=true` 参数存在（连接池）

#### 方案 B: Docker PostgreSQL (开发/测试环境)

```bash
# 默认配置（无需修改，docker-compose 会自动创建）
DATABASE_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"
DIRECT_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"
```

**注意:**
- `xyb_user` 是 PostgreSQL 用户名
- `your_secure_password` 应该被替换为强密码
- `db` 是 docker-compose 中的服务名

### 认证配置

```bash
# JWT 密钥 - 用于签名 Token，必须保密！
# 生成 32 字节随机十六进制数字
JWT_SECRET="38c133a8215fc6e8d278b92a6b9384ee63edf80488fb7e89458c55fc81d04a7b"
```

**生成新的 JWT_SECRET:**
```bash
openssl rand -hex 32
```

**输出示例:**
```
a3f2c9d8e1b7f4a6c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a
```

### LLM 配置

#### 默认配置（Stepfun）

```bash
# 选择 LLM 提供商
LLM_PROVIDER="stepfun"

# 模型名称
LLM_MODEL="step-3.5-flash"

# Stepfun API Key
# 从 https://platform.stepfun.com/api/keys 获取
STEPFUN_API_KEY="4ZWMLnD46uocAWd9rpfQG29WB0dguje6pQy0uIAyfAfSxFqRDLJeN6Uz7SDv3ELn"
```

#### 其他 LLM 提供商

```bash
# 方案 B: SiliconFlow (硅基流动)
LLM_PROVIDER="siliconflow"
LLM_MODEL="Pro/Qwen/Qwen2-72B-Instruct"
SILICONFLOW_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 方案 C: DashScope (阿里云通义千问)
LLM_PROVIDER="dashscope"
LLM_MODEL="qwen-max"
DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 方案 D: DeepSeek
LLM_PROVIDER="deepseek"
LLM_MODEL="deepseek-chat"
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 方案 E: OpenAI
LLM_PROVIDER="openai"
LLM_MODEL="gpt-3.5-turbo"
OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
OPENAI_BASE_URL="https://api.openai.com/v1"
```

**获取 API Key 的方式:**

| 提供商 | 地址 | 说明 |
|------|------|------|
| Stepfun | https://platform.stepfun.com/api/keys | 阶跃星辰 |
| SiliconFlow | https://cloud.siliconflow.cn/account/api-keys | 硅基流动 |
| DashScope | https://dashscope.console.aliyun.com/apiKey | 阿里云通义 |
| DeepSeek | https://platform.deepseek.com/api_keys | 深度求索 |
| OpenAI | https://platform.openai.com/api-keys | OpenAI |

### MCP 配置

```bash
# 文章下载服务端点（用于抓取微信文章原文）
# 这个服务必须可以连接
MCP_URL="https://changfengbox.top/api/mcp"
```

**验证 MCP 连接:**
```bash
curl -s "https://changfengbox.top/api/mcp?url=https://mp.weixin.qq.com/s/test"
```

---

## ⚙️ 可选变量

### 应用配置

```bash
# 应用运行端口
PORT="3000"

# 日志级别: debug | info | warn | error
LOG_LEVEL="info"

# 日志文件目录
LOG_DIR="./logs"

# 输出文件保存目录
OUTPUT_DIR="./output"
```

### 任务管理

```bash
# 每个用户最大任务数
MAX_JOBS_PER_USER="1000"

# 任务保留天数（超过此时间的任务会被自动删除）
JOB_RETENTION_DAYS="30"
```

### 管理员账户初始化

```bash
# 种子数据中默认管理员账户
ADMIN_EMAIL="admin@xyb.local"
ADMIN_PASSWORD="xiaoyiba@1234"
```

**重要:** 部署后应立即修改这些凭证！

### 高级 LLM 配置

```bash
# 通用 API Key（优先级最高，会覆盖其他 provider 的 key）
LLM_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"

# 自定义 Base URL（用于兼容 OpenAI API 的其他服务）
LLM_BASE_URL="https://api.custom-provider.com/v1"
```

---

## 🔄 配置流程示例

### 场景 1: 生产环境（使用 Supabase）

```bash
# 1. 复制模板
cp .env.example .env

# 2. 编辑 .env
nano .env

# 3. 配置数据库（Supabase）
DATABASE_URL="postgresql://postgres.xcfyimkdrrpvsmfmvabr:your_password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xcfyimkdrrpvsmfmvabr:your_password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# 4. 生成 JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# 5. 配置 LLM
LLM_PROVIDER="stepfun"
STEPFUN_API_KEY="your-api-key"

# 6. 启动
docker compose up -d --build
```

### 场景 2: 开发环境（使用 Docker PostgreSQL）

```bash
# 1. 复制模板
cp .env.example .env

# 2. 编辑 .env (保持 Docker PostgreSQL 配置不变)
# DATABASE_URL="postgresql://xyb_user:your_password@db:5432/xyb_article"

# 3. 生成 JWT_SECRET
openssl rand -hex 32 > /tmp/jwt_secret
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(cat /tmp/jwt_secret)/" .env

# 4. 启动（包括数据库）
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
```

---

## ✅ 验证配置

### 检查列表

```bash
# 1. 验证 .env 文件存在
test -f .env && echo "✓ .env 存在" || echo "✗ .env 不存在"

# 2. 检查关键变量
grep "DATABASE_URL=" .env
grep "JWT_SECRET=" .env
grep "LLM_PROVIDER=" .env

# 3. 验证 JWT_SECRET 格式（应为 64 个十六进制字符）
JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
echo "$JWT_SECRET" | wc -c  # 应该是 65（64 + 换行符）

# 4. 测试数据库连接
psql "$(grep DATABASE_URL .env | cut -d'=' -f2)" -c "SELECT 1;"

# 5. 测试 LLM API
STEPFUN_KEY=$(grep STEPFUN_API_KEY .env | cut -d'=' -f2)
curl -X POST https://api.stepfun.com/v1/chat/completions \
  -H "Authorization: Bearer $STEPFUN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"step-3.5-flash","messages":[{"role":"user","content":"test"}]}'

# 6. 测试 MCP 服务
MCP_URL=$(grep MCP_URL .env | cut -d'=' -f2)
curl -s "$MCP_URL" | head -20
```

---

## 🔐 安全建议

### 保护敏感信息

```bash
# 1. .env 不应该被 Git 提交
git status  # 确认 .env 不在追踪中

# 2. .gitignore 应该包含 .env
cat .gitignore | grep "\.env"

# 3. 严格限制文件权限
chmod 600 .env
chmod 600 .env.example

# 4. 不要把 .env 分享给他人
# 如需共享配置，使用 .env.example 作为模板
```

### 环境隔离

```bash
# 开发环境
export NODE_ENV=development
export LOG_LEVEL=debug

# 生产环境
export NODE_ENV=production
export LOG_LEVEL=info
```

### 定期更新密钥

```bash
# 每三个月重新生成 JWT_SECRET
NEW_JWT=$(openssl rand -hex 32)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT/" .env

# 轮换 API Keys（根据提供商的最佳实践）
```

---

## 🆘 常见问题

### Q1: 如何验证我的数据库配置是否正确？

```bash
# 安装 PostgreSQL 客户端
sudo apt-get install -y postgresql-client

# 测试连接
psql "$(grep DATABASE_URL .env | cut -d'=' -f2)"

# 如果连接成功，会进入 psql 命令行
# 输入 \q 退出
```

### Q2: JWT_SECRET 可以重复使用吗？

不应该。每个环境应该有唯一的 JWT_SECRET。如果 JWT_SECRET 泄露，需要立即更换。

### Q3: 我能否在多个部署中使用相同的 API Key？

不建议。最佳实践是为每个环境/部署创建独立的 API Key，这样如果一个 Key 泄露，可以只禁用该 Key。

### Q4: 如何在生产环境中轮换 LLM API Key 而不中断服务？

```bash
# 1. 在 .env 中配置多个 Key（逗号分隔）
STEPFUN_API_KEY="old-key,new-key"

# 2. 应用会自动在这两个 Key 之间轮换
# 3. 一旦确认 new-key 工作正常，删除 old-key
STEPFUN_API_KEY="new-key"

# 4. 重启应用
docker compose restart app
```

### Q5: 如何检查当前使用的是哪个 LLM 提供商？

```bash
# 查看应用日志中的 LLM 配置信息
docker compose logs app | grep -i "llm\|provider"

# 或直接查看 .env
grep "LLM_PROVIDER=" .env
grep "LLM_MODEL=" .env
```

---

## 📋 快速配置模板

### 完整 .env 配置示例

```env
# ============================================
# 数据库配置（Supabase）
# ============================================
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"

# ============================================
# 认证配置
# ============================================
JWT_SECRET="38c133a8215fc6e8d278b92a6b9384ee63edf80488fb7e89458c55fc81d04a7b"

# ============================================
# LLM 配置
# ============================================
LLM_PROVIDER="stepfun"
LLM_MODEL="step-3.5-flash"
STEPFUN_API_KEY="your-api-key"

# ============================================
# MCP 配置
# ============================================
MCP_URL="https://changfengbox.top/api/mcp"

# ============================================
# 应用配置
# ============================================
PORT="3000"
LOG_LEVEL="info"
OUTPUT_DIR="./output"
MAX_JOBS_PER_USER="1000"
JOB_RETENTION_DAYS="30"

# ============================================
# 管理员账户（部署后立即更改！）
# ============================================
ADMIN_EMAIL="admin@xyb.local"
ADMIN_PASSWORD="xiaoyiba@1234"
```

---

## 📞 获取帮助

配置有问题？

1. 查看对应服务的官方文档
2. 检查日志: `docker compose logs app`
3. 验证连接性: 见上述 "验证配置" 部分
4. 查阅 `DEPLOYMENT_GUIDE.md` 的排查部分
5. 在 GitHub Issues 提交问题

祝配置顺利！🚀
