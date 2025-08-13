# Mira Launcher 啟動腳本
# 使用 PowerShell 執行

Write-Host "正在啟動 Mira Launcher..." -ForegroundColor Green
Write-Host ""

# 檢查是否已安裝 Node.js
try {
    $nodeVersion = node --version
    Write-Host "檢測到 Node.js 版本: $nodeVersion" -ForegroundColor Yellow
}
catch {
    Write-Host "錯誤: 未找到 Node.js" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查是否已安裝依賴
if (-not (Test-Path "node_modules")) {
    Write-Host "正在安裝 NPM 依賴..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# 檢查 Rust 工具鏈
try {
    $cargoVersion = cargo --version
    Write-Host "檢測到 Cargo 版本: $cargoVersion" -ForegroundColor Yellow
}
catch {
    Write-Host "錯誤: 未找到 Cargo (Rust 工具鏈)" -ForegroundColor Red
    Write-Host "請先安裝 Rust: https://rustup.rs/" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查 Tauri CLI
$tauriCheck = npm list @tauri-apps/cli 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "正在安裝 Tauri CLI..." -ForegroundColor Yellow
    npm install @tauri-apps/cli --save-dev
    Write-Host ""
}

Write-Host "正在啟動開發環境..." -ForegroundColor Green
Write-Host "如果這是第一次運行，可能需要一些時間來編譯 Rust 代碼..." -ForegroundColor Cyan
Write-Host ""

# 啟動應用
try {
    npm run app:start
}
catch {
    Write-Host "啟動失敗: $_" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Read-Host "按 Enter 鍵退出"
