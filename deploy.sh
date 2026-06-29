#!/bin/bash

##############################################################################
# XYB Article Service - Linux 快速部署脚本
# 用法: bash deploy.sh [--help] [--check-only] [--skip-build]
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() { echo -e "${BLUE}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warn() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }

# 检查命令是否存在
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# 获取脚本参数
CHECK_ONLY=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --help)
      cat << 'EOF'
用法: bash deploy.sh [选项]

选项:
  --help          显示帮助信息
  --check-only    仅检查环境，不执行部署
  --skip-build    跳过构建步骤
  
示例:
  bash deploy.sh                    # 完整部署
  bash deploy.sh --check-only       # 检查环境
  bash deploy.sh --skip-build       # 跳过构建
EOF
      exit 0
      ;;
    --check-only)
      CHECK_ONLY=true
      shift
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    *)
      log_error "未知选项: $1"
      exit 1
      ;;
  esac
done

##############################################################################
# 第 1 步: 检查系统环境
##############################################################################

log_info "============================================"
log_info "检查系统环境..."
log_info "============================================"

# 检查系统
if [[ ! -f /etc/os-release ]]; then
  log_error "无法检测到 Linux 系统"
  exit 1
fi

OS_NAME=$(grep "^NAME=" /etc/os-release | cut -d'"' -f2)
log_success "检测到系统: $OS_NAME"

# 检查磁盘空间
DISK_AVAILABLE=$(df / | tail -1 | awk '{print $4}')
DISK_GB=$((DISK_AVAILABLE / 1024 / 1024))

if [ "$DISK_GB" -lt 5 ]; then
  log_warn "磁盘可用空间仅 ${DISK_GB}GB（建议至少 10GB）"
else
  log_success "磁盘可用空间: ${DISK_GB}GB"
fi

# 检查内存
MEM_AVAILABLE=$(free -m | grep "^Mem" | awk '{print $7}')
if [ "$MEM_AVAILABLE" -lt 1024 ]; then
  log_warn "可用内存仅 ${MEM_AVAILABLE}MB（建议至少 1GB）"
else
  log_success "可用内存: ${MEM_AVAILABLE}MB"
fi

##############################################################################
# 第 2 步: 检查必需工具
##############################################################################

log_info ""
log_info "============================================"
log_info "检查必需工具..."
log_info "============================================"

# 检查 Git
if command_exists git; then
  GIT_VERSION=$(git --version | awk '{print $3}')
  log_success "Git $GIT_VERSION 已安装"
else
  log_error "Git 未安装"
  log_info "请运行: sudo apt-get install -y git"
  exit 1
fi

# 检查 Node.js
if command_exists node; then
  NODE_VERSION=$(node --version)
  log_success "Node.js $NODE_VERSION 已安装"
  
  NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_MAJOR" -lt 18 ]; then
    log_warn "Node.js 版本较低，建议升级到 18+ 版本"
  fi
else
  log_error "Node.js 未安装"
  log_info "请运行以下命令安装:"
  log_info "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
  log_info "  source ~/.bashrc"
  log_info "  nvm install 20"
  log_info "  nvm use 20"
  exit 1
fi

# 检查 pnpm
if command_exists pnpm; then
  PNPM_VERSION=$(pnpm --version)
  log_success "pnpm $PNPM_VERSION 已安装"
else
  log_warn "pnpm 未安装，尝试安装..."
  npm install -g pnpm
  PNPM_VERSION=$(pnpm --version)
  log_success "pnpm $PNPM_VERSION 已安装"
fi

# 检查 Docker（可选但推荐）
if command_exists docker; then
  DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
  log_success "Docker $DOCKER_VERSION 已安装"
  
  if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    log_success "Docker Compose 已安装"
  else
    log_warn "Docker Compose 未安装，某些部署方式可能不可用"
  fi
  
  # 检查 Docker 权限
  if docker ps >/dev/null 2>&1; then
    log_success "Docker 权限检查通过"
  else
    log_warn "无法访问 Docker（可能需要 sudo 权限）"
    log_info "请运行: sudo usermod -aG docker \$USER && newgrp docker"
  fi
else
  log_warn "Docker 未安装（可选，用于容器化部署）"
fi

# 检查 openssl（用于生成随机数）
if command_exists openssl; then
  log_success "OpenSSL 已安装"
else
  log_error "OpenSSL 未安装"
  exit 1
fi

if [ "$CHECK_ONLY" = true ]; then
  log_success ""
  log_success "环境检查完成！"
  exit 0
fi

