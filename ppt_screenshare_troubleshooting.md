# 🖥️ 파워포인트 화면 공유 및 백그라운드 제어 트러블슈팅 가이드

본 문서는 SlidePro 애플리케이션의 파워포인트(PPT) 화면 공유 기능 시 발생했던 **검은 화면(Black Screen) 문제**와 **백그라운드 슬라이드 제어(방향키 연동) 오류**의 기술적 원인 및 최종 해결책을 기록하여, 추후 유사한 문제가 재발했을 때 대처하기 위한 기술 명세서입니다.

---

## 1. 이슈 A: 화면 공유 시 검은 화면(Black Screen)만 출력되는 현상

### 🔴 현상
집 노트북 또는 회사 PC에서 전체 화면(모니터 1)을 공유 대상으로 올바르게 선택했음에도 불구하고, 화면 공유 영역(비디오 컨테이너)이 회색 테두리 내부에 완전한 검은색으로만 렌더링되고 실제 바탕화면 픽셀이 노출되지 않음.

### 🔍 기술적 원인

1. **하드웨어 그래픽 가속 충돌 및 크로스 GPU 버그**
   * 파워포인트 슬라이드쇼는 성능 극대화를 위해 그래픽 카드(GPU)의 Direct3D 하드웨어 가속을 사용해 독립된 화면 버퍼를 채웁니다.
   * Tauri 앱(WebView2 = Edge Chromium 엔진) 내부에서 `getDisplayMedia`로 화면을 캡처할 때, 특히 내장 GPU(바탕화면)와 외장 GPU(Tauri 앱 구동)가 다른 하이브리드 그래픽 환경에서 화면의 프레임 데이터를 복사해오지 못하고 0x0 크기의 빈 검은 버퍼만 가져오는 현상이 일어납니다.
2. **Windows Graphics Capture (WGC) API 한계**
   * Chromium 기반 브라우저 엔진이 최신 Windows 환경에서 화면을 공유할 때 사용하는 WGC API가 일부 그래픽 드라이버 환경에서 화면 픽셀 데이터를 정상 송출하지 못하고 검은 화면을 유발합니다.
3. **React 비동기 렌더링 라이프사이클 마찰 (핵심 원인)**
   * 기존 프론트엔드 코드에서는 `getDisplayMedia` 프로미스가 해결(Resolve)되는 비동기 시점에 즉시 비디오 요소의 `srcObject`를 매핑하고 재생(`play()`)을 지시했습니다.
   * 하지만 `setStream(mediaStream)` 상태값 업데이트는 비동기적으로 수행되므로, 실행 시점에는 아직 `<video>` 태그가 DOM에 마운트되지 않아 `videoRef.current`가 `null`인 상태였습니다. 
   * 결국 비디오 바인딩 로직이 통째로 건너뛰어지고(Skip), 빈 비디오 태그만 생성되어 검은색 배경색만 렌더링되었습니다.

### 🟢 해결 방안

