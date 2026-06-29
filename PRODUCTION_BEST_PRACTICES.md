# 生产环境最佳实践 - xyb-article-service

> 这份文档涵盖生产环境部署、监控、告警和持续改进的最佳实践。

## 📊 系统架构推荐

### 推荐架构（生产环境）

```
┌─────────────────────────────────────────────────────────────┐
│                        外部网络                              │
│                   (互联网用户流量)                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Cloudflare    │
                    │   CDN + WAF     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Let's Encrypt  │
                    │   SSL/TLS       │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Nginx        │
                    │ (反向代理)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼──┐           ┌────▼────┐          ┌───▼──┐
    │ App  │           │  App    │          │ App  │
    │Pod 1 │           │  Pod 2  │          │Pod N │
    └───┬──┘           └────┬────┘          └───┬──┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Docker/K8s    │
                    │ (容器编排)      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
    ┌───▼──┐          ┌─────▼────┐         ┌────▼────┐
    │Redis │          │PostgreSQL│         │S3/OSS   │
    │缓存  │          │(Supabase)│         │存储     │
    └──────┘          └──────────┘         └─────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Prometheus    │
                    │   (监控)        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Grafana       │
                    │  (可视化)       │
                    └─────────────────┘
```

### 配置矩阵

| 环境 | 服务器 | CPU | 内存 | 数据库 | Redis | 监控 |
|------|--------|-----|------|--------|-------|------|
| 开发 | 1 台 | 2C | 2GB | SQLite/Docker | 无 | 基础日志 |
| 测试 | 1-2 台 | 2-4C | 4GB | Docker PostgreSQL | 可选 | 基础日志 + ELK |
| 生产 | 3+ 台 | 4C+ | 8GB+ | Supabase/RDS | 是 | Prometheus + Grafana |

---

## 🔒 安全性最佳实践

### 1. 密钥管理

```bash
# ❌ 不要这样做
export JWT_SECRET="hardcoded-secret"
git add .env

# ✅ 应该这样做
# 1. 使用密钥管理服务 (AWS Secrets Manager, Vault, etc.)
# 2. 环境变量通过 CI/CD 注入
# 3. 定期轮换密钥

# 轮换 JWT_SECRET
OLD_SECRET=$(grep JWT_SECRET .env | cut -d'=' -f2)
NEW_SECRET=$(openssl rand -hex 32)

# 更新 .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env

# 重启应用
docker compose restart app

# 记录到审计日志
echo "$(date): JWT_SECRET rotated by $(whoami)" >> audit.log
```

### 2. API 密钥轮换

```bash
# LLM API Key 轮换流程
1. 在 LLM 提供商创建新 Key
2. 在 .env 中配置多个 Key
   STEPFUN_API_KEY="old-key,new-key"
3. 监控日志确认新 Key 工作正常
4. 移除旧 Key
   STEPFUN_API_KEY="new-key"
5. 重启应用
6. 在提供商中禁用旧 Key
```

### 3. 数据库安全

```bash
# 限制数据库访问
# 仅允许应用服务器访问数据库
# 在 Supabase 或 RDS 安全组中配置

# 启用数据库加密
# Supabase 默认启用 SSL
# 验证: psql "... sslmode=require"

# 定期备份
0 2 * * * /path/to/backup.sh

# 审计日志
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
```

### 4. 网络安全

```bash
# 防火墙规则
- 仅允许 80, 443 端口对外
- SSH 只允许内部网络或 VPN
- 数据库只允许应用服务器访问
- Redis 只允许应用内部访问

# DDoS 防护
使用 Cloudflare 或类似服务
配置速率限制
启用 WAF (Web Application Firewall)

# SSL/TLS
- 使用 TLS 1.2+ 
- 每 3 个月更新证书
- 启用 HSTS (HTTP Strict-Transport-Security)
```

### 5. 应用安全

```bash
# 依赖更新
pnpm update --latest
pnpm audit fix
git push && CI/CD 自动部署

# 代码审查
- 所有代码变更需要 PR 审查
- 至少 2 个审核者批准
- 通过 CI 检查（lint, build, test）

# 环境隔离
NODE_ENV=production
LOG_LEVEL=info (不要 debug)
```

---

## 📈 性能优化

### 1. 并发优化

```javascript
// src/lib/converter/index.ts 中已配置
const MAX_CONCURRENT = 10;  // 调整根据服务器性能

// 根据 CPU 核心数调整:
// 2C 服务器: 5
// 4C 服务器: 10
// 8C 服务器: 20
```

### 2. 数据库连接池

