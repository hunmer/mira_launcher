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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
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
            is_debug_mode
        ])
        .setup(|app| {
            // 設置應用程式標題 (僅在桌面平台)
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_title("Mira Launcher");
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
