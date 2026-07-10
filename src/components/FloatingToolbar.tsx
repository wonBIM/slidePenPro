import React, { useRef, useState, useEffect } from "react";
import {
  PenTool,
  Sparkles,
  Volume2,
  VolumeX,
  Trash2,
  ZoomIn,
  Layout,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Type,
  Maximize,
  Circle,
  MessageSquare,
  Award,
  Plus,
  X,
  Clock,
  Settings,
  Edit2,
  Check
} from "lucide-react";

import { invoke } from "@tauri-apps/api/tauri";

interface PresetStamp {
  id: string;
  label: string;
}

interface FloatingToolbarProps {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
  strokeWidth: number;
  setStrokeWidth: (width: number) => void;
  smartSnap: boolean;
  setSmartSnap: (val: boolean) => void;
  spotlightActive: boolean;
  setSpotlightActive: (val: boolean) => void;
  currentStamp: string | null;
  setCurrentStamp: (stamp: string | null) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  clearCanvas: () => void;
  presentationSource: "simulator" | "screenshare" | "pdf" | "images";
  setPresentationSource: (source: "simulator" | "screenshare" | "pdf" | "images") => void;
  zoomLevel: number;
  resetZoom: () => void;
  onPdfUpload: (url: string) => void;
  onImagesUpload: (urls: string[]) => void;
  // Slide controls
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  // Confetti, Area Zoom, Custom Text & Shapes
  triggerConfetti: () => void;
  isAreaZoomActive: boolean;
  setIsAreaZoomActive: (val: boolean) => void;
  customText: string;
  setCustomText: (text: string) => void;
  customShape: "badge" | "circle" | "bubble" | "star";
  setCustomShape: (shape: "badge" | "circle" | "bubble" | "star") => void;
  // Auto fade & Dynamic Stamps
  autoFadeActive: boolean;
  setAutoFadeActive: (val: boolean) => void;
  presetStamps: PresetStamp[];
  setPresetStamps: React.Dispatch<React.SetStateAction<PresetStamp[]>>;
  handleEditPresetLabel: (id: string, newLabel: string) => void;
  // ✨ Magic Trails & Scenic Visual Effects Props
  cursorTrailType: "none" | "star" | "fire" | "bubble";
  setCursorTrailType: (type: "none" | "star" | "fire" | "bubble") => void;
  neonBorderActive: boolean;
  setNeonBorderActive: (val: boolean) => void;
  triggerEmojiBurst: () => void;
  triggerScreenFreeze: () => void;
  triggerMeteorShower: () => void;
  triggerEarthquake: () => void;
  // 🎡 Gamification spinner/timer hooks
  showSpinner: boolean;
  setShowSpinner: (val: boolean) => void;
  showTimer: boolean;
  setShowTimer: (val: boolean) => void;
  // 🪄 AI Custom Effects
  customEffects: any[];
  setCustomEffects: React.Dispatch<React.SetStateAction<any[]>>;
  isAiSketchActive: boolean;
  setIsAiSketchActive: (val: boolean) => void;
  isAiConverting: boolean;
  setIsAiConverting: (val: boolean) => void;
  triggerCustomEffect: (effect: any) => void;
  stampScale: number;
  setStampScale: (scale: number) => void;
  aiEffectScale: number;
  setAiEffectScale: (scale: number) => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  isDrawing,
  setIsDrawing,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  smartSnap,
  setSmartSnap,
  spotlightActive,
  setSpotlightActive,
  currentStamp,
  setCurrentStamp,
  soundEnabled,
  setSoundEnabled,
  clearCanvas,
  presentationSource,
  setPresentationSource,
  zoomLevel,
  resetZoom,
  onPdfUpload,
  onImagesUpload,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  triggerConfetti,
  isAreaZoomActive,
  setIsAreaZoomActive,
  customText,
  setCustomText,
  customShape,
  setCustomShape,
  autoFadeActive,
  setAutoFadeActive,
  presetStamps,
  setPresetStamps,
  handleEditPresetLabel,
  cursorTrailType,
  setCursorTrailType,
  neonBorderActive,
  setNeonBorderActive,
  triggerEmojiBurst,
  triggerMeteorShower,
  triggerScreenFreeze,
  triggerEarthquake,
  showSpinner,
  setShowSpinner,
  showTimer,
  setShowTimer,
  customEffects,
  setCustomEffects,
  isAiSketchActive,
  setIsAiSketchActive,
  isAiConverting,
  setIsAiConverting,
  triggerCustomEffect,
  stampScale,
  setStampScale,
  aiEffectScale,
  setAiEffectScale
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false); // Sticker Popover
  const [showPenPanel, setShowPenPanel] = useState(false); // Pen Settings Popover
  const [showEffectsPanel, setShowEffectsPanel] = useState(false); // Effects Tab Popover
  const [effectsTab, setEffectsTab] = useState<"particles" | "scenes" | "custom">("particles"); // Effects tab state
  const [editingStampId, setEditingStampId] = useState<string | null>(null);
  
  // 🪄 AI Custom Effect Creation local states
  const [showAiCustomPanel, setShowAiCustomPanel] = useState(false); // Standalone AI Custom Panel toggle
  const [promptHint, setPromptHint] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [creationStep, setCreationStep] = useState<"idle" | "sketching" | "naming">("idle");
  const [selectedShape, setSelectedShape] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<"crystal" | "jelly" | "gold">("crystal");
  const [selectedAnimation, setSelectedAnimation] = useState<"explosion" | "rain" | "float">("explosion");
  const [effectName, setEffectName] = useState("");

  // Sync creationStep with isAiSketchActive to prevent popover closing resets
  useEffect(() => {
    if (isAiSketchActive && creationStep === "idle") {
      setCreationStep("sketching");
    } else if (!isAiSketchActive && creationStep !== "idle") {
      setCreationStep("idle");
    }
  }, [isAiSketchActive, creationStep]);
  
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file);
      onPdfUpload(url);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      onImagesUpload(urls);
    }
  };

  // Add custom typed text into preset stamp list
  const handleAddPresetStamp = () => {
    if (customText.trim()) {
      const newId = `custom-${Math.random().toString(36).substring(7)}`;
      const newLabel = customText.trim();
      setPresetStamps((prev) => [...prev, { id: newId, label: newLabel }]);
      setCustomText(""); // clear input box
    }
  };

  // Delete preset stamp from list
  const handleDeletePresetStamp = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    setPresetStamps((prev) => prev.filter((stamp) => stamp.id !== idToDelete));
    if (currentStamp === idToDelete) {
      setCurrentStamp(null);
    }
  };

  // 🪄 AI Custom Effect Handlers
  const handleStartSketching = () => {
    setCreationStep("sketching");
    setIsAiSketchActive(true);
    setIsDrawing(true); // Automatically turn on drawing mode!
    setCurrentStamp(null); // Clear stamp mode
    setIsAreaZoomActive(false); // Clear zoom mode
    clearCanvas(); // Clear canvas so the user has a fresh canvas
  };

  const handleCancelCreation = () => {
    setCreationStep("idle");
    setIsAiSketchActive(false);
    setIsDrawing(false);
    clearCanvas();
  };

  const getCanvasBase64 = (): string | null => {
    const canvas = document.getElementById("drawing-canvas") as HTMLCanvasElement;
    if (!canvas) return null;
    
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;
    
    // Solid white background
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);
    
    const dataUrl = tempCanvas.toDataURL("image/png");
    return dataUrl.replace(/^data:image\/png;base64,/, "");
  };

  const fetchAndMakeTransparent = async (url: string): Promise<string> => {
    const resp = await fetch(url);
    const blob = await resp.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            // Key out black pixels
            if (r < 45 && g < 45 && b < 45) {
              data[i+3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleConvertSketch = async () => {
    console.log("[handleConvertSketch] starting conversion...");
    const base64Img = getCanvasBase64();
    console.log("[handleConvertSketch] base64Img length:", base64Img ? base64Img.length : "null");
    if (!base64Img) {
      alert("스케치 캔버스를 찾을 수 없습니다.");
      return;
    }

    setIsAiConverting(true);

    try {
      console.log("[handleConvertSketch] invoking call_gemini_api vision...");
      // 1. Call Gemini 1.5 Flash Vision backend to analyze the sketch
      const recognizedText = await invoke<string>("call_gemini_api", {
        action: "vision",
        base64Image: base64Img,
        prompt: promptHint
      });

      const match = recognizedText.match(/\(([^)]+)\)/);
      const englishWord = match ? match[1].trim() : recognizedText;
      const koreanWord = recognizedText.split("(")[0].trim();

      setSelectedShape(koreanWord);
      setEffectName(`${koreanWord} AI 이펙트`);

      // 2. Call Gemini Imagen 3 backend to generate the image
      const stylePromptMap = {
        crystal: "crystal neon style with glowing colorful light vectors, translucent glassy surfaces, sharp emissive edges",
        jelly: "cute 3D jelly plastic style, soft glossy texture, highlights, smooth rounded shape, vibrant colors",
        gold: "luxury 3D polished gold style, metallic gold reflection, shiny sparkles, rich bevel edges"
      };
      
      const chosenStyle = stylePromptMap[selectedStyle as keyof typeof stylePromptMap] || stylePromptMap.crystal;
      let imagenPrompt = `A single standalone isolated 3D asset icon of a ${englishWord} in ${chosenStyle}`;
      if (promptHint.trim()) {
        imagenPrompt += `, incorporating element details: ${promptHint.trim()}`;
      }
      imagenPrompt += `, black solid background, center aligned, mobile game ui icon asset style, highly detailed digital art.`;

      const rawBase64Url = await invoke<string>("call_gemini_api", {
        action: "generate",
        prompt: imagenPrompt
      });

      // 3. Make transparent PNG and read as base64
      const transparentUrl = await fetchAndMakeTransparent(rawBase64Url);
      setGeneratedImageUrl(transparentUrl);
      
      // Proceed to naming step
      setCreationStep("naming");
    } catch (error: any) {
      alert(`AI 변환 실패: ${error.message || error}`);
    } finally {
      setIsAiConverting(false);
    }
  };

  const handleRegisterEffect = () => {
    const newEffect = {
      id: Math.random().toString(36).substring(7),
      name: effectName.trim() || `${selectedShape} 효과`,
      shape: selectedShape || "custom",
      style: selectedStyle,
      animation: selectedAnimation,
      imageUrl: generatedImageUrl,
      createdAt: Date.now()
    };
    setCustomEffects((prev) => [...prev, newEffect]);
    clearCanvas();
    setIsAiSketchActive(false);
    setCreationStep("idle");
    setPromptHint("");
    setGeneratedImageUrl("");
    if (soundEnabled) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const handleDeleteCustomEffect = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    setCustomEffects((prev) => prev.filter((eff) => eff.id !== idToDelete));
  };

  const handleToggleEffectAnimation = (e: React.MouseEvent, id: string, currentAnim: "explosion" | "rain" | "float") => {
    e.stopPropagation();
    const animOrder: ("explosion" | "rain" | "float")[] = ["explosion", "rain", "float"];
    const currentIndex = animOrder.indexOf(currentAnim);
    const nextAnim = animOrder[(currentIndex + 1) % animOrder.length];
    setCustomEffects((prev) =>
      prev.map((eff) => (eff.id === id ? { ...eff, animation: nextAnim } : eff))
    );
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ease-out select-none">
      
      {/* 0.1 Dynamic Sticker Popover Panel */}
      {showStickerPanel && !isCollapsed && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 z-50 w-[290px] backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-[11px] font-bold text-slate-200">🎯 스티커 선택 및 편집</span>
            <button
              onClick={() => {
                setShowStickerPanel(false);
                setEditingStampId(null);
              }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 💡 Sticker ON/OFF State Indicator & Toggle Switch! */}
          <div className="flex items-center justify-between bg-slate-950/70 p-2 rounded-lg border border-slate-850">
            <span className="text-[10px] text-slate-300 font-extrabold tracking-tight">
              {currentStamp ? `🟢 기능 켬 (${currentStamp === "custom" ? "커스텀" : "프리셋"})` : "🔴 스티커 기능 꺼짐"}
            </span>
            {currentStamp && (
              <button
                onClick={() => {
                  setCurrentStamp(null);
                }}
                className="px-2 py-0.5 bg-rose-600/35 hover:bg-rose-500 border border-rose-500/40 text-rose-300 hover:text-white rounded text-[9px] font-black transition-all cursor-pointer"
                title="스티커 찍기 중단 (일반 마우스 상태로 복구)"
              >
                기능 끄기 (OFF)
              </button>
            )}
          </div>

          {/* 📏 Sticker Size Slider */}
          <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold tracking-tight">
              <span>📏 스티커 크기 설정</span>
              <span className="text-pink-400 font-mono">{Math.round(stampScale * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={stampScale}
              onChange={(e) => setStampScale(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
          </div>

          {/* Stckers preset lists */}
          <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-0.5 no-scrollbar">
            {presetStamps.map((stamp) => {
              const isSelected = currentStamp === stamp.id || (stamp.id.startsWith("custom") && currentStamp === "custom" && customText === stamp.label);
              const isEditing = editingStampId === stamp.id;

              return (
                <div
                  key={stamp.id}
                  className={`flex h-8 items-center justify-between gap-1.5 px-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-pink-500/15 border-pink-500/40 text-pink-400 font-semibold"
                      : "bg-slate-950/60 border-slate-900 text-slate-300 hover:bg-slate-800/30"
                  }`}
                >
                  {isEditing ? (
                    <input
                      type="text"
                      value={stamp.label}
                      onChange={(e) => handleEditPresetLabel(stamp.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setEditingStampId(null);
                      }}
                      onBlur={() => setEditingStampId(null)}
                      autoFocus
                      className="bg-slate-800/80 text-xs font-semibold outline-none flex-1 border-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-0.5 text-slate-100"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        if (stamp.id.startsWith("custom-")) {
                          setCurrentStamp("custom");
                          setCustomText(stamp.label);
                        } else {
                          setCurrentStamp(stamp.id);
                          setCustomText("");
                        }
                      }}
                      className="flex-1 text-left text-xs truncate py-1 font-semibold"
                      title="클릭하여 이 스티커 선택"
                    >
                      {stamp.label}
                    </button>
                  )}

                  {/* Actions Area */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditing) {
                          setEditingStampId(null);
                        } else {
                          setEditingStampId(stamp.id);
                        }
                      }}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-pink-400 rounded transition-colors"
                      title="텍스트 문구 편집"
                    >
                      {isEditing ? <Check className="h-3 w-3" /> : <Edit2 className="h-3 w-3" />}
                    </button>

                    <button
                      onClick={(e) => handleDeletePresetStamp(e, stamp.id)}
                      className="p-1 hover:bg-slate-800 text-slate-500 hover:text-rose-400 rounded transition-colors"
                      title="스티커 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* New custom stamp adder box */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-850">
            <Type className="h-3.5 w-3.5 text-pink-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="새 스티커 추가..."
              value={customText}
              onChange={(e) => {
                const val = e.target.value;
                setCustomText(val);
                if (val) {
                  setCurrentStamp("custom");
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddPresetStamp();
              }}
              className="bg-transparent text-[11px] text-slate-200 outline-none flex-1 placeholder-slate-700 min-w-0"
            />
            {customText.trim() && (
              <button
                onClick={handleAddPresetStamp}
                className="p-1 bg-pink-600 hover:bg-pink-500 text-white rounded transition-colors"
                title="목록에 추가"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Shape selection chip selector */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-1.5 bg-slate-950/20 px-1 rounded-lg">
            <span className="text-[9px] text-slate-500 font-semibold">스티커 모양</span>
            <div className="flex items-center gap-0.5 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setCustomShape("badge")}
                className={`p-1 rounded transition-all cursor-pointer ${
                  customShape === "badge" ? "bg-slate-700 text-pink-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title="배지 사각형 모양"
              >
                <Layout className="h-3 w-3" />
              </button>
              <button
                onClick={() => setCustomShape("circle")}
                className={`p-1 rounded transition-all cursor-pointer ${
                  customShape === "circle" ? "bg-slate-700 text-pink-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title="원형 모양"
              >
                <Circle className="h-3 w-3" />
              </button>
              <button
                onClick={() => setCustomShape("bubble")}
                className={`p-1 rounded transition-all cursor-pointer ${
                  customShape === "bubble" ? "bg-slate-700 text-pink-400" : "text-slate-500 hover:text-slate-300"
                }`}
                title="말풍선 모양"
              >
                <MessageSquare className="h-3 w-3" />
              </button>
              <button
                onClick={() => setCustomShape("star")}
                className={`p-1 rounded transition-all cursor-pointer ${
                  customShape === "star" ? "bg-slate-700 text-pink-450" : "text-slate-500 hover:text-slate-300"
                }`}
                title="별 모양"
              >
                <Award className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 0.2 Dynamic Pen Settings Popover Panel */}
      {isDrawing && showPenPanel && !isCollapsed && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800/80 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-3 z-50 w-[260px] backdrop-blur-md animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-[11px] font-bold text-slate-200">🎨 펜 및 브러시 설정</span>
            <button
              onClick={() => setShowPenPanel(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Presets */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-semibold">색상 선택</span>
            <div className="flex items-center gap-1.5 bg-slate-950/65 p-2 rounded-lg border border-slate-850">
              {[
                { name: "레드", value: "#ef4444" },
                { name: "블루", value: "#3b82f6" },
                { name: "화이트", value: "#ffffff" }
              ].map((color) => {
                const isSelected = strokeColor === color.value;
                return (
                  <button
                    key={color.value}
                    onClick={() => {
                      setStrokeColor(color.value);
                      if (strokeWidth === 16 && strokeColor.startsWith("rgba")) {
                        setStrokeWidth(5); // restore default thin pen
                      }
                    }}
                    className={`h-6 w-6 rounded-full border transition-all hover:scale-110 cursor-pointer ${
                      isSelected ? "border-white scale-110 ring-2 ring-violet-500/30" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                );
              })}

              <div className="h-6 w-px bg-slate-800 mx-1" />

              <button
                onClick={() => {
                  setStrokeColor("rgba(234, 179, 8, 0.45)"); // Yellow highlighter
                  setStrokeWidth(16);
                }}
                className={`flex items-center justify-center h-6 px-2 rounded-full border text-[9px] font-extrabold tracking-tight transition-all hover:scale-105 cursor-pointer flex-1 ${
                  strokeColor.startsWith("rgba")
                    ? "bg-yellow-400/30 border-yellow-400 text-yellow-400 scale-105 shadow-md shadow-yellow-400/10"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
                title="형광펜 그리기 (두껍고 투명)"
              >
                🖍️ 형광펜
              </button>
            </div>
          </div>

          {/* Thickness Slider */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-semibold">브러시 두께</span>
            <div className="flex items-center gap-2 bg-slate-950/65 p-2 rounded-lg border border-slate-850">
              <input
                type="range"
                min="2"
                max="30"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer rounded-lg bg-slate-700 accent-violet-500"
              />
              <span className="text-[10px] text-slate-400 w-3 text-right font-mono font-bold">{strokeWidth}</span>
            </div>
          </div>

          {/* Auto Fade Switch */}
          <div className="flex items-center justify-between bg-slate-950/65 p-2 rounded-lg border border-slate-850">
            <span className="text-[10px] text-slate-400 font-semibold">선 자동 소멸 (2.5초)</span>
            <button
              onClick={() => setAutoFadeActive(!autoFadeActive)}
              className={`flex h-7 items-center gap-1 px-2.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                autoFadeActive
                  ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                  : "bg-slate-800 border-slate-700 text-slate-550"
              }`}
              title="필기 후 2.5초 후 자동으로 사라짐 토글"
            >
              <Clock className="h-3 w-3" />
              <span>{autoFadeActive ? "소멸 켬" : "소멸 끔"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 0.3 High-Quality Tabbed Effects Chooser Popover Panel */}
      {showEffectsPanel && !isCollapsed && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800/80 rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3.5 z-50 w-[310px] backdrop-blur-md animate-fade-in text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span className="text-sm font-black text-slate-200 flex items-center gap-1">✨ 시각 연출 및 장면 효과</span>
            <button
              onClick={() => setShowEffectsPanel(false)}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mini Tabs Switcher */}
          <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-850">
            <button
              onClick={() => setEffectsTab("particles")}
              className={`flex-1 text-center py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                effectsTab === "particles" ? "bg-slate-850 text-pink-400 shadow" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              🎉 리액션 & 커서
            </button>
            <button
              onClick={() => setEffectsTab("scenes")}
              className={`flex-1 text-center py-1.5 text-xs font-black rounded-md transition-all cursor-pointer ${
                effectsTab === "scenes" ? "bg-slate-850 text-pink-400 shadow" : "text-slate-500 hover:text-slate-350"
              }`}
            >
              🎬 장면 임팩트
            </button>
          </div>

          {/* TAB 1: Particles & Cursor Trails */}
          {effectsTab === "particles" && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <button
                onClick={() => {
                  triggerConfetti();
                  setShowEffectsPanel(false);
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white text-xs font-extrabold shadow-md shadow-pink-600/20 active:scale-95 transition-all cursor-pointer w-full"
              >
                <span>🎉 축하 폭죽 쇼</span>
              </button>

              <button
                onClick={() => {
                  triggerEmojiBurst();
                  setShowEffectsPanel(false);
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-pink-400 text-xs font-extrabold active:scale-95 transition-all cursor-pointer w-full"
              >
                <span>❤️ 하트 이모지 뿜뿜</span>
              </button>

              {/* Advanced Pointer Trails Selector */}
              <div className="flex flex-col gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold">마우스 포인터 궤적 이펙트</span>
                <select
                  value={cursorTrailType}
                  onChange={(e) => {
                    setCursorTrailType(e.target.value as any);
                    setShowEffectsPanel(false);
                  }}
                  className="bg-transparent text-xs text-slate-300 outline-none w-full cursor-pointer py-1 border-none font-sans font-black"
                >
                  <option value="none">❌ 마우스 효과 없음</option>
                  <option value="star">✨ 마법 은하수 별가루</option>
                  <option value="fire">🔥 이글이글 불꽃 포인터</option>
                  <option value="bubble">🫧 뽀글뽀글 비눗방울</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: Screen-wide Scene Impact Effects */}
          {effectsTab === "scenes" && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <button
                onClick={() => {
                  triggerScreenFreeze();
                  setShowEffectsPanel(false);
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-sky-950/80 border border-sky-800 hover:bg-sky-900 text-sky-300 text-xs font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="화면을 얼린 뒤 마우스로 클릭하면 유리창처럼 박살내기"
              >
                <span>🥶 화면 얼리기 & 깨기</span>
              </button>

              <button
                onClick={() => {
                  triggerEarthquake();
                  setShowEffectsPanel(false);
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-300 text-xs font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="화면 전체가 지진 난 것처럼 60fps 격렬히 쉐이크"
              >
                <span>🫨 화면 지진 흔들림</span>
              </button>

              <button
                onClick={() => {
                  triggerMeteorShower();
                  setShowEffectsPanel(false);
                }}
                className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-950/80 border border-indigo-800 hover:bg-indigo-900 text-indigo-300 text-xs font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="하늘에서 아름다운 별똥별들이 무리지어 쏟아짐"
              >
                <span>☄️ 밤하늘 은하수 유성우</span>
              </button>

              {/* Border Chaser Toggle */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-850 w-full">
                <span className="text-xs text-slate-400 font-bold">🚨 테두리 레이저 경보</span>
                <button
                  onClick={() => {
                    setNeonBorderActive(!neonBorderActive);
                    setShowEffectsPanel(false);
                  }}
                  className={`flex h-8 items-center gap-1 px-3 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                    neonBorderActive
                      ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-bold"
                      : "bg-slate-850 border-slate-750 text-slate-500"
                  }`}
                >
                  <span>{neonBorderActive ? "켬" : "끔"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 0.4 Standalone AI Custom popover panel */}
      {showAiCustomPanel && !isCollapsed && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-pink-500/30 rounded-2xl p-4.5 shadow-2xl flex flex-col gap-3.5 z-50 w-[320px] backdrop-blur-md animate-fade-in text-left">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-slate-200">🪄 AI 커스텀 이펙트</span>
              <span className="bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">PRO</span>
            </div>
            <button
              onClick={() => setShowAiCustomPanel(false)}
              className="text-slate-500 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
              {/* Spinner / Loading state */}
              {isAiConverting ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 bg-slate-950/60 rounded-xl border border-slate-850">
                  <div className="h-8 w-8 rounded-full border-3 border-pink-500 border-t-transparent animate-spin" />
                  <div className="text-xs text-slate-300 font-black text-center leading-relaxed">
                    AI가 스케치를 분석하여<br />
                    3D 투명 이미지 에셋을 제작하는 중...
                  </div>
                  <span className="text-[10px] text-slate-500">(약 5~10초 소요됩니다)</span>
                </div>
              ) : creationStep === "idle" ? (
                <>
                  {/* ✨ AI Effect Size Slider */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold tracking-tight">
                      <span>✨ AI 이펙트 크기 설정</span>
                      <span className="text-pink-400 font-mono">{Math.round(aiEffectScale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={aiEffectScale}
                      onChange={(e) => setAiEffectScale(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>

                  {/* Library List */}
                  <div className="flex flex-col gap-2 max-h-[170px] overflow-y-auto pr-1 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/80">
                    <div className="text-[10px] text-slate-500 font-black mb-1">내 커스텀 효과 라이브러리 ({customEffects.length})</div>
                    {customEffects.length === 0 ? (
                      <div className="text-center py-8 text-slate-650 text-xs leading-relaxed">
                        등록된 효과가 없습니다.<br />아래 버튼을 눌러 첫 AI 효과를 만들어 보세요!
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {customEffects.map((eff) => {
                          const styleMap = { crystal: "💎", jelly: "🧸", gold: "🌟" };
                          const animMap = { explosion: "🎆", rain: "🌧️", float: "🫧" };
                          return (
                            <button
                              key={eff.id}
                              onClick={() => {
                                triggerCustomEffect(eff);
                                setShowAiCustomPanel(false);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-850 hover:border-pink-500/50 hover:bg-slate-850/80 transition-all text-slate-300 hover:text-slate-100 group text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2 font-bold truncate max-w-[170px]">
                                {eff.imageUrl ? (
                                  <img src={eff.imageUrl} className="h-6 w-6 object-contain rounded bg-slate-950 p-0.5 border border-slate-800" />
                                ) : (
                                  <span>{styleMap[eff.style as keyof typeof styleMap]}</span>
                                )}
                                <span className="truncate text-xs">{eff.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={(e) => handleToggleEffectAnimation(e, eff.id, eff.animation)}
                                  className="text-[9px] px-1.5 py-0.5 bg-slate-950 text-slate-400 hover:text-pink-400 hover:border-pink-500/50 rounded-md border border-slate-850 transition-all cursor-pointer font-bold flex items-center gap-1"
                                  title="클릭하여 파티클 애니메이션 변경 (폭죽/비/둥실)"
                                >
                                  <span>{animMap[eff.animation as keyof typeof animMap]}</span>
                                  <span>{eff.animation === "explosion" ? "폭죽" : eff.animation === "rain" ? "비" : "둥실"}</span>
                                </button>
                                <button
                                  onClick={(e) => handleDeleteCustomEffect(e, eff.id)}
                                  className="text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none bg-transparent"
                                  title="삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleStartSketching}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white text-xs font-extrabold shadow-md shadow-pink-600/20 active:scale-95 transition-all cursor-pointer w-full mt-1"
                  >
                    <span>🎨 AI 스케치 그리기 시작</span>
                  </button>
                </>
              ) : creationStep === "sketching" ? (
                <div className="flex flex-col gap-3 bg-slate-950/60 p-3 rounded-xl border border-pink-500/20 animate-fade-in">
                  <div className="text-xs text-pink-400 font-bold leading-relaxed">
                    💡 화면에 원하시는 모양의 스케치를 자유롭게 그린 후 아래 힌트 단어를 입력하세요.
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-500 font-bold">스케치 힌트/단어 (예: 비행기, 자동차, 하트)</span>
                    <input
                      type="text"
                      value={promptHint}
                      onChange={(e) => setPromptHint(e.target.value)}
                      placeholder="무엇을 그렸는지 힌트를 한글로 적어주세요..."
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500/50 w-full"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleConvertSketch}
                      className="flex-1 flex h-10.5 items-center justify-center gap-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-lg shadow-pink-600/10 border-none"
                    >
                      <span>🪄 스케치 완료 & AI 변환</span>
                    </button>
                    <button
                      onClick={handleCancelCreation}
                      className="px-4.5 flex h-10.5 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold transition-all cursor-pointer border-none"
                    >
                      <span>취소</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Naming and Style Customization Step
                <div className="flex flex-col gap-3 bg-slate-950/50 p-3 rounded-xl border border-pink-500/20 max-h-[350px] overflow-y-auto animate-fade-in">
                  {/* Generated Image Preview */}
                  {generatedImageUrl && (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-bold">AI 생성 이미지 미리보기</span>
                      <img src={generatedImageUrl} className="h-28 w-28 object-contain rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-inner" />
                    </div>
                  )}

                  {/* Style Select */}
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold">
                    <span>1. AI 렌더링 스타일</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {[
                        { id: "crystal", label: "💎 크리스탈" },
                        { id: "jelly", label: "🧸 젤리" },
                        { id: "gold", label: "🌟 골드" }
                      ].map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setSelectedStyle(st.id as any)}
                          className={`py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                            selectedStyle === st.id
                              ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-black shadow"
                              : "bg-slate-950 border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <div>{st.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation Select */}
                  <div className="flex flex-col gap-1.5 text-[10px] text-slate-500 font-bold">
                    <span>2. 파티클 애니메이션 연출</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      {[
                        { id: "explosion", label: "🎆 폭죽" },
                        { id: "rain", label: "🌧️ 비" },
                        { id: "float", label: "🫧 둥실" }
                      ].map((an) => (
                        <button
                          key={an.id}
                          onClick={() => setSelectedAnimation(an.id as any)}
                          className={`py-1.5 rounded-md text-xs font-bold border transition-all cursor-pointer ${
                            selectedAnimation === an.id
                              ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-black shadow"
                              : "bg-slate-950 border-transparent text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          <div>{an.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name Input */}
                  <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-bold">
                    <span>3. 효과 이름 지정</span>
                    <input
                      type="text"
                      value={effectName}
                      onChange={(e) => setEffectName(e.target.value)}
                      placeholder="효과 이름을 적어주세요..."
                      className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500/50"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2.5 border-t border-slate-850/80">
                    <button
                      onClick={handleRegisterEffect}
                      className="flex-1 flex h-10.5 items-center justify-center gap-1 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-pink-600/10 border-none"
                    >
                      <span>💾 라이브러리 등록</span>
                    </button>
                    <button
                      onClick={handleCancelCreation}
                      className="px-4.5 flex h-10.5 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black transition-all cursor-pointer border-none"
                    >
                      <span>취소</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      )}

      {/* 1. Main Floating Toolbar Panel */}
      {isCollapsed ? (
        <button
          onClick={() => setIsCollapsed(false)}
          className="flex h-13 w-13 items-center justify-center rounded-full border border-violet-500/30 bg-slate-900/90 text-violet-400 shadow-lg shadow-violet-500/10 transition-transform hover:scale-115 active:scale-95 cursor-pointer"
          title="툴바 열기"
        >
          <PenTool className="h-5.5 w-5.5 animate-pulse" />
        </button>
      ) : (
        <div className="glass-panel flex flex-wrap items-center justify-center gap-3 rounded-3xl p-3 md:p-3.5 px-6 max-w-[95vw] shadow-2xl border border-slate-800/80 hover:border-violet-500/20 transition-all duration-300">
          
          {/* Area Zoom & Drawing Mode Triggers */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const nextState = !isAreaZoomActive;
                setIsAreaZoomActive(nextState);
                if (nextState) {
                  setIsDrawing(false);
                  setCurrentStamp(null);
                  setShowStickerPanel(false);
                  setShowPenPanel(false);
                  setShowEffectsPanel(false);
                }
              }}
              className={`flex h-11 items-center gap-1.5 rounded-xl px-4.5 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                isAreaZoomActive
                  ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400 font-bold shadow-md shadow-yellow-500/10"
                  : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title="마우스 드래그로 지정한 영역을 즉시 확대 (ESC로 리셋)"
            >
              <Maximize className="h-4 w-4" />
              <span>영역 확대 Zoom</span>
            </button>

            <button
              onClick={() => {
                setIsDrawing(!isDrawing);
                if (!isDrawing) {
                  setCurrentStamp(null);
                  setIsAreaZoomActive(false);
                  setShowPenPanel(false);
                }
                setShowStickerPanel(false);
                setShowEffectsPanel(false);
              }}
              className={`flex h-11 items-center gap-1.5 rounded-xl px-4.5 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                isDrawing
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-bold shadow-md shadow-emerald-500/10"
                  : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
              }`}
              title="판서 그리기 활성화"
            >
              <PenTool className="h-4 w-4" />
              <span>{isDrawing ? "판서 모드" : "일반 마우스"}</span>
            </button>
          </div>

          {/* 🎨 Unified Drawing Popover Trigger */}
          {isDrawing && !isAreaZoomActive && (
            <>
              <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />
              <button
                onClick={() => {
                  setShowPenPanel(!showPenPanel);
                  setShowStickerPanel(false);
                  setShowEffectsPanel(false);
                }}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-4.5 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                  showPenPanel
                    ? "bg-violet-500/25 border-violet-500/50 text-violet-400 font-bold"
                    : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title="펜 색상, 두께, 형광펜 및 소멸 시간 조작"
              >
                <Settings className="h-4 w-4" />
                <span>🎨 펜 설정</span>
              </button>
            </>
          )}

          {/* Smart Snap & Spotlight Sizers (Unified to always be accessible!) */}
          {!isAreaZoomActive && (
            <>
              <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSmartSnap(!smartSnap)}
                  className={`h-11 rounded-xl px-4 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                    smartSnap
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400 font-bold shadow-md shadow-blue-500/10"
                      : "bg-slate-800/55 border-slate-700/50 text-slate-400 hover:text-slate-200"
                  }`}
                  title="직선 및 사각형 그릴 때 도형으로 자동 자동 보정"
                >
                  📐 스냅 {smartSnap ? "On" : "Off"}
                </button>
                
                <button
                  onClick={() => {
                    setSpotlightActive(!spotlightActive);
                    if (!spotlightActive) {
                      setIsDrawing(false);
                    }
                  }}
                  className={`h-11 rounded-xl p-3 border transition-all cursor-pointer flex-shrink-0 hover:scale-110 active:scale-95 ${
                    spotlightActive
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold shadow-md shadow-amber-500/10"
                      : "bg-slate-800/55 border-slate-700/50 text-slate-400 hover:text-slate-200"
                  }`}
                  title="스포트라이트 빔 강조 (휠/대괄호키로 크기 조절)"
                >
                  <Maximize2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </>
          )}

          {/* Sticker & Effects Popovers (Unified to always be accessible!) */}
          {!isAreaZoomActive && (
            <>
              <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />
              
              {/* Compact Sticker popover trigger button */}
              <button
                onClick={() => {
                  setShowStickerPanel(!showStickerPanel);
                  setEditingStampId(null);
                  setShowPenPanel(false);
                  setShowEffectsPanel(false);
                  setShowAiCustomPanel(false);
                }}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                  showStickerPanel || currentStamp
                    ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-bold shadow-md shadow-pink-500/10"
                    : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title="스티커 선택, 내용 편집 및 추가/삭제 패널 열기"
              >
                <Settings className="h-4 w-4" />
                <span>⚙️ 스티커</span>
              </button>

              {/* ✨ Compact Effects selector popover trigger button */}
              <button
                onClick={() => {
                  setShowEffectsPanel(!showEffectsPanel);
                  setShowAiCustomPanel(false);
                  setShowStickerPanel(false);
                  setShowPenPanel(false);
                }}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                  showEffectsPanel || cursorTrailType !== "none" || neonBorderActive
                    ? "bg-pink-500/20 border-pink-500/40 text-pink-400 font-bold shadow-lg shadow-pink-500/10"
                    : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title="오색 폭죽, 하트 리액션, 불꽃 마우스, 비눗방울 마우스, 화면 지진/얼리기 등 장면 효과 종합 선택"
              >
                <Sparkles className="h-4 w-4" />
                <span>✨ 효과</span>
              </button>

              {/* 🪄 Standing AI Custom button */}
              <button
                onClick={() => {
                  setShowAiCustomPanel(!showAiCustomPanel);
                  setShowEffectsPanel(false);
                  setShowStickerPanel(false);
                  setShowPenPanel(false);
                }}
                className={`flex h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 relative overflow-hidden ${
                  showAiCustomPanel || isAiSketchActive
                    ? "bg-gradient-to-r from-pink-500/20 to-violet-500/20 border-pink-500/50 text-pink-400 font-bold shadow-lg shadow-pink-500/20"
                    : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:text-slate-200"
                }`}
                title="나만의 AI 생성 효과 제작 및 재생"
              >
                <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
                <span>🪄 AI 커스텀</span>
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[7px] font-extrabold px-1 rounded-bl">PRO</span>
              </button>

              {/* Sound Option Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-11 rounded-xl p-3 border transition-all cursor-pointer flex-shrink-0 hover:scale-110 active:scale-95 ${
                  soundEnabled
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-400 font-bold"
                    : "bg-slate-800/55 border-slate-700/50 text-slate-550"
                }`}
                title={soundEnabled ? "소리 피드백 켬" : "소리 피드백 끔"}
              >
                {soundEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
              </button>
            </>
          )}

          <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />

          {/* Presentation Source Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 h-11 rounded-xl border border-slate-900 flex-shrink-0 hover:scale-105 transition-all">
            <Layout className="h-4.5 w-4.5 text-slate-500" />
            <select
              value={presentationSource}
              onChange={(e) => {
                const val = e.target.value as any;
                setPresentationSource(val);
                if (val === "pdf" && pdfInputRef.current) {
                  pdfInputRef.current.click();
                } else if (val === "images" && imagesInputRef.current) {
                  imagesInputRef.current.click();
                }
                setShowStickerPanel(false);
                setShowPenPanel(false);
                setShowEffectsPanel(false);
              }}
              className="bg-transparent text-[11px] text-slate-400 outline-none cursor-pointer border-none py-0.5 font-sans font-bold"
              title="발표용 화면 소스 선택"
            >
              <option value="simulator">🧪 샘플 PPT</option>
              <option value="screenshare">🖥️ 실시간 PPT 화면공유</option>
              <option value="pdf">📁 PDF 파일</option>
              <option value="images">🖼️ 이미지 슬라이드</option>
            </select>

            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePdfChange}
              accept="application/pdf"
              className="hidden"
            />
            <input
              type="file"
              ref={imagesInputRef}
              onChange={handleImagesChange}
              accept="image/*"
              multiple
              className="hidden"
            />

            {presentationSource === "pdf" && (
              <button
                onClick={() => pdfInputRef.current?.click()}
                className="text-slate-500 hover:text-white transition-colors"
                title="다른 PDF 올리기"
              >
                <Upload className="h-4 w-4" />
              </button>
            )}
            {presentationSource === "images" && (
              <button
                onClick={() => imagesInputRef.current?.click()}
                className="text-slate-500 hover:text-white transition-colors"
                title="다른 이미지들 올리기"
              >
                <Upload className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Slide Navigation controls */}
          {presentationSource !== "screenshare" && totalPages > 0 && (
            <>
              <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />
              <div className="flex items-center gap-1.5 flex-shrink-0 h-11 bg-slate-950/40 rounded-xl px-3 border border-slate-900">
                <button
                  onClick={onPrevPage}
                  disabled={currentPage === 1}
                  className="p-1 hover:bg-slate-800 text-slate-350 disabled:opacity-30 rounded cursor-pointer transition-colors"
                  title="이전 슬라이드"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <span className="text-[11px] text-slate-400 font-mono select-none px-1 font-bold">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={onNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1 hover:bg-slate-800 text-slate-350 disabled:opacity-30 rounded cursor-pointer transition-colors"
                  title="다음 슬라이드"
                >
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              </div>
              
              {/* Keyboard arrow keys page movement instruction guide */}
              <div className="hidden lg:flex items-center gap-1.5 h-11 bg-slate-950/40 rounded-xl px-3 border border-slate-900 text-slate-400 font-black text-xs whitespace-nowrap">
                <span>페이지 이동:</span>
                <kbd className="px-2 py-0.5 bg-slate-800 text-slate-100 rounded border border-slate-700 font-mono font-black shadow text-[10px]">◀</kbd>
                <kbd className="px-2 py-0.5 bg-slate-800 text-slate-100 rounded border border-slate-700 font-mono font-black shadow text-[10px]">▶</kbd>
                <span className="text-[11px] text-slate-500 font-bold ml-0.5">키보드 화살표</span>
              </div>
            </>
          )}

          {/* Zoom Info / Reset */}
          {zoomLevel > 1 && (
            <>
              <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />
              <button
                onClick={resetZoom}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4.5 text-xs text-yellow-400 hover:bg-yellow-500/20 cursor-pointer flex-shrink-0 hover:scale-105 active:scale-95 transition-all font-black"
                title="현재 줌 배율을 100%로 초기화"
              >
                <ZoomIn className="h-4 w-4 animate-pulse" />
                <span>{Math.round(zoomLevel * 100)}% 리셋</span>
              </button>
            </>
          )}

          <div className="h-7 w-px bg-slate-800/60 flex-shrink-0" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 🎡 Spinner Wheel Toggle Button (Gamification) */}
            <button
              onClick={() => {
                setShowSpinner(!showSpinner);
                setShowTimer(false); // close timer to avoid overlap
              }}
              className={`h-11 rounded-xl px-4.5 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                showSpinner
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400 font-bold shadow-md shadow-pink-500/10"
                  : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800"
              }`}
              title="랜덤 추첨용 돌림판(스피너 휠) 열기"
            >
              🎡 돌림판
            </button>

            {/* ⏱️ Floating Timer Toggle Button (Gamification) */}
            <button
              onClick={() => {
                setShowTimer(!showTimer);
                setShowSpinner(false); // close spinner to avoid overlap
              }}
              className={`h-11 rounded-xl px-4.5 text-xs font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-110 active:scale-95 ${
                showTimer
                  ? "bg-pink-500/20 border-pink-500/50 text-pink-400 font-bold shadow-md shadow-pink-500/10"
                  : "bg-slate-800/55 border-slate-700/50 text-slate-300 hover:bg-slate-800"
              }`}
              title="카운트다운 플로팅 타이머 위젯 열기"
            >
              ⏱️ 타이머
            </button>

            <button
              onClick={clearCanvas}
              className="h-11 w-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/80 shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95"
              title="현재 페이지 판서 및 스탬프 모두 지우기"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
            
            <button
              onClick={() => setIsCollapsed(true)}
              className="h-11 rounded-xl px-4.5 text-xs font-black border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              title="도크 접기"
            >
              접기
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
