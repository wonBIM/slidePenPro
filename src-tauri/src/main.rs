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

fn get_gemini_key_from_file() -> Option<String> {
  if let Ok(key) = std::env::var("GEMINI_API_KEY") {
    let key_trimmed = key.trim().to_string();
    if !key_trimmed.is_empty() {
      let len = key_trimmed.len();
      let prefix = if len >= 6 { &key_trimmed[0..6] } else { "" };
      let suffix = if len >= 4 { &key_trimmed[len-4..len] } else { "" };
      println!("[Rust Backend] Loaded GEMINI_API_KEY env: len={}, prefix='{}...', suffix='...{}'", len, prefix, suffix);
      return Some(key_trimmed);
    }
  }

  if let Ok(home) = std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
    let mut path = std::path::PathBuf::from(home);
    path.push(".slidepenpro");
    path.push("gemini.key");
    if path.exists() {
      if let Ok(content) = std::fs::read_to_string(path) {
        let key_trimmed = content.trim().to_string();
        if !key_trimmed.is_empty() {
          return Some(key_trimmed);
        }
      }
    }
  }
  
  if let Ok(appdata) = std::env::var("LOCALAPPDATA") {
    let mut path = std::path::PathBuf::from(appdata);
    path.push("slidepro");
    path.push("gemini.key");
    if path.exists() {
      if let Ok(content) = std::fs::read_to_string(path) {
        let key_trimmed = content.trim().to_string();
        if !key_trimmed.is_empty() {
          return Some(key_trimmed);
        }
      }
    }
  }
  
  None
}

#[tauri::command]
async fn call_gemini_api(
  action: String,
  base64_image: Option<String>,
  prompt: Option<String>,
) -> Result<String, String> {
  println!("[Rust Backend] call_gemini_api invoked! Action: {}, Prompt: {:?}", action, prompt);
  let api_key = get_gemini_key_from_file().ok_or_else(|| {
    let err = "Gemini API key not found. Please set the GEMINI_API_KEY environment variable or save your key in C:\\Users\\<username>\\.slidepenpro\\gemini.key".to_string();
    println!("[Rust Backend] Error: {}", err);
    err
  })?;

  let client = reqwest::Client::new();

  if action == "vision" {
    let img_base64 = base64_image.ok_or("Missing base64_image parameter for vision analysis")?;
    let user_hint = prompt.unwrap_or_default();
    
    let url = format!(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
      api_key
    );

    let system_instruction = "이 이미지는 사용자가 칠판에 손으로 그린 간단한 스케치 낙서입니다. 무엇을 그렸는지 판독해 주세요. 답변은 반드시 한국어 단어와 괄호 속의 영어 번역 형태로 출력해 주세요. 예: '비행기 (Airplane)'. 설명이나 문장 없이 반드시 이 양식만 단 한 줄로 반환해 주세요. 만약 무엇인지 전혀 판독할 수 없다면 사용자가 입력한 힌트 단어를 활용해 비슷한 결과로 유추해 반환하세요. 힌트 단어: ";
    let full_prompt = format!("{}{}", system_instruction, user_hint);

    let payload = serde_json::json!({
      "contents": [
        {
          "parts": [
            { "text": full_prompt },
            {
              "inlineData": {
                "mimeType": "image/png",
                "data": img_base64
              }
            }
          ]
        }
      ]
    });

    let resp = client.post(&url)
      .json(&payload)
      .send()
      .await
      .map_err(|e| format!("Gemini Vision request failed: {}", e))?;

    if !resp.status().is_success() {
      let status = resp.status();
      let err_txt = resp.text().await.unwrap_or_default();
      
      let mut debug_info = String::new();
      let test_url = format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", api_key);
      if let Ok(test_resp) = client.get(&test_url).send().await {
        if let Ok(txt) = test_resp.text().await {
          debug_info = format!("\n[Available Models Debug]: {}", txt);
        }
      }
      return Err(format!("Gemini Vision API returned error status {}: {}{}", status, err_txt, debug_info));
    }

    let res_json: serde_json::Value = resp.json()
      .await
      .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let text = res_json["candidates"][0]["content"]["parts"][0]["text"]
      .as_str()
      .ok_or("Unexpected response structure from Gemini Vision API")?
      .trim()
      .to_string();

    Ok(text)
  } else if action == "generate" {
    let pmt = prompt.ok_or("Missing prompt parameter for image generation")?;
    let url = format!(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={}",
      api_key
    );

    let payload = serde_json::json!({
      "instances": [
        { "prompt": pmt }
      ],
      "parameters": {
        "sampleCount": 1,
        "aspectRatio": "1:1",
        "outputMimeType": "image/png"
      }
    });

    let resp = client.post(&url)
      .json(&payload)
      .send()
      .await
      .map_err(|e| format!("Gemini Imagen request failed: {}", e))?;

    if !resp.status().is_success() {
      let status = resp.status();
      let err_txt = resp.text().await.unwrap_or_default();
      return Err(format!("Gemini Imagen API returned error status {}: {}", status, err_txt));
    }

    let res_json: serde_json::Value = resp.json()
      .await
      .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    let img_bytes = res_json["predictions"][0]["bytesBase64Encoded"]
      .as_str()
      .ok_or("Unexpected response structure from Gemini Imagen API")?
      .trim()
      .to_string();

    Ok(format!("data:image/png;base64,{}", img_bytes))
  } else {
    Err(format!("Unknown action type: {}", action))
  }
}

fn main() {
  dotenvy::dotenv().ok();
  tauri::Builder::default()
    .setup(|app| {
      let window = app.get_window("main").unwrap();
      println!("SlidePro Backend: Window object successfully initialized.");
      
      #[cfg(target_os = "windows")]
      {
        use winapi::shared::windef::HWND;
        
        if let Ok(hwnd) = window.hwnd() {
          let _hwnd_raw = hwnd.0 as HWND;
          println!("SlidePro Backend: HWND handle acquired.");
        }
      }

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      set_ignore_mouse_events,
      send_key_to_ppt,
      call_gemini_api
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
