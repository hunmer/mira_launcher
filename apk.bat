@echo off
chcp 65001
setlocal enabledelayedexpansion
echo ========================================
echo Mira Launcher APK Builder
echo ========================================

:: 设置Android环境变量
set ANDROID_HOME=D:\android
set NDK_HOME=D:\android\ndk\27.0.12077973
set KEYTOOL=D:\jdk-21.0.2\bin\keytool.exe

:: 验证Android SDK和NDK是否存在
if not exist "%ANDROID_HOME%" (
    echo 错误: Android SDK 路径不存在: %ANDROID_HOME%
    pause
    exit /b 1
)

if not exist "%NDK_HOME%" (
    echo 错误: Android NDK 路径不存在: %NDK_HOME%
    pause
    exit /b 1
)

:: 创建keystore文件（如果不存在）
set KEYSTORE_PATH=%~dp0release-key.keystore
if not exist "%KEYSTORE_PATH%" (
    echo 创建新的keystore文件...
    "%KEYTOOL%" -genkey -v -keystore "%KEYSTORE_PATH%" -alias release-key -keyalg RSA -keysize 2048 -validity 10000
    if errorlevel 1 (
        echo 错误: 创建keystore失败
        pause
        exit /b 1
    )
)

echo.
echo 开始构建前端资源...
call npm run build
if errorlevel 1 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)

echo.
echo 开始构建Android APK...

:: 设置签名APK目录
set SIGNED_APK_DIR=%~dp0signed-apks

:: 创建签名APK目录
if not exist "%SIGNED_APK_DIR%" mkdir "%SIGNED_APK_DIR%"

:: 遍历构建不同架构的APK
for %%t in (aarch64 armv7) do (
    echo.
    echo 正在构建 %%t 架构的APK...
    cargo tauri android build --target %%t
    if errorlevel 1 (
        echo 错误: %%t 架构Android构建失败
        pause
        exit /b 1
    )
    
    :: 根据架构定义不同的APK文件路径
    if "%%t"=="aarch64" (
        set "UNSIGNED_APK=%~dp0src-tauri\gen\android\app\build\outputs\apk\aarch64\release\app-aarch64-release-unsigned.apk"
    ) else if "%%t"=="armv7" (
        set "UNSIGNED_APK=%~dp0src-tauri\gen\android\app\build\outputs\apk\armv7\release\app-armv7-release-unsigned.apk"
    )
    set "SIGNED_APK=!SIGNED_APK_DIR!\app-%%t-release-signed.apk"
    
    if exist "!UNSIGNED_APK!" (
        echo 签名 %%t 架构的APK...
        "%ANDROID_HOME%\build-tools\34.0.0\apksigner" sign --ks "%KEYSTORE_PATH%" --ks-key-alias release-key --out "!SIGNED_APK!" "!UNSIGNED_APK!"
        if errorlevel 1 (
            echo 错误: %%t 架构APK签名失败
        ) else (
            echo ✓ %%t 架构APK签名成功: !SIGNED_APK!
            :: 删除未签名的APK文件以准备下一次构建
            del "!UNSIGNED_APK!"
        )
    ) else (
        echo 警告: 未找到 %%t 架构的未签名APK文件: !UNSIGNED_APK!
    )
)

echo.
echo ========================================
echo APK构建和签名完成！
echo.
echo 签名的APK文件位置：
dir "%SIGNED_APK_DIR%\*.apk" /b 2>nul
echo.
echo APK文件大小：
for %%f in ("%SIGNED_APK_DIR%\*.apk") do (
    call :GetFileSize "%%f" size
    echo %%~nxf: !size! MB
)
echo ========================================

pause
exit /b 0

:GetFileSize
set file=%~1
for %%A in (%file%) do set size=%%~zA
set /a size=%size%/1024/1024
set %~2=%size%
goto :eof
