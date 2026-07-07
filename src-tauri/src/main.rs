#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;

// command to toggle mouse event passthrough (click-through) via Win32 API
#[tauri::command]
fn set_ignore_mouse_events(window: tauri::Window, ignore: bool) {
  #[cfg(target_os = "windows")]
  {
    use winapi::shared::windef::HWND;
    use winapi::um::winuser::{GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, WS_EX_TRANSPARENT};

    if let Ok(hwnd) = window.hwnd() {
      // Cast the raw OS handle (hwnd.0) to winapi HWND pointer
      let hwnd_raw = hwnd.0 as HWND;
      unsafe {
        let ex_style = GetWindowLongW(hwnd_raw, GWL_EXSTYLE);
        let new_style = if ignore {
          ex_style | (WS_EX_TRANSPARENT as i32)
        } else {
          ex_style & !(WS_EX_TRANSPARENT as i32)
        };
        SetWindowLongW(hwnd_raw, GWL_EXSTYLE, new_style);
      }
    }
  }
}

// command to send keystroke messages (Arrow keys) directly to PPT window in background
#[tauri::command]
fn send_key_to_ppt(key_type: String) {
  #[cfg(target_os = "windows")]
  {
    use winapi::um::winuser::{FindWindowW, PostMessageW, WM_KEYDOWN, WM_KEYUP, VK_LEFT, VK_RIGHT};
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    // Typically PowerPoint Slide Show window has a class name "PP12FrameClass"
    unsafe {
      let class_name: Vec<u16> = OsStr::new("PP12FrameClass")
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
      
      let hwnd = FindWindowW(class_name.as_ptr(), std::ptr::null() as *const u16);
      if !hwnd.is_null() {
        let vk_code = match key_type.as_str() {
          "left" => VK_LEFT,
          "right" => VK_RIGHT,
          _ => 0,
        };

        if vk_code != 0 {
          // Post messages to background window without stealing system focus
          PostMessageW(hwnd, WM_KEYDOWN, vk_code as usize, 0);
          PostMessageW(hwnd, WM_KEYUP, vk_code as usize, 0);
        }
      }
    }
  }
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // Get the main window handler
      let window = app.get_window("main").unwrap();
      println!("SlidePro Backend: Window object successfully initialized.");
      
      // On Windows, initialize DPI awareness and window layer attributes if necessary
      #[cfg(target_os = "windows")]
      {
        use winapi::shared::windef::HWND;
        
        // Initial setup: window starts always-on-top, but NOT click-through
        if let Ok(hwnd) = window.hwnd() {
          let _hwnd_raw = hwnd.0 as HWND;
          println!("SlidePro Backend: HWND handle acquired.");
        }
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      set_ignore_mouse_events,
      send_key_to_ppt
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
