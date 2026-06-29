#!/bin/bash

##############################################################################
# XYB Article Service - 部署验证脚本
# 用法: bash verify-deployment.sh
# 检查部署后的应用是否正常运行
##############################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log_info() { echo -e "${BLUE}ℹ ${NC}$1"; }
log_success() { echo -e "${GREEN}✓ ${NC}$1"; }
log_warn() { echo -e "${YELLOW}⚠ ${NC}$1"; }
log_error() { echo -e "${RED}✗ ${NC}$1"; }

# 计数器
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNED=0

test_result() {
  local name="$1"
  local status="$2"  # 0 = pass, 1 = fail, 2 = warn
  
  case $status in
    0)
      log_success "$name"
      ((TESTS_PASSED++))
      ;;
    1)
      log_error "$name"
      ((TESTS_FAILED++))
      ;;
    2)
      log_warn "$name"
      ((TESTS_WARNED++))
      ;;
  esac
}

##############################################################################
# 检查列表
##############################################################################

log_info "============================================"
log_info "XYB Article Service 部署验证"
log_info "============================================"
log_info ""

# 1. Docker 状态
log_info "检查 Docker 状态..."
if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
  test_result "Docker 可用" 0
else
  test_result "Docker 不可用" 2
fi

# 2. 容器状态
log_info ""
log_info "检查容器状态..."
if command -v docker >/dev/null 2>&1; then
  if docker compose ps >/dev/null 2>&1; then
    APP_STATUS=$(docker compose ps --format "table {{.Names}}\t{{.Status}}" | grep -i app | awk '{print $2}' || echo "unknown")
    DB_STATUS=$(docker compose ps --format "table {{.Names}}\t{{.Status}}" | grep -i db | awk '{print $2}' || echo "unknown")
    
    if [[ "$APP_STATUS" == *"Up"* ]]; then
      test_result "应用容器运行中" 0
    else
      test_result "应用容器未运行 ($APP_STATUS)" 1
    fi
    
    if [[ "$DB_STATUS" == *"Up"* ]] || [[ "$DB_STATUS" == "" ]]; then
      test_result "数据库容器状态正常" 0
    else
      test_result "数据库容器未运行 ($DB_STATUS)" 2
    fi
  else
    test_result "Docker Compose 不可用" 1
  fi
else
  test_result "无法检查容器（Docker 未安装）" 2
fi

# 3. 应用连接
log_info ""
log_info "检查应用连接..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  test_result "应用监听在 http://localhost:3000" 0
else
  test_result "应用无法连接（http://localhost:3000）" 1
fi

# 4. API 端点
log_info ""
log_info "检查 API 端点..."

# 检查 /api/auth/me（未认证应返回 401）
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me)
if [ "$HTTP_CODE" = "401" ]; then
  test_result "认证端点正常（返回 401）" 0
elif [ "$HTTP_CODE" = "000" ]; then
  test_result "无法连接到 API（应用未运行）" 1
else
  test_result "认证端点异常（HTTP $HTTP_CODE）" 2
fi

