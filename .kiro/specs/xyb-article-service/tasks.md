# 实施计划: xyb-article-service

## 概述

本实施计划将 xyb-article-service 从设计文档转化为一系列编码任务。每个任务按顺序构建，最终集成完整系统。项目采用 Next.js App Router + TypeScript + Prisma + PostgreSQL 技术栈。

## 任务

- [ ] 1. 项目初始化与基础配置
  - 使用 `pnpm create next-app` 创建 Next.js 15 项目
  - 配置 TypeScript strict 模式
  - 安装核心依赖: prisma, bcrypt, jose, zod
  - 安装 UI 依赖: shadcn/ui, tailwindcss
  - 配置 ESLint 和 Prettier
  - 创建 `.env.example` 文件
  - 创建 Docker 和 docker-compose.yml 配置
  - _Requirements: 技术约束_

- [ ] 2. 数据库层实现
  - [ ] 2.1 创建 Prisma Schema
    - 定义 User, ApiKey, Job 模型
    - 定义 Role, Status, JobStatus 枚举
    - 配置索引和关系
    - _Requirements: 数据模型_
  
  - [ ]* 2.2 编写数据库连接测试
    - 测试 Prisma Client 连接
    - _Requirements: 非功能需求 - 部署_

- [ ] 3. 认证服务实现
  - [ ] 3.1 实现密码哈希与验证工具
    - 使用 bcrypt 实现哈希函数
    - 实现密码验证函数
    - _Requirements: 2.3, 2.5_
  
  - [ ]* 3.2 编写密码哈希属性测试
    - **Property 3: 密码哈希可验证**
    - **验证: 需求 2.5**
  
  - [ ] 3.3 实现密码强度验证器
    - 最少 8 位、包含字母和数字
    - _Requirements: 2.3_
  
  - [ ]* 3.4 编写密码验证属性测试
    - **Property 2: 密码强度验证**
    - **验证: 需求 2.3**
  
  - [ ] 3.5 实现 JWT Token 生成与验证
    - 使用 jose 库实现 HS256 签名
    - 7 天有效期配置
    - _Requirements: 2.4, 2.5, 2.8_
  
  - [ ]* 3.6 编写 JWT Token 属性测试
    - **Property 4: JWT Token 签名验证**
    - **验证: 需求 2.8_

- [ ] 4. 输入验证层实现
  - [ ] 4.1 实现微信 URL 验证器
    - 验证 mp.weixin.qq.com 域名
    - 支持 HTTPS 协议
    - _Requirements: 1.1, 3.4, 3.5_
  
  - [ ]* 4.2 编写 URL 验证属性测试
    - **Property 1: URL 验证一致性**
    - **验证: 需求 1.1, 3.4, 3.5**
  
  - [ ] 4.3 实现输入消毒函数
    - 移除 HTML/JavaScript 标签
    - 防止 XSS 注入
    - _Requirements: 3.6_
  
  - [ ]* 4.4 编写输入消毒属性测试
    - **Property 5: 输入消毒**
    - **验证: 需求 3.6_

- [ ] 5. API Key 管理实现
  - [ ] 5.1 实现 API Key 生成器
    - `xyb_` 前缀 + 32 字符十六进制
    - 存储哈希值和前缀
    - _Requirements: 4.1_
  
  - [ ]* 5.2 编写 API Key 格式属性测试
    - **Property 6: API Key 格式**
    - **验证: 需求 4.1_
  
  - [ ] 5.3 实现 API Key 验证器
    - 验证 Key 哈希匹配
    - 检查 Key 是否已被删除
    - _Requirements: 4.5, 4.6_

- [ ] 6. 速率限制器实现
  - [ ] 6.1 实现内存速率限制器
    - IP 级限制: 60 次/分钟
    - 用户级限制: 30 次/分钟
    - API Key 级限制: 30 次/分钟
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 6.2 编写速率限制器单元测试
    - 测试计数逻辑
    - 测试过期清理
    - _Requirements: 3.1_

- [ ] 7. 认证 API 端点实现
  - [ ] 7.1 实现用户注册端点
    - POST /api/auth/register
    - 邮箱唯一性检查
    - 密码强度验证
    - 自动登录颁发 Token
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 7.2 实现用户登录端点
    - POST /api/auth/login
    - 凭据验证
    - JWT Token 颁发
    - _Requirements: 2.5, 2.6_
  
  - [ ] 7.3 实现用户登出端点
    - POST /api/auth/logout
    - 清除 HttpOnly Cookie
    - _Requirements: 2.7_
  
  - [ ] 7.4 实现当前用户查询端点
    - GET /api/auth/me
    - JWT Token 验证
    - _Requirements: 2.8_

