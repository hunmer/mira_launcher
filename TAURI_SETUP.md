# Mira Launcher - Tauri 启动配置指南

## 📋 系统要求

### 必需依赖
1. **Node.js** (推荐 v18 或更高版本)
   - 下载地址: https://nodejs.org/
   
2. **Rust 工具链**
   - 下载地址: https://rustup.rs/
   - 安装命令: `winget install Rustlang.Rustup`

3. **Microsoft C++ Build Tools** (Windows 用户)
   - 下载地址: https://visualstudio.microsoft.com/visual-cpp-build-tools/

## 🚀 快速启动

### 方法一：使用启动脚本
```bash
# Windows CMD
start-app.bat

# PowerShell
.\start-app.ps1
```

### 方法二：使用 NPM 脚本
```bash
# 开发模式启动 Tauri 应用
npm run app:start

# 等同于
npm run tauri:dev

# 调试模式启动
npm run tauri:dev:debug
```

### 方法三：使用 VS Code 任务
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Tasks: Run Task"
3. 选择以下任务之一：
   - `app:start` - 启动 Tauri 应用
   - `tauri:dev` - Tauri 开发模式
   - `tauri:dev:debug` - Tauri 调试模式

## 🔧 配置说明

### Tauri 配置 (tauri.conf.json)
- ✅ 启用了应用启动权限 (`shell.execute`)
- ✅ 配置了文件系统访问权限
- ✅ 启用了窗口管理功能
- ✅ 配置了全局快捷键支持
- ✅ 启用了通知功能

### 应用窗口设置
- 窗口大小: 900x650 (最小 800x600)
- 无边框设计 (`decorations: false`)
- 支持文件拖放
- 居中显示

### 构建配置
```json
{
  "beforeDevCommand": "npm run dev",
  "beforeBuildCommand": "npm run build",
  "devPath": "http://localhost:1420",
  "distDir": "../dist"
}
```

## 📦 构建选项

### 开发构建
```bash
npm run app:start      # 启动开发模式
npm run tauri:dev      # 标准开发模式
npm run tauri:dev:debug # 调试模式
```

### 生产构建
```bash
npm run app:build           # MSI 安装包
npm run app:build:portable  # NSIS 便携版
npm run tauri:build         # 所有格式
```

## 🐛 调试功能

### VS Code 调试配置
- `Debug Tauri App` - 调试 Rust 后端
- `Launch Tauri App` - 启动应用
- `Debug Tauri Frontend` - 调试前端 Vue 应用

### 环境变量
- `RUST_LOG=debug` - 启用 Rust 调试日志
- `TAURI_DEBUG=true` - 启用 Tauri 调试模式

## 🔍 故障排除

### 常见问题

1. **Cargo 未找到**
   ```bash
   # 安装 Rust
   winget install Rustlang.Rustup
   # 或访问 https://rustup.rs/
   ```

2. **编译错误**
   ```bash
   # 清理缓存
   npm run clean:tauri
   npm run clean
   npm install
   ```

3. **权限问题**
   - 以管理员身份运行 PowerShell
   - 设置执行策略: `Set-ExecutionPolicy RemoteSigned`

### 日志查看
- Tauri 日志: `%APPDATA%\com.miralauncher.app\logs\`
- 开发者工具: 按 F12 (仅开发模式)

## 📚 相关命令

| 命令 | 说明 |
|------|------|
| `npm run app:start` | 启动 Tauri 应用 |
| `npm run app:build` | 构建 MSI 安装包 |
| `npm run tauri:dev:debug` | 调试模式启动 |
| `npm run clean:tauri` | 清理 Tauri 构建缓存 |
| `tauri info` | 显示环境信息 |

更多信息请参考: https://tauri.app/