##############################################################################
# 第 3 步: 检查项目配置
##############################################################################

log_info ""
log_info "============================================"
log_info "检查项目配置..."
log_info "============================================"

if [ ! -f ".env" ]; then
  log_warn ".env 文件不存在，从 .env.example 复制..."
  cp .env.example .env
  log_success ".env 已创建"
else
  log_success ".env 文件已存在"
fi

# 检查关键环境变量
if grep -q "JWT_SECRET=" .env; then
  JWT_VALUE=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
  if [ "$JWT_VALUE" = "replace-with-output-of-openssl-rand-hex-32" ] || [ -z "$JWT_VALUE" ]; then
    log_warn "JWT_SECRET 需要配置"
  else
    log_success "JWT_SECRET 已配置"
  fi
fi

if grep -q "DATABASE_URL=" .env; then
  log_success "DATABASE_URL 已配置"
else
  log_error "DATABASE_URL 未配置"
  exit 1
fi

if grep -q "LLM_PROVIDER=" .env; then
  LLM_PROVIDER=$(grep "^LLM_PROVIDER=" .env | cut -d'=' -f2)
  log_success "LLM_PROVIDER 已配置: $LLM_PROVIDER"
fi

##############################################################################
# 第 4 步: 安装依赖
##############################################################################

log_info ""
log_info "============================================"
log_info "安装依赖..."
log_info "============================================"

log_info "运行 pnpm install --force..."
pnpm install --force
log_success "依赖安装完成"

##############################################################################
# 第 5 步: 初始化数据库
##############################################################################

log_info ""
log_info "============================================"
log_info "初始化数据库..."
log_info "============================================"

log_info "生成 Prisma Client..."
pnpm db:generate
log_success "Prisma Client 生成完成"

log_info "运行数据库迁移..."
pnpm db:migrate:deploy
log_success "数据库迁移完成"

# 尝试运行种子数据
if [ -f "prisma/seed.ts" ]; then
  log_info "运行种子数据..."
  pnpm db:seed || log_warn "种子数据运行失败（可能已存在）"
fi

##############################################################################
# 第 6 步: 代码检查和构建
##############################################################################

if [ "$SKIP_BUILD" != true ]; then
  log_info ""
  log_info "============================================"
  log_info "代码检查和构建..."
  log_info "============================================"

  log_info "运行 ESLint..."
  pnpm lint
  log_success "代码检查通过"

  log_info "构建生产版本..."
  pnpm build
  log_success "构建完成"
else
  log_info ""
  log_info "跳过构建步骤（--skip-build）"
fi

##############################################################################
# 第 7 步: 启动应用
##############################################################################

log_info ""
log_info "============================================"
log_info "启动应用..."
log_info "============================================"

# 检查 Docker 是否可用
if command_exists docker && docker ps >/dev/null 2>&1; then
  log_info "检测到 Docker 可用，使用 Docker Compose 启动..."
  
  if docker compose ps >/dev/null 2>&1; then
    log_info "停止现有容器..."
    docker compose down || true
  fi
  
  log_info "启动容器..."
  docker compose up -d --build
  
  log_success "容器已启动"
  log_info ""
  log_info "容器状态:"
  docker compose ps
  
  # 等待应用就绪
  log_info ""
  log_info "等待应用就绪..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
      log_success "应用已就绪！"
      break
    fi
    echo -n "."
    sleep 1
  done
else
  log_info "Docker 不可用，使用 pnpm 直接启动..."
  log_info "请手动运行: pnpm start"
  log_warn "或安装 Docker 以使用容器化部署"
fi

##############################################################################
# 最终检查
##############################################################################

log_info ""
log_info "============================================"
log_info "最终检查..."
log_info "============================================"

# 检查应用是否响应
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  log_success "应用在 http://localhost:3000 上运行"
else
  log_warn "应用未响应（可能还在启动中）"
fi

# 显示日志提示
if command_exists docker && docker ps >/dev/null 2>&1; then
  log_info ""
  log_info "查看日志: docker compose logs -f app"
fi

log_info ""
log_info "查看详细部署指南: cat DEPLOYMENT_GUIDE.md"

##############################################################################
# 完成
##############################################################################

log_info ""
log_success "============================================"
log_success "部署完成！"
log_success "============================================"
log_info ""
log_info "后续步骤:"
log_info "  1. 打开浏览器访问 http://localhost:3000"
log_info "  2. 使用默认账户登录"
log_info "  3. 创建新任务开始使用"
log_info ""
log_info "更多信息请参考: DEPLOYMENT_GUIDE.md"
log_info ""
