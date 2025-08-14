# Mira Launcher APK Builder - PowerShell版本
param(
    [string]$AndroidHome = "D:\android",
    [string]$NdkHome = "D:\android\ndk\27.0.12077973",
    [SecureString]$KeystorePassword,
    [switch]$SkipBuild = $false,
    [switch]$Help = $false
)

# 显示帮助信息
if ($Help) {
    Write-Host @"
Mira Launcher APK Builder

用法: .\apk.ps1 [参数]

参数:
  -AndroidHome <路径>     Android SDK路径 (默认: D:\android)
  -NdkHome <路径>         Android NDK路径 (默认: D:\android\ndk\27.0.12077973)
  -KeystorePassword <密码> Keystore密码 (如果为空则会提示输入)
  -SkipBuild              跳过前端构建步骤
  -Help                   显示此帮助信息

示例:
  .\apk.ps1
  .\apk.ps1 -AndroidHome "C:\Android\Sdk" -SkipBuild
"@
    exit 0
}

# 函数：检查文件或目录是否存在
function Test-PathExists {
    param([string]$Path, [string]$Description)
    
    if (!(Test-Path $Path)) {
        Write-Host "❌ 错误: $Description 不存在: $Path" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ $Description 存在: $Path" -ForegroundColor Green
}

# 函数：获取文件大小（MB）
function Get-FileSizeMB {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $size = (Get-Item $FilePath).Length / 1MB
        return [math]::Round($size, 2)
    }
    return 0
}

# 函数：运行命令并检查结果
function Invoke-CommandSafe {
    param([string]$Command, [string]$Description)
    
    Write-Host "🔄 $Description..." -ForegroundColor Yellow
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "命令执行失败，退出代码: $LASTEXITCODE"
        }
        Write-Host "✅ $Description 完成" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 错误: $Description 失败" -ForegroundColor Red
        Write-Host "错误详情: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 主函数
