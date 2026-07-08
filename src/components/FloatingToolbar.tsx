import React, { useRef, useState } from "react";
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
  triggerMeteorShower: () => void;
  triggerScreenFreeze: () => void;
  triggerEarthquake: () => void;
  // 🎡 Gamification spinner/timer hooks
  showSpinner: boolean;
  setShowSpinner: (val: boolean) => void;
  showTimer: boolean;
  setShowTimer: (val: boolean) => void;
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
  setShowTimer
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false); // Sticker Popover
  const [showPenPanel, setShowPenPanel] = useState(false); // Pen Settings Popover
  const [showEffectsPanel, setShowEffectsPanel] = useState(false); // Effects Tab Popover
  const [effectsTab, setEffectsTab] = useState<"particles" | "scenes">("particles"); // Effects tab state
  const [editingStampId, setEditingStampId] = useState<string | null>(null);
  
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
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800/80 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 z-50 w-[270px] backdrop-blur-md animate-fade-in text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">✨ 시각 연출 및 장면 효과</span>
            <button
              onClick={() => setShowEffectsPanel(false)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mini Tabs Switcher */}
          <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-850">
            <button
              onClick={() => setEffectsTab("particles")}
              className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                effectsTab === "particles" ? "bg-slate-800 text-pink-400" : "text-slate-500 hover:text-slate-350"
              }`}
            >
              🎉 리액션 & 커서
            </button>
            <button
              onClick={() => setEffectsTab("scenes")}
              className={`flex-1 text-center py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                effectsTab === "scenes" ? "bg-slate-800 text-pink-400" : "text-slate-500 hover:text-slate-350"
              }`}
            >
              🎬 장면 임팩트
            </button>
          </div>

          {/* TAB 1: Particles & Cursor Trails */}
          {effectsTab === "particles" && (
            <div className="flex flex-col gap-2.5 animate-fade-in">
              <button
                onClick={() => {
                  triggerConfetti();
                  setShowEffectsPanel(false);
                }}
                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-400 hover:to-violet-400 text-white text-[11px] font-extrabold shadow-md shadow-pink-600/20 active:scale-95 transition-all cursor-pointer w-full"
              >
                <span>🎉 축하 폭죽 쇼</span>
              </button>

              <button
                onClick={() => {
                  triggerEmojiBurst();
                  setShowEffectsPanel(false);
                }}
                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-pink-400 text-[11px] font-extrabold active:scale-95 transition-all cursor-pointer w-full"
              >
                <span>❤️ 하트 이모지 뿜뿜</span>
              </button>

              {/* Advanced Pointer Trails Selector */}
              <div className="flex flex-col gap-1 bg-slate-950 p-2 rounded-lg border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold">마우스 포인터 궤적 이펙트</span>
                <select
                  value={cursorTrailType}
                  onChange={(e) => {
                    setCursorTrailType(e.target.value as any);
                    setShowEffectsPanel(false);
                  }}
                  className="bg-transparent text-[11px] text-slate-300 outline-none w-full cursor-pointer py-0.5 border-none font-sans font-semibold"
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
            <div className="flex flex-col gap-2.5 animate-fade-in">
              <button
                onClick={() => {
                  triggerScreenFreeze();
                  setShowEffectsPanel(false);
                }}
                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-sky-950/80 border border-sky-800 hover:bg-sky-900 text-sky-300 text-[11px] font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="화면을 얼린 뒤 마우스로 클릭하면 유리창처럼 박살내기"
              >
                <span>🥶 화면 얼리기 & 깨기</span>
              </button>

              <button
                onClick={() => {
                  triggerEarthquake();
                  setShowEffectsPanel(false);
                }}
                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-300 text-[11px] font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="화면 전체가 지진 난 것처럼 60fps 격렬히 쉐이크"
              >
                <span>🫨 화면 지진 흔들림</span>
              </button>

              <button
                onClick={() => {
                  triggerMeteorShower();
                  setShowEffectsPanel(false);
                }}
                className="flex h-8.5 items-center justify-center gap-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800 hover:bg-indigo-900 text-indigo-300 text-[11px] font-extrabold active:scale-95 transition-all cursor-pointer w-full"
                title="하늘에서 아름다운 별똥별들이 무리지어 쏟아짐"
              >
                <span>☄️ 밤하늘 은하수 유성우</span>
              </button>

              {/* Border Chaser Toggle */}
              <div className="flex items-center justify-between bg-slate-950 p-2 rounded-lg border border-slate-850 w-full">
                <span className="text-[10px] text-slate-400 font-semibold">🚨 테두리 레이저 경보</span>
                <button
                  onClick={() => {
                    setNeonBorderActive(!neonBorderActive);
                    setShowEffectsPanel(false);
                  }}
                  className={`flex h-7 items-center gap-1 px-2.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
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
