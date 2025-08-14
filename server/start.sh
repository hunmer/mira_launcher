#!/bin/bash

# Mira Launcher 插件服务器启动脚本

echo "🚀 启动 Mira Launcher 插件服务器..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查端口是否被占用
PORT=${PORT:-3001}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，正在尝试使用其他端口..."
    PORT=$((PORT + 1))
fi

# 进入服务器目录
cd "$(dirname "$0")"

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 确保必要目录存在
mkdir -p plugins uploads

# 启动服务器
echo "🌐 服务器启动在端口 $PORT"
echo "📂 插件目录: $(pwd)/plugins"
echo "📝 访问 API: http://localhost:$PORT/api"
echo ""
echo "按 Ctrl+C 停止服务器"

PORT=$PORT node index.js
