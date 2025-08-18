// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![cfg_attr(mobile, no_main)]

use tauri::Manager;

// 只在非移動端平台導入全局快捷鍵
#[cfg(all(debug_assertions, not(any(target_os = "android", target_os = "ios"))))]
use tauri_plugin_global_shortcut::GlobalShortcutExt;

// 打開開發者工具的命令
#[tauri::command]
fn open_devtools(window: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
        Ok(())
    }
    #[cfg(not(debug_assertions))]
    {
        Err("開發者工具僅在調試模式下可用".to_string())
    }
}

// 檢查是否為調試模式的命令
#[tauri::command]
fn is_debug_mode() -> bool {
    cfg!(debug_assertions)
}

// 啟動應用程式的命令
#[tauri::command]
fn launch_app(app_path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        let output = Command::new("cmd")
            .args(["/C", "start", &app_path])
            .output()
            .map_err(|e| format!("Failed to launch app: {}", e))?;

        if output.status.success() {
            Ok("App launched successfully".to_string())
        } else {
            Err(format!(
                "Failed to launch app: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        use std::process::Command;

        let output = Command::new("open")
            .arg(&app_path)
            .output()
            .map_err(|e| format!("Failed to launch app: {}", e))?;

        if output.status.success() {
            Ok("App launched successfully".to_string())
        } else {
            Err(format!(
                "Failed to launch app: {}",
                String::from_utf8_lossy(&output.stderr)
            ))
        }
    }
}

// 獲取系統資訊的命令
#[tauri::command]
fn get_system_info() -> String {
    format!("System: {}", std::env::consts::OS)
}

// 快速搜索结果数据结构
#[derive(Debug, serde::Deserialize, serde::Serialize)]
struct QuickSearchResult {
    #[serde(rename = "type")]
    result_type: String,
    title: String,
    description: String,
    icon: String,
    path: Option<String>,
    action: Option<String>,
    category: String,
}

// 处理快速搜索结果的命令
#[tauri::command]
async fn handle_quick_search_result(
    app: tauri::AppHandle,
    result: QuickSearchResult,
) -> Result<String, String> {
    println!("处理快速搜索结果: {:?}", result);

    match result.result_type.as_str() {
        "application" => {
            if let Some(path) = result.path {
                launch_app(path)
            } else {
                Err("应用路径不能为空".to_string())
            }
        }
        "function" => {
            if let Some(action) = result.action {
                handle_system_function(&app, &action).await
            } else {
                Err("功能动作不能为空".to_string())
            }
        }
        "file" => {
            // 文件将由前端使用opener插件处理
            Err("文件打开应由前端处理".to_string())
        }
        _ => Err(format!("未知的结果类型: {}", result.result_type)),
    }
}

// 处理系统功能
async fn handle_system_function(app: &tauri::AppHandle, action: &str) -> Result<String, String> {
    match action {
        "open-settings" => {
            if let Some(window) = app.get_webview_window("main") {
                window
                    .eval("window.location.hash = '#/settings'")
                    .map_err(|e| format!("导航到设置失败: {}", e))?;
                window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
                window
                    .set_focus()
                    .map_err(|e| format!("聚焦窗口失败: {}", e))?;
            }
            Ok("已打开设置".to_string())
        }
        "open-plugins" => {
            if let Some(window) = app.get_webview_window("main") {
                window
                    .eval("window.location.hash = '#/plugins'")
                    .map_err(|e| format!("导航到插件失败: {}", e))?;
                window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
                window
                    .set_focus()
                    .map_err(|e| format!("聚焦窗口失败: {}", e))?;
            }
            Ok("已打开插件管理".to_string())
        }
        "open-downloads" => {
            if let Some(window) = app.get_webview_window("main") {
                window
                    .eval("window.location.hash = '#/downloads'")
                    .map_err(|e| format!("导航到下载失败: {}", e))?;
                window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
                window
                    .set_focus()
                    .map_err(|e| format!("聚焦窗口失败: {}", e))?;
            }
            Ok("已打开下载管理".to_string())
        }
        "open-about" => {
            if let Some(window) = app.get_webview_window("main") {
                window
                    .eval("window.location.hash = '#/about'")
                    .map_err(|e| format!("导航到关于失败: {}", e))?;
                window.show().map_err(|e| format!("显示窗口失败: {}", e))?;
                window
                    .set_focus()
                    .map_err(|e| format!("聚焦窗口失败: {}", e))?;
            }
            Ok("已打开关于页面".to_string())
        }
        _ => Err(format!("未知的系统功能: {}", action)),
    }
}

// 执行系统命令
#[tauri::command]
fn execute_command(command: String, args: Vec<String>) -> Result<String, String> {
    use std::process::Command;

    println!("执行命令: {} {:?}", command, args);

    // 特殊处理Windows的start命令
    #[cfg(target_os = "windows")]
    {
        if command == "cmd" && args.len() >= 4 && args[1] == "start" {
            // 如果是 cmd /c start "" "path" 的形式，使用更简单的方法
            if let Some(file_path) = args.get(3) {
                // 去掉引号并使用PowerShell的Start-Process
                let cleaned_path = file_path.trim_matches('"');
                let output = Command::new("powershell")
                    .args([
                        "-Command",
                        &format!(
                            "Start-Process -FilePath '{}' -ErrorAction Stop",
                            cleaned_path.replace("'", "''")
                        ),
                    ])
                    .output()
                    .map_err(|e| format!("执行命令失败: {}", e))?;

                if output.status.success() {
                    Ok("命令执行成功".to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    if stderr.is_empty() {
                        Ok("命令执行成功".to_string())
                    } else {
                        Err(format!("命令执行失败: {}", stderr))
                    }
                }
            } else {
                // 回退到原始方法
                let output = Command::new(command)
                    .args(args)
                    .output()
                    .map_err(|e| format!("执行命令失败: {}", e))?;

                if output.status.success() {
                    Ok("命令执行成功".to_string())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    if stderr.is_empty() {
                        Ok("命令执行成功".to_string())
                    } else {
                        Err(format!("命令执行失败: {}", stderr))
                    }
                }
            }
        } else {
            // 普通命令
            let output = Command::new(command)
                .args(args)
                .output()
                .map_err(|e| format!("执行命令失败: {}", e))?;

            if output.status.success() {
                Ok("命令执行成功".to_string())
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                if stderr.is_empty() {
                    Ok("命令执行成功".to_string())
                } else {
                    Err(format!("命令执行失败: {}", stderr))
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new(command)
            .args(args)
            .output()
            .map_err(|e| format!("执行命令失败: {}", e))?;

        if output.status.success() {
            Ok("命令执行成功".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.is_empty() {
                Ok("命令执行成功".to_string())
            } else {
                Err(format!("命令执行失败: {}", stderr))
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init());

    // 只在非移動端平台添加全局快捷鍵插件
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());

    builder
        .invoke_handler(tauri::generate_handler![
            launch_app,
            get_system_info,
            open_devtools,
            is_debug_mode,
            handle_quick_search_result,
            execute_command
        ])
        .setup(|app| {
            // 設置應用程式標題 (僅在桌面平台)
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_title("Mira Launcher");

                    // 确保窗口完全透明
                    let _ = window.set_decorations(false);
                    #[cfg(target_os = "windows")]
                    {
                        // Windows 特定的阴影设置
                        let _ = window.set_shadow(false);
                    }
                }
            }

            // 註冊全局快捷鍵用於開發者工具 (僅在調試模式下且非移動端)
            #[cfg(all(debug_assertions, not(any(target_os = "android", target_os = "ios"))))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let global_shortcut = app.global_shortcut();

                    // 為 macOS 註冊 Cmd+Option+I
                    #[cfg(target_os = "macos")]
                    {
                        let window_clone = window.clone();
                        if let Err(e) = global_shortcut.on_shortcut("Cmd+Alt+I", move |_, _, _| {
                            window_clone.open_devtools();
                        }) {
                            eprintln!("Failed to register Cmd+Alt+I shortcut: {}", e);
                        }
                    }

                    // 為其他平台註冊 F12
                    #[cfg(not(target_os = "macos"))]
                    {
                        let window_clone = window.clone();
                        if let Err(e) = global_shortcut.on_shortcut("F12", move |_, _, _| {
                            window_clone.open_devtools();
                        }) {
                            eprintln!("Failed to register F12 shortcut: {}", e);
                        }
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub fn main() {
    run();
}