- [ ] 8. 检查点 - 认证流程验证
  - 确保所有认证 API 测试通过，如有问题请询问用户。

- [ ] 9. 文章转换服务实现
  - [ ] 9.1 实现 Python 子进程调用封装
    - 调用 `uv run python3 render.py`
    - 参数传递: URL, template, style, rewrite
    - 超时处理: 120 秒
    - _Requirements: 1.4, 1.5, 1.6_
  
  - [ ] 9.2 实现任务状态机
    - pending → processing → success/failed
    - 错误信息记录
    - _Requirements: 1.5, 1.6_
  
  - [ ] 9.3 实现异步任务队列
    - 使用 Promise 队列处理并发
    - 最大并发数: 10
    - _Requirements: 非功能需求 - 性能_

- [ ] 10. 任务 API 端点实现
  - [ ] 10.1 实现任务创建端点
    - POST /api/jobs
    - URL 验证
    - 参数验证
    - 异步执行
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 10.2 实现任务列表查询端点
    - GET /api/jobs
    - 分页支持
    - 用户过滤
    - _Requirements: 5.1, 5.2_
  
  - [ ] 10.3 实现任务详情查询端点
    - GET /api/jobs/:id
    - 权限检查
    - _Requirements: 1.7_
  
  - [ ] 10.4 实现任务结果下载端点
    - GET /api/jobs/:id/download
    - 文件流响应
    - _Requirements: 1.8, 5.6_
  
  - [ ] 10.5 实现任务删除端点
    - DELETE /api/jobs/:id
    - 删除文件和记录
    - _Requirements: 5.5_

- [ ] 11. API Key API 端点实现
  - [ ] 11.1 实现 API Key 创建端点
    - POST /api/api-keys
    - 生成并返回完整 Key（仅一次）
    - 用户 Key 数量限制: 5
    - _Requirements: 4.1, 4.2_
  
  - [ ] 11.2 实现 API Key 列表查询端点
    - GET /api/api-keys
    - 仅显示前缀
    - _Requirements: 4.3_
  
  - [ ] 11.3 实现 API Key 删除端点
    - DELETE /api/api-keys/:id
    - 立即失效
    - _Requirements: 4.4_

- [ ] 12. 检查点 - API 端点验证
  - 确保所有 API 端点测试通过，如有问题请询问用户。

- [ ] 13. 管理员功能实现
  - [ ] 13.1 实现用户列表端点
    - GET /api/admin/users
    - 包含任务数量统计
    - _Requirements: 6.1, 6.2_
  
  - [ ] 13.2 实现用户状态更新端点
    - PATCH /api/admin/users/:id
    - 禁用/启用账户
    - _Requirements: 6.3_
  
  - [ ] 13.3 实现系统统计端点
    - GET /api/admin/stats
    - 任务总数、成功率、日均
    - _Requirements: 6.4_
  
  - [ ] 13.4 实现系统健康检查端点
    - GET /api/admin/health
    - 数据库状态、Python 服务状态、存储使用率
    - _Requirements: 6.5_

- [ ] 14. 前端页面实现
  - [ ] 14.1 实现布局组件
    - 导航栏、侧边栏
    - 响应式设计
    - _Requirements: 用户角色_
  
  - [ ] 14.2 实现首页
    - 产品介绍
    - 快速开始引导
    - _Requirements: 匿名访客权限_
  
  - [ ] 14.3 实现登录/注册页面
    - 表单验证
    - 错误提示
    - _Requirements: 2.1, 2.5_
  
  - [ ] 14.4 实现任务创建页面
    - URL 输入
    - 模板选择
    - 配色选择
    - 重写指令输入
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 14.5 实现任务列表页面
    - 分页展示
    - 状态筛选
    - 下载操作
    - _Requirements: 5.1, 1.8_
  
  - [ ] 14.6 实现 API Key 管理页面
    - 创建、列表、删除
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ] 14.7 实现管理员用户管理页面
    - 用户列表
    - 禁用操作
    - _Requirements: 6.1, 6.3_
  
  - [ ] 14.8 实现管理员统计面板
    - 图表展示
    - 健康状态
    - _Requirements: 6.4, 6.5_

- [ ] 15. 数据清理与维护实现
  - [ ] 15.1 实现定时清理任务
    - 清理 30 天前的任务和文件
    - 存储空间告警
    - _Requirements: 5.3, 5.4_

- [ ] 16. 最终检查点 - 集成验证
  - 运行完整测试套件，确保所有功能正常工作，如有问题请询问用户。

## 备注

- 标记 `*` 的任务为可选任务，可跳过以加快 MVP 开发
- 每个任务引用具体的需求编号以便追溯
- 检查点确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定场景和边界条件
