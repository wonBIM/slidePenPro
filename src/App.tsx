import React, { useState, useEffect, useRef } from "react";
import { DrawingCanvas } from "./components/DrawingCanvas";
import { FloatingToolbar } from "./components/FloatingToolbar";
import { ShortcutHUD } from "./components/ShortcutHUD";
import { InteractiveEffects, InteractiveEffectsRef, StampInstance } from "./components/InteractiveEffects";
import { ScreenSharePresenter } from "./components/ScreenSharePresenter";
import { PdfPresenter } from "./components/PdfPresenter";
import { FileUp, X } from "lucide-react";

interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  type: "free" | "line" | "rect";
  createdAt: number;
  opacity: number;
  isFading: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface PresetStamp {
  id: string;
  label: string;
}

export interface CustomEffect {
  id: string;
  name: string;
  shape: string;
  style: "crystal" | "jelly" | "gold";
  animation: "explosion" | "rain" | "float";
  imageUrl?: string;
  createdAt: number;
}

export default function App() {
  // Core Application States
  const [mode, setMode] = useState<"biz" | "fun">("fun");
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#ef4444"); // default red
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [smartSnap, setSmartSnap] = useState(true);
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [spotlightRadius, setSpotlightRadius] = useState(120); // adjustable radius
  const [currentStamp, setCurrentStamp] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hybrid Presentation Source
  const [presentationSource, setPresentationSource] = useState<"simulator" | "screenshare" | "pdf" | "images">("simulator");

  // 1. PDF Presentation States
  const [pdfFileUrl, setPdfFileUrl] = useState<string | null>(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [pdfNumPages, setPdfNumPages] = useState(0);

  // 2. Images Presentation States (Multi-image Slide Deck)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 3. Simulator Presentation States
  const [simPage, setSimPage] = useState(1); // 1 to 4 pages

  // 4. Screenshare states
  const [isStreamActive, setIsStreamActive] = useState(false);

  // Multi-page Drawing & Stamp Cache Stores (Keys format: "source-page")
  const [strokesByPage, setStrokesByPage] = useState<{ [pageKey: string]: Stroke[] }>({});
  const [stampsByPage, setStampsByPage] = useState<{ [pageKey: string]: StampInstance[] }>({});

  // Zoom and Coordinate states (No-Break Smart Zoom)
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Drag over state
  const [isDragOver, setIsDragOver] = useState(false);

  // Area Crop Zoom States
  const [isAreaZoomActive, setIsAreaZoomActive] = useState(false);

  // Custom Stamp inputs & Shape Styling
  const [customText, setCustomText] = useState("");
  const [customShape, setCustomShape] = useState<"badge" | "circle" | "bubble" | "star">("badge");
  const [stampScale, setStampScale] = useState<number>(1.0);
  const [aiEffectScale, setAiEffectScale] = useState<number>(1.0);

  // ⏳ Auto Fade Option
  const [autoFadeActive, setAutoFadeActive] = useState(true);

  // ✨ Interactive Visual Effects States
  const [cursorTrailType, setCursorTrailType] = useState<"none" | "star" | "fire" | "bubble">("none");
  const [neonBorderActive, setNeonBorderActive] = useState(false);
  const [earthquakeActive, setEarthquakeActive] = useState(false);

  // Sync cursor trail with InteractiveEffects component
  useEffect(() => {
    effectsRef.current?.setCursorTrailType(cursorTrailType);
  }, [cursorTrailType]);

  const handleTriggerEmojiBurst = () => {
    effectsRef.current?.playEmojiBurst();
  };

  const handleTriggerMeteorShower = () => {
    effectsRef.current?.playMeteorShower();
  };

  const handleTriggerScreenFreeze = () => {
    effectsRef.current?.triggerScreenFreeze();
  };

  const handleTriggerEarthquake = () => {
    setEarthquakeActive(true);
    effectsRef.current?.playAudioPreset("buzzer");
    setTimeout(() => {
      setEarthquakeActive(false);
    }, 1200); // Shake for 1.2 seconds
  };

  // 🎡 Spinner Wheel States
  const [showSpinner, setShowSpinner] = useState(false);
  const [spinnerNames, setSpinnerNames] = useState<string>("홍길동, 이순신, 세종대왕, 신사임당, 김두한");
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [winnerName, setWinnerName] = useState<string | null>(null);

  // ⏱️ Countdown Timer States
  const [showTimer, setShowTimer] = useState(false);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(60);
  const [timerDuration, setTimerDuration] = useState(60);
  const [timerIsRunning, setTimerIsRunning] = useState(false);

  // 1. Timer Countdown tick interval
  useEffect(() => {
    if (!timerIsRunning || timerSecondsLeft <= 0) {
      if (timerSecondsLeft === 0 && timerIsRunning) {
        setTimerIsRunning(false);
        handleTriggerConfetti(); // Cheering on zero completion!
      }
      return;
    }

    const interval = setInterval(() => {
      setTimerSecondsLeft((prev) => {
        const next = prev - 1;
        // Last 5 seconds ticking audio
        if (next <= 5 && next > 0) {
          effectsRef.current?.playAudioPreset("focus");
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerIsRunning, timerSecondsLeft]);

  // 2. Spinner Wheel deceleration loop
  useEffect(() => {
    if (!isSpinning) return;

    let currentVel = 32 + Math.random() * 15;
    let currentAngle = spinAngle;
    let frameId: number;

    const namesArray = spinnerNames.split(",").map(n => n.trim()).filter(Boolean);
    if (namesArray.length === 0) {
      setIsSpinning(false);
      return;
    }

    const update = () => {
      currentVel *= 0.965; // physical damping friction
      currentAngle += currentVel;
      setSpinAngle(currentAngle);

      if (currentVel < 0.1) {
        setIsSpinning(false);
        // Calculate winner index
        const normalizedAngle = (currentAngle % 360);
        const sliceAngle = 360 / namesArray.length;
        const pointerAngle = (360 - normalizedAngle + 270) % 360;
        const winIdx = Math.floor(pointerAngle / sliceAngle) % namesArray.length;
        
        const winner = namesArray[winIdx];
        setWinnerName(winner);
        
        effectsRef.current?.playAudioPreset("ding");
        handleTriggerConfetti();
        return;
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [isSpinning]);

  const isEffectsInteractive = !isDrawing && currentStamp === null && !isAreaZoomActive;

  // ⚙️ Dynamic Stamp Presets Store
  const [presetStamps, setPresetStamps] = useState<PresetStamp[]>([
    { id: "excellent", label: "👍 참 잘했어요" },
    { id: "focus", label: "👀 여기 보세요" },
    { id: "correct", label: "🎉 정답입니다" },
    { id: "wrong", label: "⚠️ 확인해보세요" }
  ]);

  // 🪄 AI Custom Effects States (Loaded from LocalStorage)
  const [customEffects, setCustomEffects] = useState<CustomEffect[]>(() => {
    try {
      const saved = localStorage.getItem("slidepen_custom_effects");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("slidepen_custom_effects", JSON.stringify(customEffects));
  }, [customEffects]);



  const [isAiSketchActive, setIsAiSketchActive] = useState(false);
  const [isAiConverting, setIsAiConverting] = useState(false);

  const handleTriggerCustomEffect = (effect: CustomEffect) => {
    effectsRef.current?.playCustomEffect?.(effect.shape as any, effect.style, effect.animation, effect.imageUrl);
  };

  // Keyboard Guide HUD State
  const [showHUD, setShowHUD] = useState(false);

  // Panning State (Right click drag)
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });

  // Refs
  const effectsRef = useRef<InteractiveEffectsRef>(null);

  // --- Core Utility Functions (Placed high for Hoisting) ---
  
  const handleResetZoom = () => {
    setZoomLevel(1.0);
    setZoomOffset({ x: 0, y: 0 });
  };

  const getPageKey = (): string => {
    switch (presentationSource) {
      case "pdf":
        return `pdf-${pdfCurrentPage}`;
      case "images":
        return `img-${currentImageIndex}`;
      case "simulator":
        return `sim-${simPage}`;
      case "screenshare":
      default:
        return "screenshare-1";
    }
  };

  const activePageKey = getPageKey();
  const currentStrokes = strokesByPage[activePageKey] || [];
  const currentStamps = stampsByPage[activePageKey] || [];

  // Update active page's strokes array
  const setCurrentStrokes = (updateFn: any) => {
    setStrokesByPage((prev) => {
      const pageStrokes = prev[activePageKey] || [];
      const updatedStrokes = typeof updateFn === "function" ? updateFn(pageStrokes) : updateFn;
      return {
        ...prev,
        [activePageKey]: updatedStrokes
      };
    });
  };

  // Drag & drop selection crop zoom calculator (PURE screen coordinates)
  const handleAreaZoomSelected = (start: Point, end: Point) => {
    // 1. REVERSE TRANSFORM screen-space coordinates into canvas-space coordinates
    const canvasStartX = (start.x - zoomOffset.x) / zoomLevel;
    const canvasStartY = (start.y - zoomOffset.y) / zoomLevel;
    const canvasEndX = (end.x - zoomOffset.x) / zoomLevel;
    const canvasEndY = (end.y - zoomOffset.y) / zoomLevel;

    const minCanvasX = Math.min(canvasStartX, canvasEndX);
    const maxCanvasX = Math.max(canvasStartX, canvasEndX);
    const minCanvasY = Math.min(canvasStartY, canvasEndY);
    const maxCanvasY = Math.max(canvasStartY, canvasEndY);

    const widthCanvas = maxCanvasX - minCanvasX;
    const heightCanvas = maxCanvasY - minCanvasY;

    // Selected Drag center in Absolute Canvas Space
    const centerCanvasX = minCanvasX + widthCanvas / 2;
    const centerCanvasY = minCanvasY + heightCanvas / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - 152; // exact offset between top-10 and bottom-28 height

    const scaleX = viewportWidth / widthCanvas;
    const scaleY = viewportHeight / heightCanvas;
    
    // Calculate final zoom scale factor with 5% margin padding
    const nextZoom = Math.min(4.0, Math.max(1.0, Math.min(scaleX, scaleY) * 0.95));

    // Align absolute canvas coordinates back to viewport center under new zoom scale
    const nextOffsetX = viewportWidth / 2 - centerCanvasX * nextZoom;
    const nextOffsetY = viewportHeight / 2 - centerCanvasY * nextZoom;

    setZoomLevel(nextZoom);
    setZoomOffset({ x: nextOffsetX, y: nextOffsetY });
    setIsAreaZoomActive(false); // turn off selection mode
    effectsRef.current?.playAudioPreset("focus");
  };

  // Edit dynamic stamp preset label value
  const handleEditPresetLabel = (idToEdit: string, newLabel: string) => {
    setPresetStamps((prev) =>
      prev.map((stamp) => (stamp.id === idToEdit ? { ...stamp, label: newLabel } : stamp))
    );
  };

  // Send slide control keyboard events to PowerPoint in background via Tauri
  const triggerPPTKeyBypass = async (direction: "left" | "right") => {
    try {
      const { invoke } = await import("@tauri-apps/api/tauri");
      await invoke("send_key_to_ppt", { keyType: direction });
      console.log(`SlidePro: Keystroke bypass [${direction}] sent to PPT.`);
    } catch (e) {
      console.log(`Browser Simulator: PPT key bypass [${direction}] requested.`);
    }
  };

  // Page flipping logic
  const handlePrevPage = () => {
    handleResetZoom();
    effectsRef.current?.playAudioPreset("focus");

    if (presentationSource === "pdf" && pdfCurrentPage > 1) {
      setPdfCurrentPage((prev) => prev - 1);
    } else if (presentationSource === "images" && currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    } else if (presentationSource === "simulator" && simPage > 1) {
      setSimPage((prev) => prev - 1);
    } else if (presentationSource === "screenshare") {
      triggerPPTKeyBypass("left");
    }
  };

  const handleNextPage = () => {
    handleResetZoom();
    effectsRef.current?.playAudioPreset("focus");

    if (presentationSource === "pdf" && pdfCurrentPage < pdfNumPages) {
      setPdfCurrentPage((prev) => prev + 1);
    } else if (presentationSource === "images" && currentImageIndex < imageUrls.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    } else if (presentationSource === "simulator" && simPage < 4) {
      setSimPage((prev) => prev + 1);
    } else if (presentationSource === "screenshare") {
      triggerPPTKeyBypass("right");
    }
  };

  const handleClearPageStrokes = () => {
    console.log(`[App] Clearing page strokes for activePageKey: ${activePageKey}`);
    setStrokesByPage((prev) => ({ ...prev, [activePageKey]: [] }));
    setStampsByPage((prev) => ({ ...prev, [activePageKey]: [] }));
    effectsRef.current?.playAudioPreset("focus");
  };

  const handlePdfUpload = (url: string) => {
    setPdfFileUrl(url);
    setPresentationSource("pdf");
    setPdfCurrentPage(1);
  };

  const handleImagesUpload = (urls: string[]) => {
    setImageUrls(urls);
    setPresentationSource("images");
    setCurrentImageIndex(0);
  };

  const handleTriggerConfetti = () => {
    effectsRef.current?.triggerConfetti();
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (files.length === 1 && files[0].type === "application/pdf") {
      const url = URL.createObjectURL(files[0]);
      handlePdfUpload(url);
    } else {
      const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        imageFiles.sort((a, b) => a.name.localeCompare(b.name));
        const urls = imageFiles.map((file) => URL.createObjectURL(file));
        handleImagesUpload(urls);
      } else {
        alert("PDF 파일 또는 슬라이드 이미지 파일들을 드롭해 주세요.");
      }
    }
  };

  // Window toggle fullscreen & close helper
  const handleToggleFullscreen = async () => {
    try {
      const { appWindow } = await import("@tauri-apps/api/window");
      const isFullscreen = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!isFullscreen);
    } catch (e) {
      alert("샘플 PPT 모드에서는 브라우저 F11로 조작해 주세요.");
    }
  };

  const handleCloseWindow = async () => {
    try {
      const { appWindow } = await import("@tauri-apps/api/window");
      await appWindow.close();
    } catch (e) {
      alert("샘플 PPT 브라우저 탭을 닫아주세요.");
    }
  };

  // Slide navigator indices
  const getCurrentPageNumber = (): number => {
    if (presentationSource === "pdf") return pdfCurrentPage;
    if (presentationSource === "images") return currentImageIndex + 1;
    if (presentationSource === "simulator") return simPage;
    return 0;
  };

  const getTotalPagesNumber = (): number => {
    if (presentationSource === "pdf") return pdfNumPages;
    if (presentationSource === "images") return imageUrls.length;
    if (presentationSource === "simulator") return 4;
    return 0;
  };

  // Set default stroke colors per mode
  useEffect(() => {
    if (mode === "biz") {
      setStrokeColor("#ef4444");
    } else {
      setStrokeColor("#ff007f");
    }
  }, [mode]);

  // Global mouse coordinates logger (for Spotlight position)
  useEffect(() => {
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMoveGlobal);
    return () => window.removeEventListener("mousemove", handleMouseMoveGlobal);
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        setMode((prev) => {
          const next = prev === "biz" ? "fun" : "biz";
          setCurrentStamp(null);
          return next;
        });
        effectsRef.current?.playAudioPreset("focus");
      }

      if (e.key === "`") {
        e.preventDefault();
        setIsDrawing((prev) => !prev);
        setCurrentStamp(null);
      }

      if (e.key === "F5" || e.key.toLowerCase() === "f") {
        e.preventDefault();
        if (mode === "biz") {
          setSpotlightActive((prev) => !prev);
        } else {
          effectsRef.current?.triggerConfetti();
        }
      }

      if (zoomLevel === 1.0 && !isAreaZoomActive) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevPage();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          handleNextPage();
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleResetZoom();
        setIsDrawing(false);
        setSpotlightActive(false);
        setCurrentStamp(null);
        setIsAreaZoomActive(false);
      }

      if (mode === "fun" && !e.ctrlKey && !e.altKey) {
        if (e.key === "1") {
          setCurrentStamp("excellent");
          setIsDrawing(false);
          effectsRef.current?.playAudioPreset("ding");
        } else if (e.key === "2") {
          setCurrentStamp("focus");
          setIsDrawing(false);
          effectsRef.current?.playAudioPreset("focus");
        } else if (e.key === "3") {
          setCurrentStamp("correct");
          setIsDrawing(false);
          effectsRef.current?.playAudioPreset("ding");
        } else if (e.key === "4") {
          setCurrentStamp("wrong");
          setIsDrawing(false);
          effectsRef.current?.playAudioPreset("buzzer");
        }
      }

      if (spotlightActive) {
        if (e.key === "[") {
          e.preventDefault();
          setSpotlightRadius((r) => Math.max(60, r - 15));
        } else if (e.key === "]") {
          e.preventDefault();
          setSpotlightRadius((r) => Math.min(300, r + 15));
        }
      }

      if (e.key === "Control" || e.key === "Shift") {
        setShowHUD(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Shift") {
        setShowHUD(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode, isDrawing, zoomLevel, presentationSource, pdfCurrentPage, pdfNumPages, currentImageIndex, imageUrls, simPage, spotlightActive, isAreaZoomActive]);

  // Mouse Wheel Smart Zoom & Spotlight radius sizer
  useEffect(() => {
    const handleWheelGlobal = (e: WheelEvent) => {
      if (spotlightActive) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setSpotlightRadius((r) => Math.min(300, r + 15));
        } else {
          setSpotlightRadius((r) => Math.max(60, r - 15));
        }
        return;
      }

      if (!e.ctrlKey) return;
      e.preventDefault();

      const zoomFactor = 1.1;
      let nextZoom = zoomLevel;

      if (e.deltaY < 0) {
        nextZoom = Math.min(4.0, zoomLevel * zoomFactor);
      } else {
        nextZoom = Math.max(1.0, zoomLevel / zoomFactor);
      }

      if (nextZoom === zoomLevel) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const nextOffsetX = mouseX - (mouseX - zoomOffset.x) * (nextZoom / zoomLevel);
      const nextOffsetY = mouseY - (mouseY - zoomOffset.y) * (nextZoom / zoomLevel);

      setZoomLevel(nextZoom);
      if (nextZoom === 1.0) {
        setZoomOffset({ x: 0, y: 0 });
      } else {
        setZoomOffset({ x: nextOffsetX, y: nextOffsetY });
      }
    };

    window.addEventListener("wheel", handleWheelGlobal, { passive: false });
    return () => window.removeEventListener("wheel", handleWheelGlobal);
  }, [zoomLevel, zoomOffset, spotlightActive]);

  // Panning Event Listeners (Right click drag)
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 && zoomLevel > 1.0) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = { ...zoomOffset };
    }
  };

  const handleBgMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setZoomOffset({
      x: panOffsetStart.current.x + dx,
      y: panOffsetStart.current.y + dy
    });
  };

  const handleBgMouseUp = (e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(false);
    }
  };

  const handleStampPlaced = (x: number, y: number, stampType: string) => {
    // Determine the label text to stamp (use current input if custom or edited preset label)
    let stampText = undefined;
    if (stampType === "custom") {
      stampText = customText;
    } else {
      const matchPreset = presetStamps.find((p) => p.id === stampType);
      if (matchPreset) {
        stampText = matchPreset.label;
      }
    }

    const newStamp: StampInstance = {
      id: Math.random().toString(36).substring(7),
      x,
      y,
      type: stampType,
      text: stampText,
      shape: stampType === "custom" || currentStamp ? customShape : undefined,
      scale: stampScale,
      createdAt: Date.now()
    };

    setStampsByPage((prev) => {
      const pageStamps = prev[activePageKey] || [];
      return {
        ...prev,
        [activePageKey]: [...pageStamps, newStamp]
      };
    });

    if (stampType === "excellent" || stampType === "correct") {
      effectsRef.current?.playAudioPreset("ding");
    } else if (stampType === "focus") {
      effectsRef.current?.playAudioPreset("focus");
    } else if (stampType === "wrong") {
      effectsRef.current?.playAudioPreset("buzzer");
    } else {
      effectsRef.current?.playAudioPreset("ding");
    }
  };

  // Background mock slide renderers (for Simulator source)
  const renderSimulatorBackground = () => {
    switch (simPage) {
      case 1:
        return (
          <div className="relative flex h-full w-full flex-col justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-16 text-white overflow-hidden text-left">
            {/* Background glowing anim circles for futuristic look */}
            <div className="absolute -left-20 -top-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full bg-pink-500 animate-ping" />
                <span className="text-sm font-black tracking-widest text-indigo-300 uppercase">SlidePen Pro Welcome Stage</span>
              </div>
              <span className="text-sm text-slate-500 font-bold font-mono">Slide 01 / 04</span>
            </div>
            
            <div className="relative z-10 flex flex-1 items-center justify-between gap-8 my-auto w-full">
              {/* Left Column: Welcome description texts */}
              <div className="space-y-8 flex-1 max-w-[52%] text-left">
                <span className="px-4 py-1.5 bg-gradient-to-r from-pink-500/20 to-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-full text-sm font-bold tracking-wide inline-block animate-bounce">
                  🎉 마법의 프레젠테이션 오버레이 보드
                </span>
                <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] bg-gradient-to-r from-white via-indigo-100 to-pink-300 bg-clip-text text-transparent font-sans drop-shadow-2xl keep-all break-keep">
                  스마트한 발표 도구 <br />
                  <span className="text-indigo-400">SlidePen Pro</span>
                </h1>
                <p className="text-slate-350 text-base lg:text-lg leading-relaxed">
                  지루하고 딱딱한 발표는 그만! 중요 문구는 차분히 강조하고, 정답을 맞췄을 땐 폭죽과 하트로 최고의 재미를! 빔 프로젝터와 원격 화면 공유에서도 끊김 없이 작동하는 스마트 펜 보드입니다.
                </p>
              </div>

              {/* Right Column: Wide landscape concept illustration */}
              <div className="hidden lg:flex items-center justify-center flex-1 max-w-[45%] h-[310px] rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/40 p-2.5 shadow-2xl relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-indigo-500/10 rounded-2xl opacity-40 blur-2xl" />
                <img 
                  src="/welcome_graphic.png" 
                  alt="SlidePen Pro Concept Artwork" 
                  className="relative z-10 w-full h-full object-cover rounded-xl shadow-xl transition-all duration-500 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-6">
              {[
                { emoji: "💡", title: "집중할 땐 스포트라이트", desc: "주변부를 블러링하여 청중의 시선을 중요한 단어 하나에 차분히 안착시킵니다.", border: "hover:border-blue-500/50" },
                { emoji: "🎨", title: "칭찬할 땐 폭죽과 리액션", desc: "하트 뿜뿜 리액션과 오색 종이 폭죽 쇼로 학습 몰입도와 현장 재미를 2배로 키워줍니다.", border: "hover:border-pink-500/50" },
                { emoji: "🔍", title: "확대할 땐 영역 드래그 줌", desc: "복잡한 표나 차트가 나오면 마우스로 쓱 긁어 화면 전체에 꽉 차게 줌인합니다.", border: "hover:border-yellow-500/50" }
              ].map((item, idx) => (
                <div key={idx} className={`bg-slate-900/55 backdrop-blur-md border border-slate-800/80 p-7 rounded-2xl transition-all duration-300 transform hover:-translate-y-1.5 ${item.border} shadow-xl`}>
                  <div className="text-4xl mb-3">{item.emoji}</div>
                  <h3 className="font-extrabold text-slate-100 text-xl mb-2">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex h-full w-full flex-col justify-between bg-gradient-to-tr from-indigo-950 via-slate-900 to-violet-950 p-12 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-pink-400">🚀 재미있는 과학과 우주 교실</span>
              <span className="text-xs text-slate-400">Slide 02 / 04</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto my-auto">
              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-bold border border-pink-500/30 animate-pulse">
                오늘의 도전 과제
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-pink-400 to-violet-400 bg-clip-text text-transparent font-sans">
                태양계에서 가장 큰 행성은 무엇일까요?
              </h1>
              <p className="text-slate-300 text-base">
                우리 태양계의 행성들은 저마다 크기와 환경이 다릅니다. 이 중에서 지구보다 무려 11배나 크고 신비로운 가스 띠를 가진 대왕 행성을 찾아봅시다!
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 w-full">
              {[
                { name: "1. 화성 (Mars)", bg: "from-red-600 to-amber-700" },
                { name: "2. 목성 (Jupiter)", bg: "from-yellow-600 to-amber-800", highlight: true },
                { name: "3. 토성 (Saturn)", bg: "from-blue-600 to-indigo-800" },
                { name: "4. 해왕성 (Neptune)", bg: "from-sky-600 to-blue-900" }
              ].map((planet, idx) => (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${planet.bg} p-5 border text-center transition-all ${
                    planet.highlight
                      ? "border-yellow-400/80 shadow-lg shadow-yellow-500/10 scale-105"
                      : "border-slate-800/80"
                  }`}
                >
                  {planet.highlight && (
                    <span className="absolute -right-2 -top-2 bg-yellow-400 text-slate-900 text-[9px] font-extrabold px-3 py-1 rotate-12">
                      정답 후보
                    </span>
                  )}
                  <h3 className="font-extrabold text-white text-sm md:text-base">{planet.name}</h3>
                  <p className="text-white/70 text-[10px] mt-1">클릭하여 스탬프로 체크해보세요</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex h-full w-full flex-col bg-slate-950 p-8 text-white gap-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4 text-left">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-200">SlidePro 분석 대시보드</h1>
                <p className="text-slate-500 text-xs">Windows 네이티브 앱 메모리 리소스 비교 모니터링</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-bold animate-pulse">
                ● Live System Status OK
              </span>
            </div>

            <div className="grid grid-cols-3 gap-6 text-left">
              <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-xl">
                <div className="text-xs text-slate-500 font-semibold">Tauri 가상 오버레이 메모리 점유율</div>
                <div className="text-3xl font-extrabold mt-1 text-slate-100 tracking-tight">8.4 MB</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Electron(145MB) 대비 94.2% 절감</div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-xl">
                <div className="text-xs text-slate-500 font-semibold">DPI 스케일링 렌더링 지연속도</div>
                <div className="text-3xl font-extrabold mt-1 text-slate-100 tracking-tight">0.12 ms</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ Direct2D GPU 가속 텍스처 변환 완료</div>
              </div>
              <div className="bg-slate-900/30 border border-slate-900 p-5 rounded-xl">
                <div className="text-xs text-slate-500 font-semibold">CPU 점유율 (1080p 60fps)</div>
                <div className="text-3xl font-extrabold mt-1 text-slate-100 tracking-tight">0.8 %</div>
                <div className="text-[10px] text-emerald-400 font-semibold mt-1">✓ 1대 대면 빔 프로젝터 호환성 보장</div>
              </div>
            </div>

            <div className="flex-1 bg-slate-900/20 border border-slate-900 rounded-xl p-5 flex flex-col gap-3 min-h-[220px] text-left">
              <span className="text-xs font-bold text-slate-400">실시간 프레임 드롭 분석 (SlidePro vs EpicPen)</span>
              <div className="flex-1 flex items-end justify-between gap-2 px-4 border-b border-l border-slate-800/60 pb-2 pt-4">
                {[45, 80, 55, 90, 75, 60, 95, 85, 70, 100, 90, 95].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:from-violet-500" style={{ height: `${val * 1.5}px` }} />
                    <span className="text-[8px] text-slate-600">M{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
      default:
        return (
          <div className="flex h-full w-full flex-col bg-slate-900 text-slate-300 font-mono text-xs overflow-hidden select-text">
            <div className="flex items-center bg-slate-950 px-4 py-2 border-b border-slate-800 gap-4">
              <span className="text-indigo-400 text-xs font-bold font-mono">src-tauri / src / main.rs</span>
              <span className="text-slate-600 font-mono">|</span>
              <span className="text-slate-500 font-mono">Tauri Windows Core Control</span>
            </div>
            <div className="p-6 space-y-1.5 overflow-y-auto leading-relaxed text-left">
              <div><span className="text-slate-600">01</span> <span className="text-rose-400">use</span> tauri::&#123;Manager, Runtime&#125;;</div>
              <div><span className="text-slate-600">02</span> <span className="text-rose-400">use</span> winapi::um::winuser::&#123;SetWindowLongW, GetWindowLongW, WS_EX_TRANSPARENT&#125;;</div>
              <div><span className="text-slate-600">03</span> </div>
              <div><span className="text-slate-500">// 마우스 이벤트를 아래의 PPT 창으로 완전히 통과시키는 Rust API</span></div>
              <div><span className="text-slate-600">04</span> <span className="text-emerald-400">#[tauri::command]</span></div>
              <div><span className="text-slate-600">05</span> <span className="text-blue-400">fn</span> <span className="text-yellow-400">set_ignore_mouse_events</span>(window: tauri::Window, ignore: <span className="text-orange-400">bool</span>) &#123;</div>
              <div><span className="text-slate-600">06</span> &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">let</span> hwnd = window.hwnd().unwrap() <span className="text-rose-400">as</span> winapi::shared::windef::HWND;</div>
              <div><span className="text-slate-600">07</span> &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">let</span> hwnd_raw = hwnd as HWND;</div>
              <div><span className="text-slate-600">08</span> &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">unsafe</span> &#123;</div>
              <div><span className="text-slate-600">09</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">let</span> ex_style = GetWindowLongW(hwnd, winapi::um::winuser::GWL_EXSTYLE);</div>
              <div><span className="text-slate-600">10</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-rose-400">let</span> new_style = <span className="text-rose-400">if</span> ignore &#123;</div>
              <div><span className="text-slate-600">11</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ex_style | WS_EX_TRANSPARENT</div>
              <div><span className="text-slate-600">12</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125; <span className="text-rose-400">else</span> &#123;</div>
              <div><span className="text-slate-600">13</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ex_style & !WS_EX_TRANSPARENT</div>
              <div><span className="text-slate-600">14</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;;</div>
              <div><span className="text-slate-600">15</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SetWindowLongW(hwnd, winapi::um::winuser::GWL_EXSTYLE, new_style);</div>
              <div><span className="text-slate-600">16</span> &nbsp;&nbsp;&nbsp;&nbsp;&#125;</div>
              <div><span className="text-slate-600">17</span> &#125;</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none"
    >
      
      {/* 0. Top Custom Window Drag Controller Bar */}
      <div 
        data-tauri-drag-region 
        className="fixed top-0 left-0 right-0 z-50 h-10 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/60 flex items-center justify-between px-4 text-slate-200 select-none cursor-move pointer-events-auto"
      >
        <div data-tauri-drag-region className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
          <span data-tauri-drag-region className="text-[10px] font-black font-sans tracking-widest text-slate-300 uppercase">
            SlidePen Pro
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleFullscreen}
            className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 font-medium transition-colors cursor-pointer"
            title="전체화면 토글"
          >
            전체화면
          </button>
          <button 
            onClick={handleCloseWindow}
            className="px-2.5 py-1 text-[10px] bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 rounded text-rose-400 font-semibold transition-colors cursor-pointer"
            title="앱 닫기"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 0.4 Embedded Visual Scene Effect CSS (Earthquake & Border laser spin) */}
      <style>{`
        @keyframes earthquake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-5px, 4px) rotate(-0.5deg); }
          20% { transform: translate(4px, -3px) rotate(0.5deg); }
          30% { transform: translate(-4px, 3px) rotate(0deg); }
          40% { transform: translate(3px, 4px) rotate(0.5deg); }
          50% { transform: translate(-3px, -4px) rotate(-0.5deg); }
          60% { transform: translate(4px, 3px) rotate(0.5deg); }
          70% { transform: translate(-4px, -3px) rotate(-0.5deg); }
          80% { transform: translate(3px, -3px) rotate(0deg); }
          90% { transform: translate(-3px, 4px) rotate(0.5deg); }
        }
        .animate-earthquake {
          animation: earthquake 0.12s infinite;
        }
        @keyframes borderSpin {
          0% { border-image: linear-gradient(0deg, #ff007f, #bd00ff, #00e5ff, #39ff14) 1; }
          25% { border-image: linear-gradient(90deg, #ff007f, #bd00ff, #00e5ff, #39ff14) 1; }
          50% { border-image: linear-gradient(180deg, #ff007f, #bd00ff, #00e5ff, #39ff14) 1; }
          75% { border-image: linear-gradient(270deg, #ff007f, #bd00ff, #00e5ff, #39ff14) 1; }
          100% { border-image: linear-gradient(360deg, #ff007f, #bd00ff, #00e5ff, #39ff14) 1; }
        }
        .animate-border-spin {
          animation: borderSpin 2.0s linear infinite;
        }
      `}</style>

      {/* 1. Main Slide Presentation viewport under Zoom & Pan */}
      <div
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleBgMouseMove}
        onMouseUp={handleBgMouseUp}
        onMouseLeave={handleBgMouseUp}
        className={`fixed top-10 bottom-28 left-0 right-0 select-none bg-slate-950 overflow-hidden ${
          earthquakeActive ? "animate-earthquake" : ""
        }`}
        style={{
          zIndex: 10,
          cursor: isPanning ? "grabbing" : zoomLevel > 1.0 ? "grab" : "default"
        }}
      >
        {/* Screen-wide Neon Laser Border Chaser Overlay */}
        {neonBorderActive && (
          <div className="absolute inset-0 pointer-events-none z-40 border-[5px] border-transparent">
            <div className="absolute inset-0 border-[5px] border-pink-500 animate-border-spin blur-xs" />
            <div className="absolute inset-0 border-2 border-indigo-400 animate-border-spin" />
          </div>
        )}

        {/* A. Screenshare Presenter */}
        {presentationSource === "screenshare" && (
          <ScreenSharePresenter
            zoomLevel={zoomLevel}
            zoomOffset={zoomOffset}
            onStreamStatusChange={setIsStreamActive}
          />
        )}

        {/* B. PDF Presenter */}
        {presentationSource === "pdf" && (
          <PdfPresenter
            pdfFileUrl={pdfFileUrl}
            currentPage={pdfCurrentPage}
            onDocumentLoaded={(pages) => {
              setPdfNumPages(pages);
              setPdfCurrentPage(1);
            }}
            zoomLevel={zoomLevel}
            zoomOffset={zoomOffset}
          />
        )}

        {/* C. Images Presenter */}
        {presentationSource === "images" && (
          <div className="absolute inset-0 bg-slate-950 overflow-hidden">
            {imageUrls.length > 0 ? (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{
                  transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: "0 0",
                  transition: "transform 0.05s ease-out"
                }}
              >
                <img
                  src={imageUrls[currentImageIndex]}
                  alt={`Slide ${currentImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain shadow-2xl border border-slate-900 bg-white"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                <p className="text-sm font-semibold">업로드된 슬라이드 이미지가 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* D. Simulator Presenter */}
        {presentationSource === "simulator" && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            style={{
              transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "0 0",
              transition: "transform 0.05s ease-out"
            }}
          >
            {renderSimulatorBackground()}
          </div>
        )}
      </div>

      {/* 2. Biz Mode Spotlight Overlay (Using dynamic spotlightRadius) */}
      {mode === "biz" && spotlightActive && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-75"
          style={{
            zIndex: 25,
            background: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, transparent 100%, rgba(15, 23, 42, 0.75) 100%)`,
            backdropFilter: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, transparent 100%, blur(8px) 100%)`,
            WebkitBackdropFilter: `radial-gradient(circle ${spotlightRadius}px at ${cursorPos.x}px ${cursorPos.y}px, transparent 100%, blur(8px) 100%)`
          }}
        />
      )}

      {/* 3. Drawing Canvas Engine (CONTAINED AND CLIPPED inside fixed bounds for coordinate sync & no leaks) */}
      <div className="fixed top-10 bottom-28 left-0 right-0 pointer-events-none overflow-hidden" style={{ zIndex: 30 }}>
        <DrawingCanvas
          strokes={currentStrokes}
          setStrokes={setCurrentStrokes}
          isDrawing={isDrawing}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          smartSnap={isAiSketchActive ? false : smartSnap}
          mode={mode}
          zoomLevel={zoomLevel}
          zoomOffset={zoomOffset}
          currentStamp={currentStamp}
          onStampPlaced={handleStampPlaced}
          isAreaZoomActive={isAreaZoomActive}
          onAreaZoomSelected={handleAreaZoomSelected}
          autoFadeActive={isAiSketchActive ? false : autoFadeActive}
          onDrawStart={(speed) => effectsRef.current?.startScribbleSound(speed)}
          onDrawStop={() => effectsRef.current?.stopScribbleSound()}
          onSnapSuccess={() => effectsRef.current?.playAudioPreset("ding")}
        />
      </div>

      {/* 4. Interactive Effects Component (CONTAINED AND CLIPPED inside fixed bounds for coordinate sync & no leaks) */}
      <div className="fixed top-10 bottom-28 left-0 right-0 pointer-events-none overflow-hidden" style={{ zIndex: 35 }}>
        <InteractiveEffects
          ref={effectsRef}
          stamps={currentStamps}
          zoomLevel={zoomLevel}
          zoomOffset={zoomOffset}
          soundEnabled={soundEnabled}
          isEffectsInteractive={isEffectsInteractive}
          aiEffectScale={aiEffectScale}
        />
      </div>

      {/* 4.5. Floating Zoom Reset Button (Visible when zoomLevel > 1.0 to assist returning from area zoom) */}
      {zoomLevel > 1.0 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-650 via-pink-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-black text-sm rounded-full shadow-2xl border border-red-400/20 transition-all duration-300 hover:scale-105 active:scale-95"
            title="ESC 키를 눌러도 스마트 줌을 복구할 수 있습니다"
          >
            <span className="text-base">❌</span>
            <span>스마트 줌 화면 복원 (Reset)</span>
            <span className="ml-1 px-1.5 py-0.5 bg-black/40 text-[10px] rounded text-slate-350 border border-white/10">ESC</span>
          </button>
        </div>
      )}

      {/* 5. Mini Floating Dock Controller UI */}
      <FloatingToolbar
        isDrawing={isDrawing}
        setIsDrawing={setIsDrawing}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        smartSnap={smartSnap}
        setSmartSnap={setSmartSnap}
        spotlightActive={spotlightActive}
        setSpotlightActive={setSpotlightActive}
        currentStamp={currentStamp}
        setCurrentStamp={setCurrentStamp}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        clearCanvas={handleClearPageStrokes}
        presentationSource={presentationSource}
        setPresentationSource={setPresentationSource}
        zoomLevel={zoomLevel}
        resetZoom={handleResetZoom}
        onPdfUpload={handlePdfUpload}
        onImagesUpload={handleImagesUpload}
        currentPage={getCurrentPageNumber()}
        totalPages={getTotalPagesNumber()}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        triggerConfetti={handleTriggerConfetti}
        isAreaZoomActive={isAreaZoomActive}
        setIsAreaZoomActive={setIsAreaZoomActive}
        customText={customText}
        setCustomText={setCustomText}
        customShape={customShape}
        setCustomShape={setCustomShape}
        autoFadeActive={autoFadeActive}
        setAutoFadeActive={setAutoFadeActive}
        presetStamps={presetStamps}
        setPresetStamps={setPresetStamps}
        handleEditPresetLabel={handleEditPresetLabel}
        cursorTrailType={cursorTrailType}
        setCursorTrailType={setCursorTrailType}
        neonBorderActive={neonBorderActive}
        setNeonBorderActive={setNeonBorderActive}
        triggerEmojiBurst={handleTriggerEmojiBurst}
        triggerMeteorShower={handleTriggerMeteorShower}
        triggerScreenFreeze={handleTriggerScreenFreeze}
        triggerEarthquake={handleTriggerEarthquake}
        showSpinner={showSpinner}
        setShowSpinner={setShowSpinner}
        showTimer={showTimer}
        setShowTimer={setShowTimer}
        customEffects={customEffects}
        setCustomEffects={setCustomEffects}
        isAiSketchActive={isAiSketchActive}
        setIsAiSketchActive={setIsAiSketchActive}
        isAiConverting={isAiConverting}
        setIsAiConverting={setIsAiConverting}
        triggerCustomEffect={handleTriggerCustomEffect}
        stampScale={stampScale}
        setStampScale={setStampScale}
        aiEffectScale={aiEffectScale}
        setAiEffectScale={setAiEffectScale}
      />

      {/* 6. Keys Shortcut Heads-Up Display (HUD) */}
      <ShortcutHUD isVisible={showHUD} mode={mode} />

      {/* 7. Zoom HUD notification */}
      {zoomLevel > 1.0 && (
        <div className="fixed top-12 left-4 z-50 bg-slate-900/90 border border-yellow-500/30 text-yellow-400 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-lg shadow-black/40 flex items-center gap-2">
          <span>스마트 줌 활성화: {Math.round(zoomLevel * 100)}%</span>
          <span className="text-[10px] text-slate-500">| 우클릭 드래그로 화면 이동, ESC로 초기화</span>
        </div>
      )}

      {/* 8. Active Stream Quick Keybind Bypass Notice */}
      {presentationSource === "screenshare" && isStreamActive && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-950/80 border border-indigo-500/20 text-indigo-300 rounded-xl px-4 py-2.5 text-xs shadow-2xl flex flex-col gap-1 select-none">
          <span className="font-bold text-slate-200">단일 모니터 슬라이드 자동 제어 연동</span>
          <span className="text-[10px] opacity-75">일반 마우스 상태에서 방향키(← / →)를 누르면</span>
          <span className="text-[10px] opacity-75">뒤에 가려진 PPT 슬라이드가 자동으로 넘어갑니다.</span>
        </div>
      )}

      {/* 9. Drag and Drop Overlay Guide */}
      {isDragOver && (
        <div className="absolute inset-0 z-[100] bg-indigo-950/85 backdrop-blur-sm border-4 border-dashed border-indigo-500 m-4 rounded-3xl flex flex-col items-center justify-center text-white gap-4 pointer-events-none animate-fade-in">
          <FileUp className="h-16 w-16 text-indigo-400 animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight">발표용 PDF 또는 슬라이드 이미지들을 여기에 떨어뜨려주세요</h2>
          <p className="text-sm text-indigo-300/80">로컬 브라우저 보안 메모리에서 안전하게 파싱됩니다.</p>
        </div>
      )}

      {/* 🎡 10. Spinner Wheel Overlay Modal (Gamification) */}
      {showSpinner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-w-2xl w-full relative">
            <button 
              onClick={() => {
                setShowSpinner(false);
                setWinnerName(null);
              }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <h2 className="text-xl font-black text-slate-100 flex items-center justify-center gap-1.5">
                🎡 랜덤 돌림판 추첨기
              </h2>
              <p className="text-xs text-slate-500 mt-1">참가 후보 이름을 입력하고 돌림판을 돌려보세요!</p>
            </div>

            <div className="flex gap-8 items-center justify-center">
              {/* Spinner Wheel Visual Area */}
              <div className="relative w-80 h-80 flex-shrink-0 flex items-center justify-center">
                {/* Arrow Pointer indicator at top */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-x-[10px] border-x-transparent border-t-[20px] border-t-pink-500 filter drop-shadow-md" />
                
                <div 
                  className="w-full h-full rounded-full border-4 border-slate-950 shadow-2xl relative overflow-hidden transition-transform duration-75"
                  style={{
                    transform: `rotate(${spinAngle}deg)`,
                    background: `conic-gradient(${
                      spinnerNames.split(",").map(n => n.trim()).filter(Boolean).map((_name, i, arr) => {
                        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6"];
                        const color = colors[i % colors.length];
                        const angle = 360 / arr.length;
                        return `${color} ${i * angle}deg ${(i + 1) * angle}deg`;
                      }).join(", ")
                    })`
                  }}
                >
                  {/* Overlay labels inside wheel slices */}
                  {spinnerNames.split(",").map(n => n.trim()).filter(Boolean).map((name, i, arr) => {
                    const angle = 360 / arr.length;
                    const rot = i * angle + (angle / 2) - 90; // Offset by -90 to align conic-gradient 12-o-clock with rotate 3-o-clock
                    return (
                      <div 
                        key={i}
                        className="absolute top-1/2 left-1/2 origin-center text-[10px] font-black text-slate-900 pointer-events-none select-none tracking-tight text-center"
                        style={{
                          transform: `translate(-50%, -50%) rotate(${rot}deg) translate(82px) rotate(90deg)`,
                          maxWidth: "60px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {name}
                      </div>
                    );
                  })}
                </div>
                
                {/* Center core lock */}
                <div className="absolute w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-700 z-10 shadow-lg" />
              </div>

              {/* Setting Names Input box */}
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase">후보자 목록 (쉼표 분리)</label>
                <textarea
                  value={spinnerNames}
                  onChange={(e) => setSpinnerNames(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none h-40 resize-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 placeholder-slate-700"
                  placeholder="홍길동, 이순신, 세종대왕..."
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-col gap-2.5">
              {winnerName && (
                <div className="bg-pink-500/10 border border-pink-500/30 text-pink-450 rounded-xl py-2.5 text-center text-xs font-black animate-bounce">
                  🎉 당첨자: <span className="underline underline-offset-4 text-white font-extrabold">{winnerName}</span>님!
                </div>
              )}
              <button
                onClick={() => {
                  setWinnerName(null);
                  setIsSpinning(true);
                }}
                disabled={isSpinning}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🎡 돌림판 돌리기 (Spin)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⏱️ 11. Floating Countdown Timer Widget (Gamification: Doubled visual size to w-28 h-28) */}
      {showTimer && (
        <div className="fixed top-14 right-4 z-50 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl flex items-center gap-6 select-none animate-fade-in backdrop-blur-md pointer-events-auto">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            {/* SVG Ring Path Scale-up */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
              <circle 
                cx="56" cy="56" r="48"
                className="stroke-slate-850 fill-none" 
                strokeWidth="5"
              />
              <circle 
                cx="56" cy="56" r="48"
                className={`fill-none transition-all duration-1000 ${
                  timerSecondsLeft / timerDuration <= 0.2 ? "stroke-rose-500 animate-pulse" : "stroke-pink-500"
                }`}
                strokeWidth="5"
                strokeDasharray="301.4"
                strokeDashoffset={301.4 - (301.4 * timerSecondsLeft) / timerDuration}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-2xl font-mono font-black text-slate-100 animate-pulse">
              {timerSecondsLeft}s
            </span>
          </div>

          {/* Timer details and controls */}
          <div className="flex flex-col gap-3.5 text-left">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase">제한 시간 설정</span>
              <div className="flex items-center gap-1">
                {[30, 60, 180].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => {
                      setTimerDuration(dur);
                      setTimerSecondsLeft(dur);
                      setTimerIsRunning(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                      timerDuration === dur 
                        ? "bg-pink-500/20 border-pink-500/50 text-pink-450" 
                        : "bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {dur === 60 ? "1분" : dur === 180 ? "3분" : "30초"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimerIsRunning(!timerIsRunning)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex-1 text-center border shadow-md ${
                  timerIsRunning 
                    ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-400" 
                    : "bg-pink-600 hover:bg-pink-500 border-pink-500 text-white"
                }`}
              >
                {timerIsRunning ? "일시정지" : "시작 (Start)"}
              </button>
              <button
                onClick={() => {
                  setTimerSecondsLeft(timerDuration);
                  setTimerIsRunning(false);
                }}
                className="p-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="초기화"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
