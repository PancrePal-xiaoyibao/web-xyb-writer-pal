# 快速参考卡 - xyb-article-service

> 常用命令和快速查询指南

## 🚀 快速启动

### 首次部署

```bash
# 1. 克隆仓库
git clone https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal.git
cd web-xyb-writer-pal

# 2. 配置环境
cp .env.example .env
nano .env  # 修改关键变量

# 3. 运行部署脚本
bash deploy.sh

# 4. 验证部署
bash verify-deployment.sh
```

### 常规操作

```bash
# 启动应用
docker compose up -d

# 停止应用
docker compose down

# 重启应用
docker compose restart app

# 查看日志
docker compose logs -f app

# 构建镜像
docker compose build --no-cache

# 运行数据库迁移
pnpm db:migrate:deploy

# 运行种子数据
pnpm db:seed
```

---

## 📋 环境变量快速查询

### 必需变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接 | `postgresql://...` |
| `DIRECT_URL` | 迁移连接 | `postgresql://...` |
| `JWT_SECRET` | Token 密钥 | `a3f2c9d8e1b7f4a6...` |
| `LLM_PROVIDER` | LLM 提供商 | `stepfun` |
| `STEPFUN_API_KEY` | Stepfun Key | `sk-xxxxxxx` |

### 可选变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 应用端口 | `3000` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `OUTPUT_DIR` | 输出目录 | `./output` |
| `MAX_JOBS_PER_USER` | 用户最大任务数 | `1000` |
| `JOB_RETENTION_DAYS` | 任务保留天数 | `30` |

---

## 🔍 常用查询命令

### 应用状态

```bash
# 查看容器状态
docker compose ps

# 查看容器详细信息
docker compose ps -a

# 查看应用日志（最后 100 行）
docker compose logs -n 100 app

# 查看实时日志
docker compose logs -f app

# 查看错误日志
docker compose logs app | grep ERROR
```

### 数据库查询

```bash
# 连接数据库
psql "$DATABASE_URL"

# 查看用户数
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users;"

# 查看任务统计
psql "$DATABASE_URL" -c "SELECT status, COUNT(*) FROM jobs GROUP BY status;"

# 查看最近的错误任务
psql "$DATABASE_URL" -c "SELECT id, title, error_message FROM jobs WHERE status='FAILED' ORDER BY created_at DESC LIMIT 10;"

# 清空某用户的任务
psql "$DATABASE_URL" -c "DELETE FROM jobs WHERE user_id='USER_ID';"
```

### 文件操作

```bash
# 查看输出目录大小
du -sh output/

# 查看日志文件大小
du -sh logs/

# 清理旧日志（超过 30 天）
find logs -mtime +30 -delete

# 清理旧任务输出（超过 30 天）
find output -mtime +30 -delete

# 打包输出供下载
tar -czf outputs-$(date +%Y%m%d).tar.gz output/
```

---

## 🔧 故障排查速查表

### 应用无法启动

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| 容器启动失败 | 端口被占用 | `lsof -i :3000` 并修改 PORT |
| 容器启动失败 | 权限问题 | `chmod -R 755 /app/` |
| 容器启动失败 | Docker 问题 | `docker system prune -a` |

### 数据库连接失败

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| ECONNREFUSED | 数据库未运行 | `docker compose up db` |
| EAUTH | 密码错误 | 检查 DATABASE_URL 中的密码 |
| ENOTFOUND | DNS 问题 | `docker compose ps` 检查 db 容器 |

### API 返回错误

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| 500 Internal Error | 应用崩溃 | 查看日志 `docker compose logs app` |
| 403 Forbidden | 权限不足 | 检查 JWT Token 或 API Key |
| 429 Too Many Requests | 速率限制 | 等待 1 分钟后重试 |

### 磁盘空间不足

```bash
# 检查占用情况
df -h
du -sh *

# 清理操作
# 1. 清理 Docker
docker system prune -a

# 2. 清理日志
rm logs/*.log

# 3. 清理旧输出
find output -mtime +30 -delete

# 4. 清理 npm 缓存
pnpm store prune
```

---

## 📊 性能监控命令

### 实时监控

```bash
# 监控容器资源
docker stats

# 监控进程
top -p $(pgrep -f "node.*next")

# 查看磁盘 I/O
iostat -x 1

# 查看网络连接
netstat -an | grep :3000
```

### 日志分析

```bash
# 查看任务处理时间
grep "任务完成" logs/xyb-*.log | tail -20

# 查看 LLM 调用次数
grep -c "llm\|stepfun" logs/xyb-*.log

# 查看平均响应时间
grep "ms" logs/xyb-*.log | awk '{print $NF}' | sort -n | awk '{sum+=$1; count++} END {print "平均: " sum/count " ms"}'

# 查看错误率
echo "总请求数: $(grep -c "GET\|POST" logs/xyb-*.log)"
echo "错误数: $(grep -c "ERROR\|500" logs/xyb-*.log)"
```

