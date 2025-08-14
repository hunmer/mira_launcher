#!/bin/bash

# Mira Launcher 开发环境启动脚本

echo "🚀 启动 Mira Launcher 开发环境..."

# 检查是否安装了必要的依赖
check_dependencies() {
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    echo "📦 检查并安装依赖..."
    
    # 安装前端依赖
    if [ ! -d "node_modules" ]; then
        echo "📦 安装前端依赖..."
        npm install
    fi
    
    # 安装后端依赖
    if [ ! -d "server/node_modules" ]; then
        echo "📦 安装后端依赖..."
        cd server
        npm install
        cd ..
    fi
}

# 启动服务
start_services() {
    echo "🌐 启动服务..."
    
    # 启动后端服务器
    echo "🔧 启动插件服务器 (端口 3001)..."
    cd server
    npm start &
    SERVER_PID=$!
    cd ..
    
    # 等待服务器启动
    sleep 3
    
    # 启动前端开发服务器
    echo "🎨 启动前端开发服务器 (端口 1420)..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo "✅ 所有服务已启动！"
    echo "🌐 前端地址: http://localhost:1420"
    echo "🔧 API地址: http://localhost:3001/api"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    
    # 等待用户中断
    wait
}

# 清理函数
cleanup() {
    echo ""
    echo "🔄 正在停止服务..."
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ 插件服务器已停止"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务器已停止"
    fi
    
    echo "👋 再见！"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 主流程
main() {
    check_dependencies
    install_dependencies
    start_services
}

# 运行主函数
main
