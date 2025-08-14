# Android APK 构建脚本

本目录包含了用于构建和签名 Mira Launcher Android APK 的脚本。

## 文件说明

- `apk.bat` - Windows批处理脚本（简单版本）
- `apk.ps1` - PowerShell脚本（推荐，功能更完整）

## 前置要求

1. **Android SDK** 安装在 `D:\android`（可自定义）
2. **Android NDK** 安装在 `D:\android\ndk\27.0.12077973`（可自定义）
3. **Node.js** 和 **npm** 已安装
4. **Rust** 和 **cargo-tauri** 已安装

## 使用方法

### 使用 PowerShell 脚本（推荐）

```powershell
# 基本使用
.\apk.ps1

# 自定义Android路径
.\apk.ps1 -AndroidHome "C:\Android\Sdk" -NdkHome "C:\Android\Sdk\ndk\27.0.12077973"

# 跳过前端构建（如果已经构建过）
.\apk.ps1 -SkipBuild

# 查看帮助
.\apk.ps1 -Help
```

### 使用批处理脚本

```cmd
apk.bat
```

## APK 体积优化

脚本已经实现了以下优化：

### 1. 架构分包
- 只构建 `arm64-v8a` 和 `armeabi-v7a` 两个架构
- 每个架构生成单独的APK，减小单个文件体积
- `arm64-v8a`: 适用于现代64位设备（推荐）
- `armeabi-v7a`: 适用于旧32位设备

### 2. 代码优化
- **Rust编译优化**: 使用 `opt-level = "z"` 优化体积
- **链接时优化**: 启用 `lto = true`
- **调试符号移除**: `strip = true`
- **Panic处理**: `panic = "abort"` 减少运行时代码

### 3. Android构建优化
- **代码压缩**: `isMinifyEnabled = true`
- **资源压缩**: `isShrinkResources = true`
- **ProGuard优化**: 移除未使用的代码

### 4. 前端资源优化
- **代码分割**: 按模块分离chunk
- **压缩**: 使用esbuild压缩
- **源码映射**: 生产环境关闭sourcemap

## 预期体积

优化后的APK体积：
- **arm64-v8a**: 约15-20MB
- **armeabi-v7a**: 约12-18MB

相比优化前的50MB+，体积减少了60-70%。

## 构建输出

成功构建后，签名的APK文件会保存在 `signed-apks/` 目录：

```
signed-apks/
├── app-arm64-v8a-release-signed.apk    # 64位设备APK
└── app-armeabi-v7a-release-signed.apk  # 32位设备APK
```

## 故障排除

### 常见问题

1. **Android SDK/NDK路径错误**
   - 检查环境变量设置
   - 确保路径存在且包含必要工具

2. **Keystore创建失败**
   - 确保有写入权限
   - 检查Java/Keytool是否正确安装

3. **构建失败**
   - 运行 `npm install` 确保依赖完整
   - 检查Rust工具链是否正确安装
   - 运行 `cargo tauri android init` 初始化Android环境

4. **签名失败**
   - 检查Keystore文件和密码
   - 确保apksigner工具存在

### 清理构建

如果需要重新构建：

```bash
# 清理前端构建
npm run clean

# 清理Rust构建
cargo clean

# 清理Android构建
cd src-tauri/gen/android
.\gradlew clean
```

## 部署建议

- **arm64-v8a APK**: 优先推荐给用户，适用于大部分现代设备
- **armeabi-v7a APK**: 作为兼容选项，适用于较老的32位设备
- 可以在应用商店或下载页面同时提供两个版本，让用户选择