```env
# Supabase 连接池配置（已默认）
DATABASE_URL="...?pgbouncer=true"  # Transaction pooler
pool_size=25
max_overflow=10

# 本地 PostgreSQL 使用 PgBouncer
[databases]
xyb_article = host=localhost dbname=xyb_article

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
```

### 3. 缓存策略

```javascript
// 添加 Redis 缓存（可选）
// 缓存热点数据：用户信息、任务统计
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// 缓存 1 小时
await client.setex('user:' + userId, 3600, JSON.stringify(user));
```

### 4. CDN 集成

```bash
# 配置 Cloudflare 或 Aliyun OSS
# 上传输出文件到 CDN
# 减少服务器带宽

# 在 .env 中配置 CDN_URL
CDN_URL="https://cdn.your-domain.com"

# 在应用中使用
const fileUrl = `${process.env.CDN_URL}/output/${filename}`;
```

### 5. 前端优化

```bash
# 启用 Gzip 压缩（Nginx 配置）
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# 启用浏览器缓存
expires 30d;
add_header Cache-Control "public, immutable";
```

---

## 📊 监控和告警

### 1. Prometheus 指标收集

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'xyb-article-service'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

### 2. 关键指标

```bash
# 应用性能
http_requests_total             # 请求总数
http_request_duration_seconds   # 请求响应时间
http_requests_in_progress       # 当前请求数

# 业务指标
job_total                       # 任务总数
job_success_rate                # 任务成功率
job_processing_time_seconds     # 任务处理时间

# 系统资源
process_resident_memory_bytes   # 内存使用
process_cpu_seconds_total       # CPU 使用
```

### 3. 告警规则

```yaml
# alerting_rules.yml
groups:
  - name: xyb-article-service
    rules:
      # 应用不可用
      - alert: AppDown
        expr: up{job="xyb-article-service"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "XYB 应用已离线"

      # 错误率过高
      - alert: HighErrorRate
        expr: |
          (
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            /
            sum(rate(http_requests_total[5m]))
          ) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "错误率超过 5%"

      # 任务失败率过高
      - alert: HighJobFailureRate
        expr: |
          (
            sum(rate(job_total{status="failed"}[1h]))
            /
            sum(rate(job_total[1h]))
          ) > 0.1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "任务失败率超过 10%"

      # 磁盘空间不足
      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "磁盘可用空间低于 10%"

      # 内存使用过高
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 2147483648 > 0.8  # > 0.8GB (假设 1GB 限制)
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用超过 80%"
```

### 4. Grafana 仪表板

```json
{
  "dashboard": {
    "title": "XYB Article Service",
    "panels": [
      {
        "title": "请求速率 (req/s)",
        "targets": [
          {
            "expr": "rate(http_requests_total[1m])"
          }
        ]
      },
      {
        "title": "平均响应时间",
        "targets": [
          {
            "expr": "avg(rate(http_request_duration_seconds_sum[1m])) / avg(rate(http_request_duration_seconds_count[1m]))"
          }
        ]
      },
      {
        "title": "任务成功率",
        "targets": [
          {
            "expr": "sum(rate(job_total{status='success'}[1h])) / sum(rate(job_total[1h]))"
          }
        ]
      },
      {
        "title": "内存使用 (MB)",
        "targets": [
          {
            "expr": "process_resident_memory_bytes / 1048576"
          }
        ]
      }
    ]
  }
}
```

### 5. 日志聚合

```yaml
# ELK Stack 配置 (Elasticsearch + Logstash + Kibana)
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /app/xyb-article-service/logs/*.log

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "xyb-logs-%{+yyyy.MM.dd}"

# Logstash 过滤
filter {
  json {
    source => "message"
  }
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
}
```

---

## 🔄 持续集成/持续部署 (CI/CD)

