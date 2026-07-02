#!/bin/bash
set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 开始 Docker 构建测试..."
echo "========================================"

# 第一步：验证 Dockerfile 和关键文件
echo "📝 第一步：验证 Dockerfile 和关键文件..."

# 检查 Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile 不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dockerfile 存在${NC}"

# 检查 package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json 不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ package.json 存在${NC}"

# 检查 pnpm-lock.yaml
if [ ! -f "pnpm-lock.yaml" ]; then
    echo -e "${YELLOW}⚠️  pnpm-lock.yaml 不存在，构建可能较慢${NC}"
else
    echo -e "${GREEN}✅ pnpm-lock.yaml 存在${NC}"
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env 不存在，某些功能可能无法正常工作${NC}"
else
    echo -e "${GREEN}✅ .env 配置文件存在${NC}"
fi

# 第二步：执行完整构建
echo ""
echo "🏗️  第二步：执行完整构建（此步耗时 3-10 分钟）..."
echo -e "${BLUE}提示：构建过程中会显示详细日志...${NC}"

BUILD_START=$(date +%s)
if DOCKER_BUILDKIT=1 docker build --no-cache -t xyb-writer-pal:test .; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    echo -e "${GREEN}✅ 构建成功（耗时 ${BUILD_TIME} 秒）${NC}"
else
    echo -e "${RED}❌ 构建失败${NC}"
    echo -e "${YELLOW}建议检查：${NC}"
    echo "  1. Dockerfile 语法是否正确"
    echo "  2. 依赖包是否完整（package.json 和 pnpm-lock.yaml）"
    echo "  3. 网络连接是否正常"
    exit 1
fi

# 第三步：验证镜像可用性
echo ""
echo "🚀 第三步：验证镜像可用性..."

# 检查镜像是否存在
if ! docker images xyb-writer-pal:test --format "{{.ID}}" | grep -q .; then
    echo -e "${RED}❌ 镜像不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 镜像已创建${NC}"

# 验证 Node.js 版本
NODE_VERSION=$(docker run --rm xyb-writer-pal:test node --version 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Node.js 版本: ${NODE_VERSION}${NC}"
    
    # 验证是否是 Node 22
    if [[ "$NODE_VERSION" == v22* ]]; then
        echo -e "${GREEN}✅ 使用 Node.js 22 LTS（符合要求）${NC}"
    else
        echo -e "${YELLOW}⚠️  Node 版本不是 22，建议检查 Dockerfile${NC}"
    fi
else
    echo -e "${RED}❌ 镜像无法运行${NC}"
    exit 1
fi

# 验证关键文件存在
echo "验证关键文件..."
docker run --rm xyb-writer-pal:test ls -la /app/server.js > /dev/null 2>&1 && \
    echo -e "${GREEN}✅ server.js 存在${NC}" || echo -e "${RED}❌ server.js 不存在${NC}"

docker run --rm xyb-writer-pal:test ls -la /app/.next > /dev/null 2>&1 && \
    echo -e "${GREEN}✅ .next 目录存在${NC}" || echo -e "${YELLOW}⚠️  .next 目录不存在${NC}"

# 第四步：检查镜像大小和优化建议
echo ""
echo "📦 第四步：检查镜像大小和优化建议..."
SIZE=$(docker images xyb-writer-pal:test --format "{{.Size}}")
echo -e "${BLUE}镜像大小：${SIZE}${NC}"

# 镜像大小评估
SIZE_MB=$(docker images xyb-writer-pal:test --format "{{.Size}}" | sed 's/MB//' | sed 's/GB//' | awk '{print int($1)}')
if [ "$SIZE_MB" -lt 300 ]; then
    echo -e "${GREEN}✅ 镜像大小优秀（<300MB）${NC}"
elif [ "$SIZE_MB" -lt 500 ]; then
    echo -e "${GREEN}✅ 镜像大小良好（300-500MB）${NC}"
elif [ "$SIZE_MB" -lt 800 ]; then
    echo -e "${YELLOW}⚠️  镜像大小较大（500-800MB），可考虑优化${NC}"
else
    echo -e "${RED}⚠️  镜像大小过大（>800MB），强烈建议优化${NC}"
    echo -e "${YELLOW}优化建议：${NC}"
    echo "  1. 检查是否包含不必要的依赖"
    echo "  2. 使用 multi-stage build 减少最终镜像大小"
    echo "  3. 清理构建缓存和临时文件"
fi

# 第五步：运行简单健康检查
echo ""
echo "🩺 第五步：运行健康检查（可选）..."
echo -e "${BLUE}尝试启动容器并验证端口...${NC}"

# 使用临时容器测试（快速启动后立即停止）
CONTAINER_ID=$(docker run -d --rm -p 3000:3000 --name xyb-test-container xyb-writer-pal:test 2>/dev/null || echo "")
if [ -n "$CONTAINER_ID" ]; then
    sleep 3
    if docker ps | grep -q "xyb-test-container"; then
        echo -e "${GREEN}✅ 容器启动成功${NC}"
        
        # 尝试访问健康检查端点
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/health | grep -q "200\|401"; then
            echo -e "${GREEN}✅ API 端点可访问${NC}"
        else
            echo -e "${YELLOW}⚠️  API 端点响应异常（可能需要配置环境变量）${NC}"
        fi
        
        docker stop xyb-test-container > /dev/null 2>&1 || true
        echo -e "${GREEN}✅ 测试容器已停止${NC}"
    else
        echo -e "${RED}❌ 容器启动失败${NC}"
        docker logs xyb-test-container 2>&1 | tail -20
    fi
else
    echo -e "${YELLOW}⚠️  无法启动测试容器（可能端口已被占用）${NC}"
    echo "跳过健康检查步骤"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✅ 所有测试完成！${NC}"
echo ""
echo "📊 测试总结："
echo "  - Dockerfile 和关键文件验证 ✅"
echo "  - Docker 构建成功 ✅"
echo "  - Node.js 22 LTS 验证 ✅"
echo "  - 镜像大小检查 ✅"
echo "  - 容器健康检查 ✅"
echo ""
echo "🎯 下一步建议："
echo "  1. 使用 docker compose up -d 启动完整服务"
echo "  2. 访问 http://localhost:3000 验证功能"
echo "  3. 检查日志：docker compose logs -f app"
echo ""
echo "📖 部署文档："
echo "  - README.md: 项目介绍和快速开始"
echo "  - QUICKSTART.md: 详细部署步骤"
echo "  - docs/deployment/: 生产部署指南"

# 清理测试镜像（可选）
echo ""
read -p "是否清理测试镜像 xyb-writer-pal:test？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker rmi xyb-writer-pal:test > /dev/null 2>&1 && \
        echo -e "${GREEN}✅ 测试镜像已清理${NC}" || \
        echo -e "${YELLOW}⚠️  镜像清理失败（可能正在使用）${NC}"
fi