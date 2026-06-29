# Linux 环境部署指南

## 📋 部署前清单

### 系统要求

```bash
# 检查系统版本（Ubuntu/Debian 推荐）
cat /etc/os-release

# 检查磁盘空间（至少 10GB 可用）
df -h

# 检查内存（推荐 2GB+ 可用）
free -h

# 检查 CPU 核心数
nproc
```

### 必需工具安装

#### 1. Node.js & pnpm

```bash
# 方案 A: 使用 nvm（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
node --version  # v20.x.x

# 安装 pnpm（推荐使用 npm）
npm install -g pnpm
pnpm --version  # 9.x.x+

# 方案 B: 直接安装（如果 nvm 安装失败）
apt-get update
apt-get install -y nodejs npm
npm install -g pnpm
```

#### 2. Git

```bash
apt-get install -y git
git --version
```

#### 3. Docker & Docker Compose（推荐）

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 验证安装
docker --version
docker compose version

# 添加当前用户到 docker 组（避免 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

#### 4. PostgreSQL 客户端（可选，用于数据库管理）

```bash
apt-get install -y postgresql-client
```

---

## 🚀 部署步骤

### 第 1 步: 克隆仓库

```bash
# 创建应用目录
mkdir -p /app
cd /app

# 克隆仓库
git clone https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal.git xyb-article-service
cd xyb-article-service

# 查看当前分支
git branch -a

# 确保在 main 分支上
git checkout main
git pull origin main
```

### 第 2 步: 环境配置

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env 文件（重要！）
nano .env
# 或使用你喜欢的编辑器
vi .env
```

**必需配置项** (必须修改):

```env
# ============ 数据库配置 ============
# 选项 A: 使用 Supabase (托管 PostgreSQL - 推荐生产环境)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 选项 B: 使用本地 Docker PostgreSQL (开发环境)
# DATABASE_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"
# DIRECT_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"

# ============ 认证配置 ============
# 生成 32 字节随机数
JWT_SECRET="$(openssl rand -hex 32)"

# ============ LLM 配置 ============
LLM_PROVIDER="stepfun"
LLM_MODEL="step-3.5-flash"
STEPFUN_API_KEY="your-stepfun-api-key-here"

# 或其他 LLM 提供商
DASHSCOPE_API_KEY="your-dashscope-api-key-here"
SILICONFLOW_API_KEY="your-siliconflow-api-key-here"

# ============ 其他配置 ============
MCP_URL="https://changfengbox.top/api/mcp"
PORT="3000"
LOG_LEVEL="info"
```

### 第 3 步: 依赖安装

```bash
# 安装依赖
pnpm install

# 验证安装成功
pnpm --version
node --version
```

### 第 4 步: 数据库初始化

**如果使用 Docker PostgreSQL:**

```bash
# 启动 PostgreSQL 容器
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d db

# 等待数据库就绪
sleep 10

# 生成 Prisma Client
pnpm db:generate

# 运行迁移
pnpm db:migrate:deploy

# 种子数据（可选）
pnpm db:seed
```

**如果使用 Supabase:**

```bash
# 只需要生成 Prisma Client 和运行迁移
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

### 第 5 步: 验证构建

```bash
# 验证代码无错误
pnpm lint

# 构建生产版本
pnpm build

# 检查构建输出
ls -la .next/
```

### 第 6 步: 启动应用

**选项 A: 使用 Docker Compose (推荐)**

```bash
# 使用 Supabase 数据库（最常见）
docker compose up -d --build

# 或使用本地 PostgreSQL
docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build

# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f app
```

**选项 B: 直接运行 Next.js**

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start

# 或使用 pm2 守护进程
npm install -g pm2
pm2 start "pnpm start" --name "xyb-article-service"
pm2 save
pm2 startup
```

---

## ⚙️ 关键配置点

### 1. 数据库选择（重要！）

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **Supabase** | 无需管理，自动备份，稳定可靠 | 需付费，有外部依赖 | 生产环境 ✅ |
| **Docker PostgreSQL** | 完全自主，免费，快速启动 | 需自己管理备份，需要数据卷持久化 | 测试/开发环境 ✅ |
| **自建 PostgreSQL** | 完全自主，成本低 | 维护复杂，需要备份策略 | 高级场景 |

**强烈建议**: 生产环境使用 Supabase，开发环境使用 Docker PostgreSQL。

### 2. LLM 配置

```bash
# 验证 API Key 是否有效
curl -X POST https://api.stepfun.com/v1/chat/completions \
  -H "Authorization: Bearer $STEPFUN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "step-3.5-flash",
    "messages": [{"role": "user", "content": "测试"}],
    "temperature": 0.7
  }'
```

### 3. MCP 服务连接

```bash
# 测试 MCP 服务（微信文章下载服务）
curl -s "https://changfengbox.top/api/mcp?url=https://mp.weixin.qq.com/..." | head -100
```

### 4. 文件存储

```bash
# 确保 output 目录存在且可写
mkdir -p output
chmod 755 output

# 如果使用 Docker，需要挂载卷
# docker-compose.yml 中已配置:
# volumes:
#   - ./output:/app/output
```

---

## 🔐 安全配置

### 环境变量安全

```bash
# ❌ 不要这样做
git add .env
git commit -m "add env"

# ✅ 应该这样做
# .env 已在 .gitignore 中，不会被提交
cat .gitignore | grep "\.env"

# 确认 .env 没有被追踪
git status
```

### 防火墙配置

```bash
# 如果使用 UFW（Ubuntu 防火墙）
sudo ufw enable
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 3000/tcp    # 应用端口（如果直接暴露）