### 1. GitHub Actions 工作流

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
      
      - name: Run tests
        run: pnpm test
      
      - name: Build Docker image
        run: docker build -t xyb-article-service:latest .
      
      - name: Push to Docker registry
        run: |
          docker tag xyb-article-service:latest your-registry/xyb-article-service:latest
          docker push your-registry/xyb-article-service:latest

  deploy:
    needs: test-and-build
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          SERVER_IP: ${{ secrets.SERVER_IP }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H $SERVER_IP >> ~/.ssh/known_hosts
          
          ssh -i ~/.ssh/deploy_key user@$SERVER_IP << 'EOF'
            cd /app/xyb-article-service
            git pull origin main
            pnpm install
            pnpm build
            docker compose up -d --build
          EOF
```

### 2. 蓝绿部署

```bash
#!/bin/bash
# blue-green-deploy.sh

# 判断当前运行的是蓝还是绿
CURRENT=$(curl -s http://localhost:3000/api/admin/health | jq -r '.instance')

if [ "$CURRENT" = "blue" ]; then
  TARGET="green"
  PORT=3001
else
  TARGET="blue"
  PORT=3000
fi

echo "部署到 $TARGET (端口 $PORT)"

# 启动新实例
docker compose -f docker-compose.$TARGET.yml up -d --build

# 等待新实例就绪
sleep 10

# 健康检查
if ! curl -s http://localhost:$PORT/api/admin/health | jq -e '.database == "ok"' > /dev/null; then
  echo "$TARGET 启动失败，回滚"
  docker compose -f docker-compose.$TARGET.yml down
  exit 1
fi

# 切换流量 (通过 Nginx 配置)
sed -i "s/upstream backend {/upstream backend {\n    server localhost:$PORT;/" /etc/nginx/sites-enabled/xyb-article-service
nginx -s reload

# 关闭旧实例
sleep 30
docker compose -f docker-compose.$([ "$TARGET" = "blue" ] && echo "green" || echo "blue").yml down

echo "部署完成"
```

---

## 🚀 自动扩展

### 1. Docker Swarm 扩展

```bash
# 初始化 Swarm
docker swarm init

# 创建服务
docker service create \
  --name xyb-article-service \
  --replicas 3 \
  --publish 3000:3000 \
  --update-delay 10s \
  --update-parallelism 1 \
  xyb-article-service:latest

# 扩展到 5 个副本
docker service scale xyb-article-service=5

# 监控服务
docker service ps xyb-article-service
```

### 2. Kubernetes 扩展

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xyb-article-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: xyb-article-service
  template:
    metadata:
      labels:
        app: xyb-article-service
    spec:
      containers:
      - name: app
        image: xyb-article-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/admin/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/admin/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: xyb-article-service
spec:
  type: LoadBalancer
  selector:
    app: xyb-article-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: xyb-article-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: xyb-article-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## 📅 定期维护计划

### 每日检查

```bash
#!/bin/bash
# daily-check.sh

# 1. 检查应用状态
docker compose ps | grep -q "Up" && echo "✓ 应用运行中" || echo "✗ 应用离线"

# 2. 检查错误日志
ERROR_COUNT=$(grep -c ERROR logs/$(date +%Y-%m-%d)*.log 2>/dev/null || echo 0)
echo "今日错误数: $ERROR_COUNT"

# 3. 检查磁盘空间
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
echo "磁盘使用率: ${DISK_USAGE}%"
if [ $DISK_USAGE -gt 80 ]; then
  echo "⚠️ 磁盘使用率过高！"
fi

# 4. 检查数据库连接
curl -s http://localhost:3000/api/admin/health | jq '.database'
```

### 每周维护

```bash
#!/bin/bash
# weekly-maintenance.sh

# 1. 数据库优化
docker compose exec db vacuumdb -U xyb_user xyb_article

# 2. 清理日志
find logs -mtime +30 -delete

# 3. 检查依赖更新
pnpm update --latest
git diff
# 如果有更新，提交 PR 进行审查

# 4. 备份验证
if [ -f "backups/db-$(date -d '1 day ago' +%Y%m%d)*.sql.gz" ]; then
  echo "✓ 昨日备份存在"
else
  echo "✗ 昨日备份缺失"
fi
```

### 每月评审

```bash
# 1. 性能分析
# - 查看 Grafana 仪表板
# - 分析慢查询
# - 确认缓存命中率

# 2. 安全审计
# - 检查访问日志
# - 审查 Git 提交历史
# - 验证备份加密

# 3. 容量规划
# - 预测未来 3 个月的增长
# - 评估是否需要扩容
# - 调整告警阈值

# 4. 成本优化
# - 审查 Supabase 账单
# - 检查 LLM API 使用情况
# - 优化 CDN 成本
```

---

## 🎯 总结

| 方面 | 最佳实践 |
|------|---------|
| 安全性 | 密钥管理 + 定期轮换 + WAF + 审计日志 |
| 性能 | 缓存 + CDN + 连接池 + 监控 |
| 可靠性 | 冗余 + 备份 + 自动恢复 + 告警 |
| 可维护性 | 日志 + 监控 + 自动化 + 文档 |
| 成本 | 按需扩展 + 资源优化 + 定期评审 |

---

## 📞 获取帮助

- 📖 查看 `DEPLOYMENT_GUIDE.md`
- 📋 参考 `LINUX_DEPLOYMENT_CHECKLIST.md`
- 🔑 环境变量配置：`ENV_CHECKLIST.md`
- 💬 GitHub Issues

祝你的生产环境运行顺利！🚀