# 检查 /api/admin/health（健康检查）
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/admin/health)
if [[ "$HEALTH_RESPONSE" == *"status"* ]]; then
  test_result "健康检查端点正常" 0
  
  # 解析健康状态
  DB_HEALTH=$(echo "$HEALTH_RESPONSE" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
  if [ "$DB_HEALTH" = "ok" ]; then
    test_result "数据库连接正常" 0
  elif [ "$DB_HEALTH" = "error" ]; then
    test_result "数据库连接异常" 1
  else
    test_result "无法判断数据库状态" 2
  fi
else
  test_result "健康检查端点异常" 2
fi

# 5. 文件系统
log_info ""
log_info "检查文件系统..."

if [ -d "output" ]; then
  test_result "Output 目录存在" 0
  
  # 检查权限
  if [ -w "output" ]; then
    test_result "Output 目录可写" 0
  else
    test_result "Output 目录不可写" 1
  fi
else
  test_result "Output 目录不存在" 1
fi

if [ -d "logs" ]; then
  test_result "Logs 目录存在" 0
  
  # 检查是否有最近的日志文件
  if find logs -mmin -5 -type f >/dev/null 2>&1; then
    test_result "日志文件最近生成过" 0
  else
    test_result "日志文件可能未生成" 2
  fi
else
  test_result "Logs 目录不存在（可能还未启动）" 2
fi

# 6. 环境配置
log_info ""
log_info "检查环境配置..."

if [ -f ".env" ]; then
  test_result ".env 文件存在" 0
  
  # 检查关键变量
  if grep -q "DATABASE_URL=" .env; then
    test_result "DATABASE_URL 已配置" 0
  else
    test_result "DATABASE_URL 未配置" 1
  fi
  
  if grep -q "JWT_SECRET=" .env; then
    JWT_VAL=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
    if [ -z "$JWT_VAL" ] || [ "$JWT_VAL" = "replace-with-output-of-openssl-rand-hex-32" ]; then
      test_result "JWT_SECRET 未配置或无效" 1
    else
      test_result "JWT_SECRET 已配置" 0
    fi
  else
    test_result "JWT_SECRET 未配置" 1
  fi
  
  if grep -q "LLM_PROVIDER=" .env; then
    test_result "LLM_PROVIDER 已配置" 0
  else
    test_result "LLM_PROVIDER 未配置" 2
  fi
else
  test_result ".env 文件不存在" 1
fi

# 7. 数据库连接
log_info ""
log_info "检查数据库连接..."

if command -v psql >/dev/null 2>&1; then
  DB_URL=$(grep "DATABASE_URL=" .env 2>/dev/null | cut -d'=' -f2 | tr -d '"' | sed 's/?pgbouncer=true//')
  
  if psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
    test_result "数据库连接成功" 0
    
    # 检查表是否存在
    if psql "$DB_URL" -c "\dt users" >/dev/null 2>&1; then
      test_result "Users 表存在" 0
    else
      test_result "Users 表不存在（可能未运行迁移）" 2
    fi
  else
    test_result "数据库连接失败" 1
  fi
else
  test_result "PostgreSQL 客户端未安装（无法测试数据库连接）" 2
fi

# 8. 内存使用
log_info ""
log_info "检查资源使用..."

if [ -f /proc/meminfo ]; then
  MEM_TOTAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
  MEM_USED=$((MEM_TOTAL - MEM_AVAILABLE))
  MEM_PERCENT=$((MEM_USED * 100 / MEM_TOTAL))
  
  echo "  内存使用: ${MEM_USED}KB / ${MEM_TOTAL}KB (${MEM_PERCENT}%)"
  
  if [ "$MEM_PERCENT" -lt 80 ]; then
    test_result "内存使用正常" 0
  elif [ "$MEM_PERCENT" -lt 90 ]; then
    test_result "内存使用较高" 2
  else
    test_result "内存使用过高" 1
  fi
fi

# 9. 磁盘空间
log_info ""
log_info "检查磁盘空间..."

DISK_AVAILABLE=$(df / | tail -1 | awk '{print $4}')
DISK_TOTAL=$(df / | tail -1 | awk '{print $2}')
DISK_USED=$((DISK_TOTAL - DISK_AVAILABLE))
DISK_PERCENT=$((DISK_USED * 100 / DISK_TOTAL))

echo "  磁盘使用: ${DISK_USED}KB / ${DISK_TOTAL}KB (${DISK_PERCENT}%)"

if [ "$DISK_PERCENT" -lt 80 ]; then
  test_result "磁盘空间充足" 0
elif [ "$DISK_PERCENT" -lt 90 ]; then
  test_result "磁盘空间较紧张" 2
else
  test_result "磁盘空间严重不足" 1
fi

# 10. 网络连接
log_info ""
log_info "检查网络连接..."

if curl -s --connect-timeout 5 "https://changfengbox.top/api/mcp" >/dev/null 2>&1; then
  test_result "MCP 服务可连接" 0
else
  test_result "MCP 服务无法连接（网络问题或服务离线）" 2
fi

if curl -s --connect-timeout 5 "https://api.stepfun.com/v1/chat/completions" >/dev/null 2>&1; then
  test_result "Stepfun LLM 服务可连接" 0
else
  test_result "Stepfun 服务无法连接（网络问题或服务离线）" 2
fi

##############################################################################
# 总结
##############################################################################

log_info ""
log_info "============================================"
log_info "验证结果"
log_info "============================================"
echo ""
echo -e "${GREEN}通过: $TESTS_PASSED${NC}"
echo -e "${YELLOW}警告: $TESTS_WARNED${NC}"
echo -e "${RED}失败: $TESTS_FAILED${NC}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  log_success "部署验证成功！应用已就绪。"
  log_info ""
  log_info "后续步骤:"
  log_info "  1. 打开浏览器访问 http://localhost:3000"
  log_info "  2. 使用默认账户登录"
  log_info "  3. 创建新任务开始使用"
  exit 0
else
  log_error "部署验证失败，请检查上述错误。"
  log_info ""
  log_info "常见问题:"
  log_info "  - 应用未运行: docker compose up -d"
  log_info "  - 数据库未连接: 检查 .env 中的数据库配置"
  log_info "  - API 不可用: 查看 docker compose logs app"
  log_info ""
  log_info "详见: DEPLOYMENT_GUIDE.md"
  exit 1
fi
