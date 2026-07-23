# SlidePro (SlidePenPro) 🖊️🖥️

> 발표자의 '생각의 속도'와 청중의 '시선의 속도'를 일치시키는 혁신적인 화면 판서 및 발표 보조 네이티브 도구

SlidePro는 Windows 기반의 발표 보조 및 투명 화면 판서 애플리케이션입니다. PPT 슬라이드 쇼 및 화면 공유 시 presentation 이탈 없이 즉시 판서, 스마트 줌, 다양한 인터랙티브 이펙트를 제공합니다.

---

## 🌟 주요 기능 (Key Features)

### 💼 Biz 모드 (비즈니스 및 전문 강사용)
- **무중단 스마트 줌 (No-Break Smart Zoom):** PPT 쇼 이탈 없이 원하는 화면 영역을 부드럽게 확대하고 화면 위에 즉시 판서
- **스마트 스냅 (Smart Snapping):** 손으로 그린 선이나 도형을 깔끔한 형광펜/하이라이트 박스로 자동 보정
- **맥락 인식형 스마트 소멸 (Auto-Fade):** 판서 후 수 초 뒤 잔여물이 자연스럽게 페이드아웃되어 발표 흐름 유지

### 🎉 Fun 모드 (교육 및 인터랙티브용)
- **칭찬 리워드 이펙트:** 종이가루(Confetti) 폭죽 연출로 청중 참여 유도
- **디지털 스탬프 & 효과음:** "참 잘했어요!", "정답!" 등의 애니메이션 스탬프 및 경쾌한 사운드 

### 🛠️ 사용자 편의 기능
- **미니 플로팅 툴바:** 화면 가장자리의 컴팩트 반투명 도크로 편리한 모드 스위칭
- **단축키 HUD:** 가이드라인 UI를 통한 직관적인 단축키 활용
- **마우스 관통 모드 (Click-Through):** 판서 비활성화 시 투명 캔버스를 통과해 PPT 및 웹 브라우저 직접 제어

---

## 🛠️ 기술 스택 (Tech Stack)

- **Framework:** Tauri (Rust + Web)
- **Frontend:** React 18, TypeScript, Tailwind CSS, HTML5 Canvas
- **Backend / OS:** Rust (Win32 API 연동, 최상단 투명 윈도우, 마우스 이벤트 Bypass)
- **Cloud Service:** Firebase (Auth, Firestore, Cloud Functions)
- **Build Tool:** Vite

---

## 🚀 개발 환경 실행 (Getting Started)

### 사전 요구 사항 (Prerequisites)
- [Node.js](https://nodejs.org/) (v18 이상)
- [Rust](https://www.rust-lang.org/) 개발 환경 및 Windows C++ Build Tools (Tauri 빌드용)

### 설치 및 개발 서버 실행

```bash
# 1. 패키지 설치
npm install

# 2. 웹 Dev 서버 실행
npm run dev

# 3. Tauri 데스크톱 앱 Dev 실행
npm run tauri dev
```

---

## 📄 License

Private / All rights reserved.
