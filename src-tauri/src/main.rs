// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

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
        .invoke_handler(tauri::generate_handler![launch_app, get_system_info])
        .setup(|app| {
            // 設置應用程式標題
            let window = app.get_window("main").unwrap();
            window.set_title("Mira Launcher").unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