1. **React DOM 마운트 후 스트림 바인딩 구조 개편**
   * 비동기 타이밍 버그를 해소하기 위해 `useEffect` 라이프사이클을 도입하여, `stream` 상태가 활성화되고 `<video>` 태그가 DOM에 완전히 마운트된 직후 안전하게 `srcObject`를 매핑하고 재생하도록 수정했습니다.
   * **[ScreenSharePresenter.tsx](file:///d:/development/slidepenpro/src/components/ScreenSharePresenter.tsx#L72-L89) 적용 코드:**
     ```tsx
     useEffect(() => {
       const video = videoRef.current;
       if (!video || !stream) return;

       video.srcObject = stream;
       video.play().catch((playErr) => {
         console.error("[ScreenSharePresenter] Failed to play video stream:", playErr);
       });

       return () => {
         if (video) video.srcObject = null;
       };
     }, [stream]);
     ```
2. **Chromium WGC 강제 비활성화 및 GDI 레거시 캡처 강제**
   * WebView2 구동 인수(`additionalBrowserArgs`)를 수정하여 WGC의 불안정한 그래픽 가속을 끄고, 안정적인 레거시 GDI 기반 캡처 백엔드를 타겟팅하도록 설정했습니다.
   * **[tauri.conf.json](file:///d:/development/slidepenpro/src-tauri/tauri.conf.json#L50) 적용 코드:**
     ```json
     "additionalBrowserArgs": "--disable-features=WebRtcAllowWgcScreenCapturer"
     ```

---

## 2. 이슈 B: 화살표 키 입력 시 슬라이드가 전환되지 않고 상태바 포커스가 꼬이는 현상

### 🔴 현상
Tauri 앱이 활성화된 상태에서 키보드 좌우 화살표 키를 누르면, 뒤에 백그라운드로 띄워진 파워포인트 슬라이드가 넘어가지 않고 파워포인트 최하단 상태 표시줄에 있는 '보기 전환 아이콘들'의 선택 박스 테두리만 좌우로 왔다 갔다 하는 현상.

### 🔍 기술적 원인

1. **PowerPoint 윈도우 클래스명 및 타이틀 버전별 차이**
   * 기존 백엔드 코드는 파워포인트 슬라이드쇼 윈도우 클래스명을 `PP12FrameClass`로만 단순 조치하고 있어, 최신 PowerPoint(Office 365)나 Windows 10/11 한글 환경의 슬라이드쇼 창(`screenClass` 또는 `"PowerPoint 슬라이드 쇼"`) 핸들을 찾지 못해 IPC 호출 자체가 무시되었습니다.
2. **윈도우 포커스 권한 및 가상 키 메시지(PostMessage) 필터링**
   * 백그라운드에 가려진 윈도우에 가상 키 입력(`WM_KEYDOWN` / `WM_KEYUP`)을 전달할 때, 32비트 메타데이터 변수(`lParam`)를 `0`으로 넘기면 파워포인트 입력 엔진은 이 신호를 무해한 가짜 키보드 입력으로 인지하여 이벤트 처리를 필터링(무시)합니다.
3. **자식 윈도우(HWND) 포커스 꼬임 에러**
   * 하위 자식 창을 도는 `EnumChildWindows`를 실행하여 모든 핸들에 입력 신호를 쏠 때, 상태 표시줄이나 툴바 자식 핸들도 이 키 신호를 똑같이 캡처하면서 본문 슬라이드 영역의 포커스가 아래 상태 표시줄로 강제 이동해 버렸습니다.

### 🟢 해결 방안

1. **`WM_COMMAND` 메시지를 통한 윈도우 명령 우회 (최종 치트키)**
   * 포커스 여부나 하단 바 꼬임 여부와 완전히 무관하게, 파워포인트의 메시지 프로시저가 직통으로 실행시켜 즉시 다음/이전 슬라이드로 화면을 넘기게 하는 비공식 윈도우 커맨드 코드(`0x000106EF` / 다음, `0x000106EE` / 이전)를 `WM_COMMAND` 패킷에 실어 최상위 윈도우에 직발송하도록 처리했습니다.
2. **실제 드로잉 판넬인 `paneClassWindow`만 조준 사격**
   * 하단 툴바가 키를 뺏어 먹는 현상을 막기 위해, 자식 윈도우를 탐색할 때 클래스명이 슬라이드 드로잉 전담 영역인 **`"paneClassWindow"`**인 타겟 핸들만 발라내어 키보드 패킷을 전송하도록 필터링을 걸었습니다.
3. **가상 키 및 스캔 코드 메타데이터(`lParam`) 빌드**
   * 키보드 메시지를 무시하지 않도록 `MapVirtualKeyW`로 획득한 물리 스캔 코드(Scan Code)와 확장 키 비트(Extended bit)를 채운 온전한 `lParam` 패킷 데이터를 함께 동봉하여 전달했습니다.
   * **[main.rs](file:///d:/development/slidepenpro/src-tauri/src/main.rs#L34-L141) 최종 백엔드 적용 코드:**
     ```rust
     #[tauri::command]
     fn send_key_to_ppt(key_type: String) {
       #[cfg(target_os = "windows")]
       {
         use winapi::shared::windef::HWND;
         use winapi::shared::minwindef::{BOOL, LPARAM};
         use winapi::um::winuser::{EnumWindows, EnumChildWindows, GetClassNameW, GetWindowTextW, PostMessageW, WM_KEYDOWN, WM_KEYUP, WM_COMMAND, VK_LEFT, VK_RIGHT};

         unsafe {
           let mut ppt_hwnd: HWND = std::ptr::null_mut();
           
           // 슬라이드 쇼 최상위 창 탐색 콜백
           unsafe extern "system" fn enum_window_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
             let mut class_buffer = [0u16; 256];
             let class_len = GetClassNameW(hwnd, class_buffer.as_mut_ptr(), 256);
             let class_name = String::from_utf16_lossy(&class_buffer[..class_len as usize]);

             let mut text_buffer = [0u16; 512];
             let text_len = GetWindowTextW(hwnd, text_buffer.as_mut_ptr(), 512);
             let title = String::from_utf16_lossy(&text_buffer[..text_len as usize]);

             if class_name == "PP12FrameClass" 
                || class_name == "screenClass" 
                || title.contains("PowerPoint 슬라이드 쇼") 
                || title.contains("PowerPoint Slide Show") 
             {
               let target = lparam as *mut HWND;
               *target = hwnd;
               return 0; // 탐색 종료
             }
             1
           }

           EnumWindows(Some(enum_window_callback), &mut ppt_hwnd as *mut HWND as LPARAM);

           if !ppt_hwnd.is_null() {
             let vk_code = match key_type.as_str() {
               "left" => VK_LEFT,
               "right" => VK_RIGHT,
               _ => 0,
             };

             if vk_code != 0 {
               // [1] WM_COMMAND 발송 (백그라운드 포커스 무시 전환)
               let cmd_wparam = match key_type.as_str() {
                 "left" => 0x000106EE,   // 이전 슬라이드 커맨드
                 "right" => 0x000106EF,  // 다음 슬라이드 커맨드
                 _ => 0,
               };

               if cmd_wparam != 0 {
                 PostMessageW(ppt_hwnd, WM_COMMAND, cmd_wparam, 0);
               }

               // [2] 32비트 lParam 규격 패킷 전송 (스캔 코드 주입)
               let scan_code = winapi::um::winuser::MapVirtualKeyW(vk_code as u32, 0);
               let keydown_lparam = 1 | ((scan_code as LPARAM) << 16) | (1 << 24);
               let keyup_lparam = 1 | ((scan_code as LPARAM) << 16) | (1 << 24) | (1 << 30) | (1 << 31);

               struct KeyBypassParams {
                 vk_code: usize,
                 keydown_lparam: LPARAM,
                 keyup_lparam: LPARAM,
                 found_target: *mut bool,
               }

               let mut found_target = false;
               let params = KeyBypassParams {
                 vk_code: vk_code as usize,
                 keydown_lparam,
                 keyup_lparam,
                 found_target: &mut found_target as *mut bool,
               };

               // [3] paneClassWindow 조준 사격 콜백
               unsafe extern "system" fn send_key_to_child_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
                 let mut class_buffer = [0u16; 256];
                 let class_len = GetClassNameW(hwnd, class_buffer.as_mut_ptr(), 256);
                 let class_name = String::from_utf16_lossy(&class_buffer[..class_len as usize]);

                 if class_name == "paneClassWindow" {
                   let p = &*(lparam as *const KeyBypassParams);
                   PostMessageW(hwnd, WM_KEYDOWN, p.vk_code, p.keydown_lparam);
                   PostMessageW(hwnd, WM_KEYUP, p.vk_code, p.keyup_lparam);
                   *(p.found_target) = true;
                 }
                 1
               }

               EnumChildWindows(ppt_hwnd, Some(send_key_to_child_callback), &params as *const KeyBypassParams as LPARAM);

               // 자식 창이 없을 경우 최상위 윈도우에 직접 키보드 이벤트 폴백
               if !found_target {
                 PostMessageW(ppt_hwnd, WM_KEYDOWN, vk_code as usize, keydown_lparam);
                 PostMessageW(ppt_hwnd, WM_KEYUP, vk_code as usize, keyup_lparam);
               }
             }
           }
         }
       }
     }
     ```

---

## 3. 요약 및 재발 방지 권장사항

1. **Tauri 앱 배포 시 주의점**
   * 향후 프로덕션 빌드 배포 시, `tauri.conf.json` 의 `"additionalBrowserArgs"` 에 `--disable-features=WebRtcAllowWgcScreenCapturer` 플래그가 누락되지 않았는지 이중 확인하십시오.
2. **PPT 실행 권한 일치**
   * 만약 향후에 제어 연동 기능이 다시 동작하지 않는다면, 발표용 PowerPoint와 개발/실행 중인 Tauri 앱의 **윈도우 실행 권한 등급(Integrity Level)**이 일치하는지 확인해 보십시오. (PowerPoint가 관리자 권한으로 실행되는 경우, Tauri 앱도 마우스 우클릭 ➔ **[관리자 권한으로 실행]**으로 켜야 제어 신호가 차단되지 않습니다.)