---

## 🔐 安全快速检查

```bash
# 检查 .env 权限
ls -la .env
# 应该显示 600 (仅所有者读写)

# 检查 .env 不在 Git 中
git ls-files | grep .env
# 应该无输出

# 检查敏感信息不在日志中
grep -r "SECRET\|PASSWORD\|API_KEY" logs/ 2>/dev/null | head -5
# 应该无输出或很少

# 检查 SSL 证书有效期
openssl x509 -in /etc/letsencrypt/live/your-domain/cert.pem -text -noout | grep -A2 "Validity"

# 检查容器中没有敏感信息
docker inspect xyb-article-service | grep -i "secret\|password"
# 应该无输出
```

---

## 📈 容量规划快速计算

### 磁盘空间

```bash
# 单个任务输出大小（平均 100-500 KB）
# 日均任务数 × 平均大小 = 日均增长

# 示例：
# 100 任务/天 × 200 KB = 20 MB/天
# 20 MB × 30 天 = 600 MB/月
# 600 MB × 12 月 = 7.2 GB/年

# 建议预留 3 倍空间
7.2 GB × 3 = 21.6 GB

# 加上数据库、日志、系统: 总共需要 50+ GB
```

### 内存估算

```bash
# Node.js 应用 + 数据库
# 应用: 300-500 MB
# 数据库: 200-400 MB
# 系统: 200-300 MB

# 总计: 1-2 GB（单实例）
# 建议: 2-4 GB（生产环境）
```

### 数据库大小

```bash
# 查询当前数据库大小
psql "$DATABASE_URL" -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# 查询表大小
psql "$DATABASE_URL" -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC LIMIT 10;"
```

---

## 🔄 更新和升级

### 更新代码

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
pnpm install

# 运行迁移
pnpm db:migrate:deploy

# 构建新镜像
docker compose build --no-cache

# 重启应用
docker compose up -d
```

### 更新依赖

```bash
# 检查过期依赖
pnpm outdated

# 更新所有依赖
pnpm update --latest

# 检查安全漏洞
pnpm audit

# 修复漏洞
pnpm audit fix

# 提交变更
git add package.json pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

---

## 🚨 紧急操作

### 应用崩溃恢复

```bash
# 1. 立即重启
docker compose restart app

# 2. 如果仍然失败，查看日志
docker compose logs app --tail 50

# 3. 检查数据库连接
psql "$DATABASE_URL" -c "SELECT 1;"

# 4. 如果数据库问题，回滚到上一个版本
git revert HEAD
docker compose build --no-cache
docker compose up -d

# 5. 通知管理员
echo "$(date): App crashed and recovered" >> alert.log
```

### 数据库故障恢复

```bash
# 1. 检查数据库状态
docker compose ps db

# 2. 重启数据库
docker compose restart db
sleep 10

# 3. 运行迁移（可能需要）
pnpm db:migrate:deploy

# 4. 恢复备份（如果需要）
psql "$DATABASE_URL" < backup-latest.sql

# 5. 验证数据完整性
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM jobs;"
```

### 磁盘满处理

```bash
# 1. 立即清理
docker system prune -a --volumes
find logs -type f -delete
find output -mtime +1 -delete

# 2. 检查剩余空间
df -h

# 3. 如果仍然不足，扩展磁盘
# （具体步骤取决于云服务商）

# 4. 启用监控告警
# 设置磁盘使用超过 70% 时告警
```

---

## 📞 常用联系信息

| 项目 | 网址/命令 |
|------|----------|
| GitHub 仓库 | https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal |
| 问题报告 | https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal/issues |
| 官网 | https://www.xiaoyibao.com.cn |
| 邮箱 | info@xiaoyibao.com.cn |

---

## 📚 完整文档导航

| 文档 | 用途 |
|------|------|
| `README.md` | 项目介绍和功能 |
| `QUICKSTART.md` | 快速开始指南 |
| `DEPLOYMENT_GUIDE.md` | 详细部署指南 |
| `LINUX_DEPLOYMENT_CHECKLIST.md` | Linux 部署检查清单 |
| `ENV_CHECKLIST.md` | 环境变量配置指南 |
| `PRODUCTION_BEST_PRACTICES.md` | 生产环境最佳实践 |
| `QUICK_REFERENCE.md` | 本文档 - 快速参考 |

---

**最后更新**: 2026-06-28  
**维护者**: XYB 开发团队  
**许可证**: MIT
