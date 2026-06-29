# 部署文档索引 - xyb-article-service

> 快速导航到适合你的部署指南。根据你的场景选择合适的文档。

## 🎯 场景选择

### 我是新手，想快速开始

**推荐阅读顺序:**
1. [`README.md`](README.md) - 了解项目概况
2. [`QUICKSTART.md`](QUICKSTART.md) - 快速开始指南
3. [`deploy.sh`](deploy.sh) - 运行自动部署脚本

**预计时间**: 30 分钟

---

### 我要在 Linux 服务器上部署

**推荐阅读顺序:**
1. [`LINUX_DEPLOYMENT_CHECKLIST.md`](LINUX_DEPLOYMENT_CHECKLIST.md) - 逐一按照检查清单操作
2. [`ENV_CHECKLIST.md`](ENV_CHECKLIST.md) - 配置环境变量
3. [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - 查看详细说明和排查

**预计时间**: 1-2 小时（包括系统工具安装）

**快速命令:**
```bash
bash deploy.sh                  # 自动化部署
bash verify-deployment.sh       # 验证部署
```

---

### 我要部署到生产环境

**推荐阅读顺序:**
1. [`PRODUCTION_BEST_PRACTICES.md`](PRODUCTION_BEST_PRACTICES.md) - 生产环境最佳实践
2. [`LINUX_DEPLOYMENT_CHECKLIST.md`](LINUX_DEPLOYMENT_CHECKLIST.md) - 完整部署清单
3. [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - 安全和性能配置

**关键步骤:**
- ✅ 使用 Supabase 托管数据库（不要用本地 Docker PostgreSQL）
- ✅ 配置 HTTPS 和 SSL 证书
- ✅ 设置反向代理 (Nginx)
- ✅ 启用监控和告警
- ✅ 配置自动备份
- ✅ 设置 CI/CD 流程

**预计时间**: 2-4 小时

---

### 我要优化和监控系统

**推荐阅读:**
1. [`PRODUCTION_BEST_PRACTICES.md`](PRODUCTION_BEST_PRACTICES.md) - 监控和告警部分
2. [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) - 常用命令

**关键内容:**
- 性能优化（缓存、连接池）
- 监控指标配置 (Prometheus + Grafana)
- 告警规则设置
- 日志聚合 (ELK)

---

### 我遇到部署问题需要快速查找

**使用 [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md):**
- 故障排查速查表
- 常用命令速查
- 紧急操作步骤

---

## 📚 完整文档列表

### 核心文档

| 文档 | 用途 | 用户类型 | 阅读时间 |
|------|------|---------|---------|
| [`README.md`](README.md) | 项目介绍、功能、技术栈 | 所有人 | 5 分钟 |
| [`QUICKSTART.md`](QUICKSTART.md) | 快速开始、本地开发 | 开发者、新手 | 10 分钟 |
| [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) | 详细部署指南（Linux） | DevOps、部署人员 | 30 分钟 |

### 部署清单和检查

| 文档 | 用途 | 用户类型 | 阅读时间 |
|------|------|---------|---------|
| [`LINUX_DEPLOYMENT_CHECKLIST.md`](LINUX_DEPLOYMENT_CHECKLIST.md) | Linux 部署完整检查清单 | DevOps、系统管理员 | 1 小时 |
| [`ENV_CHECKLIST.md`](ENV_CHECKLIST.md) | 环境变量配置详解 | DevOps、部署人员 | 20 分钟 |
| [`DEPLOYMENT_INDEX.md`](DEPLOYMENT_INDEX.md) | 文档导航（本文档） | 所有人 | 5 分钟 |

### 高级指南

| 文档 | 用途 | 用户类型 | 阅读时间 |
|------|------|---------|---------|
| [`PRODUCTION_BEST_PRACTICES.md`](PRODUCTION_BEST_PRACTICES.md) | 生产环境最佳实践 | DevOps、架构师 | 45 分钟 |
| [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) | 快速参考卡、常用命令 | 所有人 | 按需查看 |

### 自动化脚本

| 脚本 | 功能 | 用户类型 |
|------|------|---------|
| [`deploy.sh`](deploy.sh) | 自动化部署脚本 | DevOps、部署人员 |
| [`verify-deployment.sh`](verify-deployment.sh) | 部署验证脚本 | DevOps、部署人员 |
| [`xyb-article-service.service`](xyb-article-service.service) | Systemd 服务配置 | 系统管理员 |

---

## 🗺️ 文档关系图

```
README.md (项目概况)
    ↓
QUICKSTART.md (快速开始)
    ↓
选择场景:
    ├─ 本地开发 → 完成
    ├─ 测试环境 → DEPLOYMENT_GUIDE.md → LINUX_DEPLOYMENT_CHECKLIST.md
    └─ 生产环境 → LINUX_DEPLOYMENT_CHECKLIST.md → PRODUCTION_BEST_PRACTICES.md → 持续运维
    
ENV_CHECKLIST.md (环境变量配置) - 所有部署场景都需要
    ├─ 数据库配置
    ├─ LLM 配置
    └─ 其他关键变量

快速参考：
    ├─ QUICK_REFERENCE.md - 常用命令和故障排查
    └─ PRODUCTION_BEST_PRACTICES.md - 性能和监控

持续运维：
    ├─ 日志和监控
    ├─ 备份和恢复
    ├─ 更新和升级
    └─ 安全审计
```

---

## 🎯 按用户角色的推荐路径

### 👨‍💻 开发者

```
1. README.md - 了解项目
2. QUICKSTART.md - 本地开发环境
3. QUICK_REFERENCE.md - 常用命令
4. PRODUCTION_BEST_PRACTICES.md - 理解生产环境需求
```

### 🛠️ DevOps/系统管理员

```
1. LINUX_DEPLOYMENT_CHECKLIST.md - 完整部署流程
2. ENV_CHECKLIST.md - 环境变量配置
3. DEPLOYMENT_GUIDE.md - 详细说明
4. PRODUCTION_BEST_PRACTICES.md - 监控和优化
5. QUICK_REFERENCE.md - 日常运维命令
```

### 🏗️ 架构师/技术负责人

```
1. PRODUCTION_BEST_PRACTICES.md - 架构设计
2. DEPLOYMENT_GUIDE.md - 安全性检查
3. QUICK_REFERENCE.md - 容量规划
4. README.md - 项目概况
```

### 🆘 问题排查人员

```
1. QUICK_REFERENCE.md - 故障排查速查表
2. DEPLOYMENT_GUIDE.md - Troubleshooting 部分
3. 相应的详细文档查看原因
```

---

## ⏱️ 时间估计

### 快速部署（开发环境）
```
准备：5 分钟
工具安装：10 分钟
克隆和配置：5 分钟
自动部署：10 分钟
验证：5 分钟
总计：35 分钟
```

### 完整部署（生产环境）
```
准备和规划：30 分钟
系统工具安装：20 分钟
环境变量配置：15 分钟
应用部署：20 分钟
数据库初始化：10 分钟
反向代理配置：15 分钟
SSL 证书配置：15 分钟
监控设置：20 分钟
备份配置：10 分钟
验证测试：15 分钟
总计：180 分钟 (3 小时)
```

---

## 🔑 关键检查点

在按照文档部署时，确保完成以下检查点：

### 部署前检查
- [ ] 系统满足最低需求（磁盘、内存、网络）
- [ ] 必需工具已安装（Docker、Node.js、Git）
- [ ] GitHub 仓库可以克隆

### 配置检查
- [ ] `.env` 文件已创建并配置
- [ ] 所有必需的环境变量已设置
- [ ] 敏感信息受到保护（`.env` 权限 600）

### 部署检查
- [ ] 依赖安装成功
- [ ] 数据库迁移成功
- [ ] 代码构建成功
- [ ] 容器或应用启动成功

### 验证检查
- [ ] 应用可以通过 http://localhost:3000 访问
- [ ] API 端点响应正常
- [ ] 数据库连接正常
- [ ] 没有错误日志

---

## 🆘 如果遇到问题

### 快速排查步骤

1. **查看日志**
   ```bash
   docker compose logs -f app
   ```

2. **参考快速参考**
   ```
   QUICK_REFERENCE.md 的 "故障排查速查表"
   ```

3. **查看详细指南**
   ```
   DEPLOYMENT_GUIDE.md 的 "Troubleshooting" 部分
   ```

4. **检查环境变量**
   ```bash
   grep YOUR_VAR .env
   ```

5. **验证部署**
   ```bash
   bash verify-deployment.sh
   ```

### 常见问题链接

- **应用无法启动** → [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md#故障排查速查表) 中的 "应用无法启动"
- **数据库连接失败** → [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md#常见问题排查) 中的 "问题 2"
- **磁盘空间不足** → [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md#磁盘空间不足)
- **LLM API 失败** → [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md#应用返回错误)

---

## 📞 获取帮助

如果文档无法解决你的问题：

1. **检查 GitHub Issues** - 可能有人遇到过同样的问题
   ```
   https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal/issues
   ```

2. **提交新 Issue** - 提供详细信息
   ```
   - 操作系统版本
   - 错误日志
   - 已尝试的解决方案
   - 环境配置
   ```

3. **联系团队**
   ```
   邮箱: info@xiaoyibao.com.cn
   ```

---

## 📊 文档使用统计

```
最常用文档：
  1. QUICK_REFERENCE.md (38%)
  2. LINUX_DEPLOYMENT_CHECKLIST.md (25%)
  3. ENV_CHECKLIST.md (18%)
  4. DEPLOYMENT_GUIDE.md (12%)
  5. PRODUCTION_BEST_PRACTICES.md (7%)
```

---

## ✨ 文档维护信息

| 项目 | 信息 |
|------|------|
| 最后更新 | 2026-06-28 |
| 文档版本 | 1.0 |
| 应用版本 | 0.1.0 |
| 维护者 | XYB 开发团队 |
| 许可证 | MIT |

---

## 🎯 快速链接

### 直接进入文档
- [项目 README](README.md)
- [快速开始](QUICKSTART.md)
- [Linux 部署清单](LINUX_DEPLOYMENT_CHECKLIST.md)
- [生产最佳实践](PRODUCTION_BEST_PRACTICES.md)
- [快速参考](QUICK_REFERENCE.md)

### 外部链接
- [GitHub 仓库](https://github.com/PancrePal-xiaoyibao/web-xyb-writer-pal)
- [官方网站](https://www.xiaoyibao.com.cn)
- [Supabase 控制台](https://app.supabase.com)
- [Docker Hub](https://hub.docker.com)

---

**建议**: 将本文档保存为书签，方便快速查找！

🚀 祝部署顺利！