function Main {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    Mira Launcher APK Builder" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # 设置环境变量
    $env:ANDROID_HOME = $AndroidHome
    $env:NDK_HOME = $NdkHome
    
    Write-Host "📱 Android配置:" -ForegroundColor Yellow
    Write-Host "   ANDROID_HOME: $AndroidHome"
    Write-Host "   NDK_HOME: $NdkHome"
    Write-Host ""

    # 验证路径
    Test-PathExists $AndroidHome "Android SDK"
    Test-PathExists $NdkHome "Android NDK"
    
    # 检查构建工具
    $buildToolsPath = Join-Path $AndroidHome "build-tools\34.0.0"
    Test-PathExists $buildToolsPath "Build Tools"
    
    $keytoolPath = Join-Path $buildToolsPath "keytool.exe"
    $apksignerPath = Join-Path $buildToolsPath "apksigner.bat"
    
    Test-PathExists $keytoolPath "Keytool"
    Test-PathExists $apksignerPath "APK Signer"

    # 创建keystore（如果不存在）
    $keystorePath = Join-Path $PSScriptRoot "release-key.keystore"
    $passwordText = ""
    
    if (!(Test-Path $keystorePath)) {
        Write-Host "🔑 创建新的keystore文件..." -ForegroundColor Yellow
        
        if ($null -eq $KeystorePassword) {
            $KeystorePassword = Read-Host "请输入keystore密码" -AsSecureString
        }
        $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($KeystorePassword))
        
        $keystoreCmd = "`"$keytoolPath`" -genkey -v -keystore `"$keystorePath`" -alias release-key -keyalg RSA -keysize 2048 -validity 10000 -storepass `"$passwordText`" -keypass `"$passwordText`" -dname `"CN=MiraLauncher, OU=Development, O=MiraLauncher, L=City, S=State, C=CN`""
        Invoke-CommandSafe $keystoreCmd "创建Keystore"
    }
    else {
        Write-Host "✅ Keystore文件已存在: $keystorePath" -ForegroundColor Green
        
        if ($null -eq $KeystorePassword) {
            $KeystorePassword = Read-Host "请输入keystore密码" -AsSecureString
        }
        $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($KeystorePassword))
    }

    # 构建前端（如果未跳过）
    if (!$SkipBuild) {
        Invoke-CommandSafe "npm run build" "前端构建"
    }
    else {
        Write-Host "⏭️  跳过前端构建" -ForegroundColor Yellow
    }

    # 构建Android APK
    Invoke-CommandSafe "cargo tauri android build --release" "Android APK构建"

    # 准备签名目录
    $signedApkDir = Join-Path $PSScriptRoot "signed-apks"
    if (!(Test-Path $signedApkDir)) {
        New-Item -ItemType Directory -Path $signedApkDir | Out-Null
    }

    # 查找并签名APK文件
    $apkDir = Join-Path $PSScriptRoot "src-tauri\gen\android\app\build\outputs\apk"
    $architectures = @("arm64-v8a", "armeabi-v7a")
    $signedApks = @()

    Write-Host ""
    Write-Host "🔏 开始签名APK文件..." -ForegroundColor Yellow

    foreach ($arch in $architectures) {
        $archDir = Join-Path $apkDir "$arch\release"
        $unsignedApk = Join-Path $archDir "app-$arch-release-unsigned.apk"
        $signedApk = Join-Path $signedApkDir "app-$arch-release-signed.apk"
        
        if (Test-Path $unsignedApk) {
            Write-Host "   📝 签名 $arch 架构的APK..." -ForegroundColor Cyan
            
            $signCmd = "`"$apksignerPath`" sign --ks `"$keystorePath`" --ks-key-alias release-key --ks-pass pass:`"$passwordText`" --key-pass pass:`"$passwordText`" --out `"$signedApk`" `"$unsignedApk`""
            
            try {
                Invoke-Expression $signCmd
                if ($LASTEXITCODE -eq 0) {
                    $size = Get-FileSizeMB $signedApk
                    Write-Host "   ✅ $arch 架构APK签名成功 ($size MB)" -ForegroundColor Green
                    $signedApks += @{Path = $signedApk; Arch = $arch; Size = $size }
                }
                else {
                    Write-Host "   ❌ $arch 架构APK签名失败" -ForegroundColor Red
                }
            }
            catch {
                Write-Host "   ❌ $arch 架构APK签名失败: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        else {
            Write-Host "   ⚠️  未找到 $arch 架构的未签名APK文件" -ForegroundColor Yellow
        }
    }

    # 检查Universal APK（如果存在）
    $universalApk = Join-Path $apkDir "universal\release\app-universal-release-unsigned.apk"
    $signedUniversalApk = Join-Path $signedApkDir "app-universal-release-signed.apk"
    
    if (Test-Path $universalApk) {
        Write-Host "   📝 签名Universal APK..." -ForegroundColor Cyan
        
        $signCmd = "`"$apksignerPath`" sign --ks `"$keystorePath`" --ks-key-alias release-key --ks-pass pass:`"$passwordText`" --key-pass pass:`"$passwordText`" --out `"$signedUniversalApk`" `"$universalApk`""
        
        try {
            Invoke-Expression $signCmd
            if ($LASTEXITCODE -eq 0) {
                $size = Get-FileSizeMB $signedUniversalApk
                Write-Host "   ✅ Universal APK签名成功 ($size MB)" -ForegroundColor Green
                $signedApks += @{Path = $signedUniversalApk; Arch = "universal"; Size = $size }
            }
            else {
                Write-Host "   ❌ Universal APK签名失败" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "   ❌ Universal APK签名失败: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    # 显示结果
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "🎉 APK构建和签名完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📦 签名的APK文件:" -ForegroundColor Yellow
    
    if ($signedApks.Count -gt 0) {
        foreach ($apk in $signedApks) {
            $fileName = Split-Path $apk.Path -Leaf
            Write-Host "   📱 $fileName ($($apk.Arch)): $($apk.Size) MB" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "📁 文件位置: $signedApkDir" -ForegroundColor Cyan
        
        # 体积优化提示
        $maxSize = ($signedApks | Measure-Object -Property Size -Maximum).Maximum
        if ($maxSize -gt 30) {
            Write-Host ""
            Write-Host "💡 APK体积优化建议:" -ForegroundColor Yellow
            Write-Host "   - 当前APK较大 ($maxSize MB)，建议使用架构分包版本" -ForegroundColor Yellow
            Write-Host "   - arm64-v8a APK适用于现代64位设备（推荐）" -ForegroundColor Yellow
            Write-Host "   - armeabi-v7a APK适用于旧32位设备" -ForegroundColor Yellow
        }
        else {
            Write-Host ""
            Write-Host "✅ APK体积优化良好！($maxSize MB)" -ForegroundColor Green
        }
    }
    else {
        Write-Host "❌ 没有成功签名的APK文件" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "🚀 构建完成！可以安装测试了。" -ForegroundColor Green
}

# 运行主函数
Main
