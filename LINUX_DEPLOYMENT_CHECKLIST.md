# Linux 部署清单 - xyb-article-service

> 这是一份在新的 Linux 服务器上部署 xyb-article-service 的完整检查清单。按照步骤逐一检查，确保生产环境部署无误。

## 📋 部署前准备（Pre-Deployment）

### 1. 系统环境检查

- [ ] **检查 Linux 发行版** 
  ```bash
  cat /etc/os-release
  # 推荐: Ubuntu 20.04+ 或 Debian 11+
  ```

- [ ] **检查磁盘空间**
  ```bash
  df -h
  # 要求: 至少 20GB 可用空间（10GB 应用 + 10GB 数据库备份）
  ```

- [ ] **检查内存**
  ```bash
  free -h
  # 要求: 至少 2GB 可用内存（推荐 4GB）
  ```

- [ ] **检查 CPU 核心**
  ```bash
  nproc
  # 建议: 2+ 核心
  ```

- [ ] **检查网络连接**
  ```bash
  ping -c 3 8.8.8.8
  # 确保互联网连接正常
  ```

### 2. 用户和权限设置

- [ ] **创建专用应用用户**
  ```bash
  sudo useradd -m -s /bin/bash xyb
  # 或使用现有用户（如 www-data）
  ```

- [ ] **为用户设置 sudo 权限（可选）**
  ```bash
  sudo usermod -aG sudo xyb
  ```

- [ ] **创建应用目录**
  ```bash
  sudo mkdir -p /app/xyb-article-service
  sudo chown -R xyb:xyb /app/xyb-article-service
  sudo chmod -R 755 /app/xyb-article-service
  ```

- [ ] **切换到应用用户**
  ```bash
  su - xyb
  cd /app/xyb-article-service
  ```

---

## 🔧 环境工具安装（Tool Installation）

### 1. 系统包更新

- [ ] **更新包管理器**
  ```bash
  sudo apt-get update
  sudo apt-get upgrade -y
  ```

- [ ] **安装基础工具**
  ```bash
  sudo apt-get install -y \
    curl wget git vim nano build-essential \
    openssl ca-certificates
  ```

### 2. Node.js 和 pnpm 安装

- [ ] **选项 A: 使用 NVM（推荐）**
  ```bash
  # 下载并安装 NVM
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  
  # 重新加载 shell 配置
  source ~/.bashrc
  
  # 验证 NVM 安装
  nvm --version
  
  # 安装 Node.js 20 LTS
  nvm install 20
  nvm use 20
  nvm alias default 20
  
  # 验证
  node --version  # v20.x.x
  npm --version   # 10.x.x+
  ```

- [ ] **选项 B: 使用系统包（简单但版本可能不够新）**
  ```bash
  sudo apt-get install -y nodejs npm
  # 检查版本
  node --version  # 应该 >= 18.0.0
  ```

- [ ] **安装 pnpm**
  ```bash
  npm install -g pnpm
  
  # 验证
  pnpm --version  # 9.x.x+
  ```

### 3. Git 安装

- [ ] **安装 Git**
  ```bash
  sudo apt-get install -y git
  
  # 验证
  git --version
  
  # 配置 Git（可选）
  git config --global user.name "Your Name"
  git config --global user.email "your@email.com"
  ```

### 4. Docker 安装

- [ ] **安装 Docker**
  ```bash
  # 下载并执行官方脚本
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  
  # 清理
  rm get-docker.sh
  
  # 验证
  docker --version
  ```

- [ ] **安装 Docker Compose**
  ```bash
  # Docker 20.10+ 已内置 compose 命令
  # 验证
  docker compose version
  
  # 如果不可用，手动安装
  sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  ```

- [ ] **配置 Docker 用户权限**
  ```bash
  # 将当前用户添加到 docker 组
  sudo usermod -aG docker xyb
  
  # 重新登录或运行
  newgrp docker
  
  # 验证
  docker ps
  ```

