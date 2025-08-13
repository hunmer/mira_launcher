@echo off
echo 正在啟動 Mira Launcher...
echo.

REM 檢查是否已安裝依賴
if not exist "node_modules" (
    echo 正在安裝依賴...
    call npm install
    echo.
)

REM 檢查 Rust 工具鏈
where cargo >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 錯誤: 未找到 Cargo (Rust 工具鏈)
    echo 請先安裝 Rust: https://rustup.rs/
    pause
    exit /b 1
)

REM 檢查 Tauri CLI
call npm list @tauri-apps/cli >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 正在安裝 Tauri CLI...
    call npm install @tauri-apps/cli --save-dev
    echo.
)

echo 正在啟動開發環境...
echo 如果這是第一次運行，可能需要一些時間來編譯 Rust 代碼...
echo.

call npm run app:start

pause
