// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// 打開開發者工具的命令
#[tauri::command]
fn open_devtools(window: tauri::Window) -> Result<(), String> {
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
            Err(format!("Failed to launch app: {}", String::from_utf8_lossy(&output.stderr)))
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
            Err(format!("Failed to launch app: {}", String::from_utf8_lossy(&output.stderr)))
        }
    }
}

// 獲取系統資訊的命令
#[tauri::command]
fn get_system_info() -> String {
    format!("System: {}", std::env::consts::OS)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            launch_app, 
            get_system_info, 
            open_devtools, 
            is_debug_mode
        ])
        .setup(|app| {
            // 設置應用程式標題
            let window = app.get_window("main").unwrap();
            window.set_title("Mira Launcher").unwrap();
            
            // 註冊全局快捷鍵用於開發者工具 (僅在調試模式下)
            #[cfg(debug_assertions)]
            {
                use tauri::GlobalShortcutManager;
                let mut shortcut_manager = app.global_shortcut_manager();
                
                // 為 macOS 註冊 Cmd+Option+I
                #[cfg(target_os = "macos")]
                {
                    let window_clone = window.clone();
                    if let Err(e) = shortcut_manager.register("Cmd+Alt+I", move || {
                        window_clone.open_devtools();
                    }) {
                        eprintln!("Failed to register Cmd+Alt+I shortcut: {}", e);
                    }
                }
                
                // 為其他平台註冊 F12
                #[cfg(not(target_os = "macos"))]
                {
                    let window_clone = window.clone();
                    if let Err(e) = shortcut_manager.register("F12", move || {
                        window_clone.open_devtools();
                    }) {
                        eprintln!("Failed to register F12 shortcut: {}", e);
                    }
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