### 5. PostgreSQL 客户端安装（可选但推荐）

- [ ] **安装 PostgreSQL 客户端**
  ```bash
  sudo apt-get install -y postgresql-client
  
  # 验证
  psql --version
  ```

---

## 📦 应用克隆和初始化（Application Clone）

### 1. 克隆仓库

- [ ] **克隆 GitHub 仓库**
  ```bash
  cd /app/xyb-article-service
  git clone https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal.git .
  
  # 验证
  ls -la
  git remote -v
  ```

- [ ] **确保在 main 分支**
  ```bash
  git checkout main
  git pull origin main
  ```

- [ ] **检查 .gitignore（确保 .env 不被追踪）**
  ```bash
  cat .gitignore | grep "\.env"
  # 应该包含 .env
  ```

### 2. 环境变量配置

- [ ] **复制环境变量模板**
  ```bash
  cp .env.example .env
  chmod 600 .env  # 限制权限
  ```

- [ ] **编辑 .env 文件（最重要！）**
  ```bash
  nano .env
  # 或使用你喜欢的编辑器
  ```

**必须配置的变量：**

- [ ] **数据库配置（二选一）**
  
  **选项 A: Supabase（推荐生产环境）**
  ```env
  DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
  ```
  
  **选项 B: Docker PostgreSQL（开发环境）**
  ```env
  DATABASE_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"
  DIRECT_URL="postgresql://xyb_user:your_secure_password@db:5432/xyb_article"
  ```

- [ ] **JWT 密钥配置**
  ```bash
  # 生成 32 字节随机十六进制数
  JWT_SECRET=$(openssl rand -hex 32)
  echo "JWT_SECRET=$JWT_SECRET"
  
  # 将结果写入 .env
  sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  ```

- [ ] **LLM 提供商配置**
  ```env
  LLM_PROVIDER="stepfun"
  LLM_MODEL="step-3.5-flash"
  STEPFUN_API_KEY="your-api-key-here"
  ```

- [ ] **MCP 服务配置**
  ```env
  MCP_URL="https://changfengbox.top/api/mcp"
  ```

- [ ] **其他关键配置**
  ```env
  PORT="3000"
  LOG_LEVEL="info"
  OUTPUT_DIR="./output"
  ```

- [ ] **验证 .env 配置**
  ```bash
  # 检查必需变量
  grep "DATABASE_URL=" .env
  grep "JWT_SECRET=" .env
  grep "STEPFUN_API_KEY=" .env
  
  # 验证没有默认值
  grep "replace-with" .env
  # 应该无输出
  ```

---

## 🏗️ 依赖安装和构建（Build）

### 1. 安装项目依赖

- [ ] **安装 npm 包**
  ```bash
  pnpm install --force
  
  # 验证
  ls -la node_modules | head -20
  ```

### 2. 数据库初始化

- [ ] **生成 Prisma Client**
  ```bash
  pnpm db:generate
  ```

- [ ] **运行数据库迁移**
  ```bash
  pnpm db:migrate:deploy
  
  # 如果使用本地 Docker PostgreSQL，先启动数据库
  docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d db
  sleep 10  # 等待数据库就绪
  ```

- [ ] **运行种子数据（可选）**
  ```bash
  pnpm db:seed
  ```

### 3. 代码质量检查

- [ ] **运行 ESLint**
  ```bash
  pnpm lint
  # 应该无错误
  ```

- [ ] **构建生产版本**
  ```bash
  pnpm build
  
  # 验证构建成功
  ls -la .next/
  ```

---

## 🚀 应用启动（Application Start）

### 1. Docker 方式（推荐）

- [ ] **使用 Supabase 数据库启动**
  ```bash
  docker compose up -d --build
  
  # 验证容器运行
  docker compose ps
  ```

