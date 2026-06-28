# 需求文档

## 项目概述

xyb-article-service 是一个独立的、可公开部署的 Web 服务，将现有的微信公众号文章转换技能（xyb-wechat-article-transcription）封装为 Web UI 和 API 服务。该服务面向胰腺肿瘤患者社区的内容运营人员，提供便捷的文章格式转换能力，同时支持用户注册、API 密钥管理和任务历史记录。

**核心价值**：
- 无需本地 Python 环境，通过浏览器即可完成文章转换
- 支持编程方式调用 API，便于集成到自动化工作流
- 提供任务历史和结果管理，方便追溯和复用

## 术语表

- **xyb-article-service**: 本项目名称，即"小胰宝文章服务"
- **User**: 已注册的系统用户
- **Admin**: 系统管理员，拥有用户管理和系统监控权限
- **Job**: 一次文章转换任务，包含输入 URL、参数配置和输出结果
- **API Key**: 用于程序化访问的认证令牌
- **Template Family**: 模板系列，可选 template1、template2、template3
- **Color Style**: 配色方案，可选 morandi_purple、morandi_green、raw_original

## 用户角色

### 匿名访客 (Anonymous Visitor)

**权限范围**：
- 访问服务首页，查看产品介绍
- 注册新账户
- 登录已有账户

### 注册用户 (Registered User)

**权限范围**：
- 登录/登出系统
- 提交文章转换任务（通过 Web UI）
- 查看自己的任务历史
- 下载自己生成的 HTML 文件
- 管理自己的 API Key（创建、查看、删除）
- 通过 API Key 调用 API 进行文章转换
- 查看和修改个人资料

### 管理员 (Admin)

**权限范围**：
- 拥有注册用户的所有权限
- 查看所有用户列表
- 查看系统使用统计（任务总数、成功率等）
- 查看系统健康状态
- 管理用户状态（禁用/启用账户）

---

## 功能需求

### 需求 1: 文章转换核心流程

**用户故事**: 作为用户，我希望输入微信公众号链接并选择模板参数，系统自动生成格式化的 HTML 文件。

#### 验收标准

1. WHEN 用户提供有效的 mp.weixin.qq.com 链接 THEN 系统 SHALL 接收并验证该链接格式
2. WHEN 用户选择模板系列（template1/template2/template3）THEN 系统 SHALL 使用对应的模板进行渲染
3. WHEN 用户选择配色方案（morandi_purple/morandi_green/raw_original）THEN 系统 SHALL 应用对应的颜色主题
4. WHEN 用户提交转换请求 THEN 系统 SHALL 异步执行转换任务并返回任务 ID
5. WHEN 转换任务完成 THEN 系统 SHALL 存储生成的 HTML 文件并记录任务状态为"成功"
6. IF 转换过程中发生错误 THEN 系统 SHALL 记录错误信息并将任务状态标记为"失败"
7. WHEN 用户请求查看任务状态 THEN 系统 SHALL 返回当前任务状态（待处理/处理中/成功/失败）
8. WHEN 任务成功完成 THEN 系统 SHALL 提供下载链接供用户下载 HTML 文件

### 需求 2: 用户注册与登录

**用户故事**: 作为新用户，我希望通过邮箱注册账户，以便使用系统的文章转换功能。

#### 验收标准

1. WHEN 用户提交有效的邮箱地址和密码 THEN 系统 SHALL 创建新用户账户
2. IF 用户提交的邮箱已被注册 THEN 系统 SHALL 拒绝注册并提示邮箱已存在
3. WHEN 用户提交密码 THEN 系统 SHALL 验证密码强度（至少 8 位，包含字母和数字）
4. WHEN 用户注册成功 THEN 系统 SHALL 自动登录用户并颁发 JWT Token
5. WHEN 用户提交正确的邮箱和密码 THEN 系统 SHALL 验证凭据并颁发 JWT Token
6. IF 用户提交错误的邮箱或密码 THEN 系统 SHALL 拒绝登录并提示凭据无效
7. WHEN 用户点击登出 THEN 系统 SHALL 清除客户端会话状态
8. WHEN 已登录用户访问需要认证的页面 THEN 系统 SHALL 验证 JWT Token 有效性

### 需求 3: 安全模块

**用户故事**: 作为系统管理员，我希望系统具备基本安全防护，防止滥用和恶意访问。

#### 验收标准

1. WHEN 用户发送请求 THEN 系统 SHALL 检查请求频率，超过限制时返回 429 错误
2. THE 系统 SHALL 对同一 IP 地址设置每分钟最多 60 次请求的限制
3. THE 系统 SHALL 对同一用户设置每分钟最多 30 次请求的限制
4. WHEN 用户提交 URL THEN 系统 SHALL 验证 URL 是否为合法的 mp.weixin.qq.com 链接
5. IF 用户提交非微信域名链接 THEN 系统 SHALL 拒绝请求并返回错误信息
6. WHEN 用户提交重写指令 THEN 系统 SHALL 对输入进行消毒处理，防止注入攻击
7. WHEN 用户访问受保护的 API 端点 THEN 系统 SHALL 验证 JWT Token 或 API Key