# 查看当前规则
sudo ufw status
```

### Nginx 反向代理（推荐）

```bash
# 安装 Nginx
sudo apt-get install -y nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/xyb-article-service

# 粘贴以下内容:
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向 HTTP 到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书（使用 Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 代理配置
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 文件下载优化
    location /output {
        alias /app/xyb-article-service/output;
        expires 24h;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/xyb-article-service \
           /etc/nginx/sites-enabled/

# 测试 Nginx 配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔄 持续运行与监控

### 使用 systemd 守护进程

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/xyb-article-service.service

# 粘贴以下内容:
```

```ini
[Unit]
Description=XYB Article Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=/app/xyb-article-service
ExecStart=/usr/bin/docker compose up
ExecStop=/usr/bin/docker compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用并启动服务
sudo systemctl enable xyb-article-service
sudo systemctl start xyb-article-service

# 查看状态
sudo systemctl status xyb-article-service

# 查看日志
sudo journalctl -u xyb-article-service -f
```

### 使用 PM2（替代方案）

```bash
# 安装 PM2
npm install -g pm2

# 创建 ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'xyb-article-service',
    script: 'pnpm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 启动应用
pm2 start ecosystem.config.js

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 list
pm2 logs
```

### 日志管理

```bash
# 查看应用日志
tail -f logs/*.log

# 按日期轮换日志（使用 logrotate）
sudo nano /etc/logrotate.d/xyb-article-service

# 粘贴以下内容:
```

```
/app/xyb-article-service/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        systemctl restart xyb-article-service > /dev/null 2>&1 || true
    endscript
}
```

---

## 📊 性能优化

### 数据库连接池

```bash
# .env 中已配置 Supabase 连接池
# 如果使用自建 PostgreSQL，考虑使用 PgBouncer:
sudo apt-get install -y pgbouncer

# 配置 /etc/pgbouncer/pgbouncer.ini
[databases]
xyb_article = host=localhost port=5432 dbname=xyb_article

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

### Redis 缓存与速率限制（可选）

```bash
# 安装 Redis
sudo apt-get install -y redis-server

# 启动 Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证
redis-cli ping  # 返回 PONG

# 更新 .env（如果应用支持）
# REDIS_URL="redis://localhost:6379"
```

### CDN 集成（可选）

```bash
# 上传 output 目录到 CDN（如 Cloudflare）
# 更新 .env
# CDN_URL="https://cdn.your-domain.com"
```

---

## 🆘 常见问题排查

### 问题 1: 端口 3000 已被占用

```bash
# 检查占用情况
lsof -i :3000

# 修改 PORT 环境变量
sed -i 's/PORT=.*/PORT=3001/' .env

# 重启应用
docker compose restart app
```

### 问题 2: 数据库连接失败

```bash
# 测试数据库连接
psql "$DATABASE_URL"

# 检查 Supabase 连接串
# - 确认密码正确
# - 确认区域正确
# - 确认使用了 pooler 端口 (6543)

# 查看应用日志
docker compose logs app | grep -i database
```

### 问题 3: LLM API 请求失败

```bash
# 测试 API Key
curl -X POST https://api.stepfun.com/v1/chat/completions \
  -H "Authorization: Bearer $STEPFUN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"step-3.5-flash","messages":[{"role":"user","content":"test"}]}'

# 查看详细错误日志
docker compose logs app | grep -i llm
```

### 问题 4: MCP 服务无法连接

```bash
# 测试 MCP 连接
curl -v "$MCP_URL"

# 检查防火墙
sudo ufw status
sudo iptables -L

# 如果需要更换 MCP 服务
sed -i "s|MCP_URL=.*|MCP_URL=https://new-mcp-url|" .env
```

### 问题 5: 磁盘空间不足

```bash
# 检查磁盘使用
df -h

# 清理 Docker 镜像和容器
docker system prune -a

# 清理 npm 缓存
pnpm store prune

# 检查 output 目录大小
du -sh output/

# 运行清理任务
curl http://localhost:3000/api/admin/cleanup \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## ✅ 验证清单

部署后逐一检查:

- [ ] `docker compose ps` 显示所有容器运行中
- [ ] `curl http://localhost:3000` 返回首页 HTML
- [ ] 登录页面可以正常加载
- [ ] API `/api/auth/me` 返回 401（未认证）
- [ ] `/api/admin/health` 显示系统健康状态
- [ ] 日志文件 `logs/` 正常生成
- [ ] 输出文件保存到 `output/` 目录
- [ ] 监听 3000 端口（或配置的 PORT）
- [ ] SSL 证书配置正确（如有）
- [ ] 防火墙规则允许 HTTP/HTTPS

---

## 📈 生产环境建议

1. **使用 Supabase** - 自动备份、高可用、无需维护
2. **配置 HTTPS** - 使用 Let's Encrypt 免费证书
3. **使用 Nginx** - 反向代理、负载均衡、静态文件服务
4. **监控日志** - 使用 ELK Stack 或 Datadog
5. **自动备份** - 数据库每天备份，output 定期上传 S3
6. **告警通知** - CPU/内存/磁盘告警推送
7. **定期更新** - `git pull` 拉取最新代码，重新构建
8. **分阶段部署** - 先在测试环境验证，再上线

---

## 📞 技术支持

遇到问题？按以下顺序排查:

1. 查看 `docker compose logs app` 中的错误信息
2. 检查 `.env` 配置是否正确
3. 验证外部服务（Supabase、LLM API、MCP）可连接
4. 检查网络与防火墙设置
5. 提交 Issue 到 GitHub 仓库

祝部署顺利！🚀