- [ ] **或使用本地 PostgreSQL 启动**
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.local-db.yml up -d --build
  
  # 验证容器运行
  docker compose ps
  ```

- [ ] **查看应用日志**
  ```bash
  docker compose logs -f app
  
  # 等待看到类似信息:
  # > Ready in 3.2s, URL: http://localhost:3000
  ```

### 2. 直接运行方式（备选）

- [ ] **构建生产版本**
  ```bash
  pnpm build
  ```

- [ ] **启动应用**
  ```bash
  # 前台运行（用于测试）
  pnpm start
  
  # 后台运行（使用 PM2）
  npm install -g pm2
  pm2 start "pnpm start" --name "xyb-article-service"
  pm2 save
  pm2 startup
  ```

---

## ✅ 验证部署（Verification）

### 1. 快速验证脚本

- [ ] **运行验证脚本**
  ```bash
  bash verify-deployment.sh
  
  # 应该看到所有 ✓ 符号
  ```

### 2. 手动验证

- [ ] **检查应用响应**
  ```bash
  curl http://localhost:3000
  # 应该返回 HTML 内容
  ```

- [ ] **检查 API 端点**
  ```bash
  # 未认证应返回 401
  curl http://localhost:3000/api/auth/me
  
  # 健康检查
  curl http://localhost:3000/api/admin/health | jq .
  ```

- [ ] **检查数据库连接**
  ```bash
  curl http://localhost:3000/api/admin/health | jq '.database'
  # 应该显示 "ok"
  ```

- [ ] **检查文件系统**
  ```bash
  ls -la output/   # 输出目录
  ls -la logs/     # 日志目录
  ```

- [ ] **浏览器访问**
  ```
  打开: http://your-server-ip:3000
  看到首页即表示成功
  ```

---

## 🔐 安全加固（Security Hardening）

### 1. 防火墙配置

- [ ] **安装和启用 UFW**
  ```bash
  sudo apt-get install -y ufw
  sudo ufw enable
  ```

- [ ] **配置防火墙规则**
  ```bash
  sudo ufw allow 22/tcp      # SSH
  sudo ufw allow 80/tcp      # HTTP
  sudo ufw allow 443/tcp     # HTTPS
  sudo ufw allow 3000/tcp    # 应用（如果直接暴露）
  
  # 查看规则
  sudo ufw status
  ```

- [ ] **限制 SSH 访问（推荐）**
  ```bash
  # 编辑 SSH 配置
  sudo nano /etc/ssh/sshd_config
  
  # 修改这些行:
  # Port 2222  (非标准端口)
  # PermitRootLogin no
  # PasswordAuthentication no
  # MaxAuthTries 3
  
  # 重启 SSH
  sudo systemctl restart ssh
  ```

### 2. SSL/TLS 证书（HTTPS）

- [ ] **使用 Let's Encrypt（免费）**
  ```bash
  sudo apt-get install -y certbot python3-certbot-nginx
  
  sudo certbot certonly --standalone -d your-domain.com
  # 或如果使用 Nginx:
  sudo certbot --nginx -d your-domain.com
  ```

- [ ] **设置证书自动续期**
  ```bash
  sudo systemctl enable certbot.timer
  sudo systemctl start certbot.timer
  
  # 验证
  sudo systemctl status certbot.timer
  ```

### 3. 环境变量保护

- [ ] **限制 .env 文件权限**
  ```bash
  chmod 600 .env
  chmod 600 .env.example
  ```

- [ ] **验证 .env 不在 Git 中**
  ```bash
  git ls-files | grep .env
  # 应该无输出（表示 .env 被忽略）
  ```

### 4. 日志安全

- [ ] **配置日志轮换**
  ```bash
  sudo nano /etc/logrotate.d/xyb-article-service
  
  # 添加:
  ```
  ```
  /app/xyb-article-service/logs/*.log {
      daily
      rotate 7
      compress
      delaycompress
      notifempty
      create 0640 xyb xyb
  }
  ```

---

## 🌐 反向代理配置（Nginx）

### 1. 安装 Nginx

- [ ] **安装**
  ```bash
  sudo apt-get install -y nginx
  
  # 启用自启
  sudo systemctl enable nginx
  sudo systemctl start nginx
  ```

### 2. 配置反向代理

- [ ] **创建 Nginx 配置**
  ```bash
  sudo nano /etc/nginx/sites-available/xyb-article-service
  ```

- [ ] **粘贴以下配置**
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;
      
      # 重定向到 HTTPS
      return 301 https://$server_name$request_uri;
  }
  
  server {
      listen 443 ssl http2;
      server_name your-domain.com;
      
      # SSL 证书
      ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
      ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
      ssl_protocols TLSv1.2 TLSv1.3;
      ssl_ciphers HIGH:!aNULL:!MD5;
      
      # 日志
      access_log /var/log/nginx/xyb-access.log;
      error_log /var/log/nginx/xyb-error.log;
      
      # 代理
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
          
          # 超时设置
          proxy_connect_timeout 60s;
          proxy_send_timeout 60s;
          proxy_read_timeout 120s;
      }
      
      # 文件下载
      location /output {
          alias /app/xyb-article-service/output;
          expires 24h;
      }
  }
  ```

- [ ] **启用配置**
  ```bash
  sudo ln -s /etc/nginx/sites-available/xyb-article-service \
             /etc/nginx/sites-enabled/
  
  # 删除默认配置（可选）
  sudo rm /etc/nginx/sites-enabled/default
  ```

- [ ] **测试 Nginx 配置**
  ```bash
  sudo nginx -t
  # 应该显示: syntax is ok
  ```

- [ ] **重启 Nginx**
  ```bash
  sudo systemctl restart nginx
  ```

---

## 🔄 持续运行和监控（Monitoring）

### 1. Systemd 服务

- [ ] **创建 systemd 服务**
  ```bash
  sudo cp xyb-article-service.service /etc/systemd/system/
  sudo chmod 644 /etc/systemd/system/xyb-article-service.service
  ```

- [ ] **启用和启动服务**
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl enable xyb-article-service
  sudo systemctl start xyb-article-service
  
  # 验证状态
  sudo systemctl status xyb-article-service
  ```

- [ ] **查看服务日志**
  ```bash
  sudo journalctl -u xyb-article-service -f
  ```

### 2. 日志监控

- [ ] **查看应用日志**
  ```bash
  tail -f logs/xyb-*.log
  
  # 或通过 Docker
  docker compose logs -f app
  ```

- [ ] **设置日志告警（可选）**
  ```bash
  # 监控错误日志
  grep ERROR logs/*.log
  ```

### 3. 资源监控

- [ ] **监控 CPU 和内存**
  ```bash
  docker stats
  # 或
  top -p $(pgrep -f "node.*next")
  ```

- [ ] **监控磁盘空间**
  ```bash
  df -h
  du -sh output/
  du -sh logs/
  ```

### 4. 定期维护

- [ ] **每周检查**
  ```bash
  # 检查磁盘空间
  df -h
  
  # 检查容器状态
  docker compose ps
  
  # 检查错误日志
  grep -i error logs/*.log | tail -20
  ```

- [ ] **每月维护**
  ```bash
  # 清理 Docker 镜像
  docker system prune -a
  
  # 更新依赖
  git pull
  pnpm install
  docker compose build --no-cache
  docker compose up -d
  ```

---

## 📊 备份和恢复（Backup & Recovery）

### 1. 数据库备份

- [ ] **使用 Supabase**
  ```bash
  # Supabase 自动每日备份，无需额外操作
  # 在 Supabase 控制台查看备份
  ```

- [ ] **使用本地 PostgreSQL**
  ```bash
  # 创建备份
  docker compose exec db pg_dump -U xyb_user xyb_article > backup.sql
  
  # 恢复备份
  docker compose exec db psql -U xyb_user xyb_article < backup.sql
  ```

- [ ] **自动备份脚本**
  ```bash
  # 创建 backup.sh
  cat > backup.sh << 'EOF'
  #!/bin/bash
  BACKUP_DIR="/backups"
  mkdir -p $BACKUP_DIR
  
  # 数据库备份
  docker compose exec db pg_dump -U xyb_user xyb_article | \
    gzip > $BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql.gz
  
  # 输出文件备份
  tar -czf $BACKUP_DIR/output-$(date +%Y%m%d-%H%M%S).tar.gz output/
  
  # 保留最近 7 天的备份
  find $BACKUP_DIR -mtime +7 -delete
  EOF
  
  chmod +x backup.sh
  ```

- [ ] **设置定时备份**
  ```bash
  # 添加到 crontab
  crontab -e
  
  # 每天凌晨 2 点执行备份
  0 2 * * * /app/xyb-article-service/backup.sh
  ```

### 2. 应用备份

- [ ] **备份关键文件**
  ```bash
  # 备份 .env
  cp .env .env.backup
  
  # 定期备份整个应用目录
  tar -czf xyb-article-service-$(date +%Y%m%d).tar.gz .
  ```

---

## 🆘 故障排查（Troubleshooting）

### 1. 应用无法启动

**问题: 容器启动失败**
```bash
# 查看日志
docker compose logs app

# 常见原因:
# - 数据库连接失败 → 检查 DATABASE_URL
# - 端口被占用 → 修改 PORT
# - 权限问题 → 检查目录权限
```

### 2. 数据库连接失败

**问题: DATABASE_URL 连接错误**
```bash
# 测试连接
psql "$(grep DATABASE_URL .env | cut -d'=' -f2)"

# 如果失败，检查:
# - 用户名/密码正确性
# - 数据库服务是否运行
# - 网络防火墙
```

### 3. LLM API 失败

**问题: LLM 请求超时或错误**
```bash
# 测试 API Key
curl -X POST https://api.stepfun.com/v1/chat/completions \
  -H "Authorization: Bearer $STEPFUN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"step-3.5-flash","messages":[{"role":"user","content":"test"}]}'

# 检查:
# - API Key 是否有效
# - 是否有额度
# - 网络连接是否正常
```

### 4. 磁盘空间不足

**问题: 磁盘已满**
```bash
# 检查占用情况
du -sh *
df -h

# 清理:
docker system prune -a
rm -rf logs/*.log*
rm -rf output/*  # 谨慎！会删除任务结果
```

---

## ✨ 最终验证（Final Checks）

- [ ] 应用在 http://localhost:3000 或 https://your-domain.com 可访问
- [ ] 登录页面可以正常加载
- [ ] 可以使用默认账户登录（或创建新账户）
- [ ] 可以创建新任务
- [ ] 任务可以正常处理
- [ ] 结果文件可以下载
- [ ] 日志文件正常生成
- [ ] 没有 500 错误
- [ ] 内存/CPU/磁盘使用正常
- [ ] SSL 证书配置正确（HTTPS）
- [ ] 防火墙规则配置正确
- [ ] 备份流程已设置

---

## 🎉 部署完成！

如果所有检查项都已完成，恭喜！你的 xyb-article-service 已成功部署到 Linux 环境。

### 后续步骤

1. **监控应用** - 定期检查日志和资源使用
2. **备份数据** - 设置自动备份流程
3. **安全更新** - 定期更新 Linux 和依赖包
4. **性能优化** - 根据使用情况调整缓存和并发数
5. **功能扩展** - 继续开发新功能

### 获取帮助

- 📖 详见 `DEPLOYMENT_GUIDE.md`
- 🔑 环境变量配置：`ENV_CHECKLIST.md`
- 🐛 故障排查：`DEPLOYMENT_GUIDE.md` 的 Troubleshooting 部分
- 💬 提交 Issue 到 GitHub

祝你使用愉快！🚀