### 需求 4: API Key 管理

**用户故事**: 作为注册用户，我希望创建和管理 API Key，以便通过编程方式调用服务。

#### 验收标准

1. WHEN 用户请求创建 API Key THEN 系统 SHALL 生成唯一的 API Key 并关联到用户账户
2. THE 系统 SHALL 为每个用户限制最多 5 个活跃的 API Key
3. WHEN 用户查看 API Key 列表 THEN 系统 SHALL 显示所有属于该用户的 API Key（仅显示前缀，不显示完整密钥）
4. WHEN 用户请求删除 API Key THEN 系统 SHALL 立即使该 API Key 失效
5. WHEN API 请求携带有效的 API Key THEN 系统 SHALL 验证 Key 并执行请求
6. IF API 请求携带无效或已删除的 API Key THEN 系统 SHALL 返回 401 未授权错误

### 需求 5: 任务历史与结果管理

**用户故事**: 作为注册用户，我希望查看历史转换任务并下载之前生成的文件，便于追溯和复用。

#### 验收标准

1. WHEN 用户请求任务历史列表 THEN 系统 SHALL 返回该用户的所有任务记录（分页显示）
2. THE 系统 SHALL 为每条任务记录包含：任务 ID、输入 URL、模板类型、创建时间、状态
3. THE 系统 SHALL 保留任务记录和结果文件至少 30 天
4. WHEN 存储空间超过阈值 THEN 系统 SHALL 自动清理超过保留期的任务和文件
5. WHEN 用户请求删除特定任务 THEN 系统 SHALL 删除任务记录及相关文件
6. WHEN 用户下载转换结果 THEN 系统 SHALL 提供带有原始文章标题的 HTML 文件

### 需求 6: 管理员面板

**用户故事**: 作为管理员，我希望查看系统运行状态和用户使用情况，便于运维管理。

#### 验收标准

1. WHEN 管理员访问用户管理页面 THEN 系统 SHALL 显示所有注册用户列表
2. THE 用户列表 SHALL 包含：用户 ID、邮箱、注册时间、任务数量、账户状态
3. WHEN 管理员禁用某用户账户 THEN 系统 SHALL 阻止该用户登录和调用 API
4. WHEN 管理员访问使用统计页面 THEN 系统 SHALL 显示任务总数、成功率、日均任务数
5. WHEN 管理员访问系统健康页面 THEN 系统 SHALL 显示数据库连接状态、Python 服务状态、存储空间使用率

---

## 非功能需求

### 部署要求

1. THE 系统 SHALL 支持通过 Docker Compose 一键部署
2. THE 系统 SHALL 提供环境变量配置文件示例
3. THE 系统 SHALL 在 Linux 服务器上稳定运行

### 性能要求

1. WHEN 系统处理转换任务 THEN 单个任务 SHALL 在 60 秒内完成
2. THE 系统 SHALL 支持至少 10 个并发转换任务
3. THE 系统 SHALL 在用户请求后 200ms 内返回 UI 响应

### 数据保留

1. THE 系统 SHALL 保留任务记录至少 30 天
2. THE 系统 SHALL 保留结果文件至少 30 天
3. THE 系统 SHALL 在存储空间使用率达到 80% 时发出警告

### 日志与监控

1. THE 系统 SHALL 记录所有 API 请求日志
2. THE 系统 SHALL 记录所有转换任务执行日志
3. THE 系统 SHALL 记录错误日志并包含足够的调试信息
4. THE 系统 SHALL 支持日志轮转，避免日志文件无限增长

### 安全性

1. THE 系统 SHALL 使用 HTTPS 加密传输
2. THE 系统 SHALL 对用户密码进行加盐哈希存储
3. THE 系统 SHALL 对敏感配置（数据库密码、JWT 密钥）使用环境变量
4. THE 系统 SHALL 定期清理过期的会话和令牌

---

## 技术约束

### 运行时环境

- **后端**: Node.js 20+ with TypeScript, Next.js App Router
- **数据库**: PostgreSQL 15+
- **Python 调用**: 通过 `uv run python3 render.py` 子进程方式调用现有技能

### 外部依赖

- 现有 Python 技能位于 `~/.agents/skills/xyb-wechat-article-transcription`
- 需要安装 Python 3.10+ 和 uv 包管理器
- MCP 服务端点: `https://changfengbox.top/api/mcp`

### 认证方案

- JWT Token 有效期: 7 天
- JWT Token 存储位置: HttpOnly Cookie
- API Key 格式: `xyb_` 前缀 + 32 字符随机字符串
