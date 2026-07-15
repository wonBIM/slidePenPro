import React, { useRef, useEffect, useState } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  type: "free" | "line" | "rect";
  createdAt: number;
  opacity: number;
  isFading: boolean;
}

interface DrawingCanvasProps {
  strokes: Stroke[];
  setStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
  isDrawing: boolean;
  strokeColor: string;
  strokeWidth: number;
  smartSnap: boolean;
  mode: "biz" | "fun";
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
  currentStamp: string | null;
  onStampPlaced: (x: number, y: number, stampType: string) => void;
  isAreaZoomActive: boolean;
  onAreaZoomSelected: (start: Point, end: Point) => void;
  autoFadeActive: boolean;
  // 🔊 pencil synth sound hook & snapping chime callbacks
  onDrawStart: (speed: number) => void;
  onDrawStop: () => void;
  onSnapSuccess: () => void;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  strokes,
  setStrokes,
  isDrawing,
  strokeColor,
  strokeWidth,
  smartSnap,
  mode,
  zoomLevel,
  zoomOffset,
  currentStamp,
  onStampPlaced,
  isAreaZoomActive,
  onAreaZoomSelected,
  autoFadeActive,
  onDrawStart,
  onDrawStop,
  onSnapSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [isMouseActive, setIsMouseActive] = useState(false);

  const [areaZoomStart, setAreaZoomStart] = useState<Point | null>(null);
  const [areaZoomCurrent, setAreaZoomCurrent] = useState<Point | null>(null);

  // Resize canvas to match parent with DPR scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect() || {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const autoFadeRef = useRef(autoFadeActive);

  // Sync ref with prop changes instantly
  useEffect(() => {
    autoFadeRef.current = autoFadeActive;
  }, [autoFadeActive]);

  // Unified Auto-Fade loop
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      if (!autoFadeRef.current) return;

      const now = Date.now();
      setStrokes((prevStrokes) => {
        // Optimization: Skip calculations and state trigger if there are no strokes
        if (prevStrokes.length === 0) return prevStrokes;

        let changed = false;
        const nextStrokes = prevStrokes.map((stroke) => {
          const age = now - stroke.createdAt;
          if (age > 2000) {
            const remaining = Math.max(0, 1 - (age - 2000) / 800);
            if (remaining !== stroke.opacity) {
              changed = true;
              return {
                ...stroke,
                opacity: remaining,
                isFading: true
              };
            }
          }
          return stroke;
        });

        const filtered = nextStrokes.filter((s) => s.opacity > 0);
        if (filtered.length !== prevStrokes.length) changed = true;

        return changed ? filtered : prevStrokes;
      });
    }, 50);

    return () => clearInterval(fadeInterval);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const canvasX = (screenX - zoomOffset.x) / zoomLevel;
    const canvasY = (screenY - zoomOffset.y) / zoomLevel;

    return { x: canvasX, y: canvasY };
  };

  const getViewportCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform matrix to identity
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire physical pixels
    ctx.scale(dpr, dpr); // Re-apply DPR scale

    console.log(`[DrawingCanvas] Rendering ${strokes.length} strokes. Canvas size: ${canvas.width}x${canvas.height}, DPR: ${dpr}`);

    if (isAreaZoomActive && areaZoomStart && areaZoomCurrent) {
      ctx.save();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      
      const w = areaZoomCurrent.x - areaZoomStart.x;
      const h = areaZoomCurrent.y - areaZoomStart.y;
      
      ctx.beginPath();
      ctx.rect(areaZoomStart.x, areaZoomStart.y, w, h);
      ctx.stroke();
      
      ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(zoomOffset.x, zoomOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    // const containerWidth = canvas.width / (window.devicePixelRatio || 1);
    // const containerHeight = canvas.height / (window.devicePixelRatio || 1);
    // const slideRatio = 16 / 9;
    // let slideW = containerWidth;
    // let slideH = containerHeight;
    // let slideX = 0;
    // let slideY = 0;
    // if (containerWidth / containerHeight > slideRatio) {
    //   slideW = containerHeight * slideRatio;
    //   slideX = (containerWidth - slideW) / 2;
    // } else {
    //   slideH = containerWidth / slideRatio;
    //   slideY = (containerHeight - slideH) / 2;
    // }

    // Allow drawing outside the 16:9 slide bounds (no clipping)
    // ctx.beginPath();
    // ctx.rect(slideX, slideY, slideW, slideH);
    // ctx.clip();

    strokes.forEach((stroke) => {
      ctx.globalAlpha = stroke.opacity;
      ctx.strokeStyle = stroke.color;
      ctx.fillStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.points.length < 2) return;

      if (stroke.type === "free") {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.type === "line") {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(stroke.points[stroke.points.length - 1].x, stroke.points[stroke.points.length - 1].y);
        ctx.stroke();
      } else if (stroke.type === "rect") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        const w = end.x - start.x;
        const h = end.y - start.y;
        
        ctx.beginPath();
        ctx.rect(start.x, start.y, w, h);
        ctx.stroke();
      }
    });

    if (isMouseActive && currentPoints.length > 0) {
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
      for (let i = 1; i < currentPoints.length; i++) {
        ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
      }
      ctx.stroke();
    }

    ctx.restore();
  }, [strokes, currentPoints, isMouseActive, zoomLevel, zoomOffset, strokeColor, strokeWidth, isAreaZoomActive, areaZoomStart, areaZoomCurrent]);

  const analyzeStroke = (points: Point[]): { type: "free" | "line" | "rect"; formattedPoints: Point[] } => {
    if (points.length < 8) return { type: "free", formattedPoints: points };

    const start = points[0];
    const end = points[points.length - 1];

    let maxDistance = 0;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const denominator = Math.sqrt(dx * dx + dy * dy);

    if (denominator > 10) {
      for (let i = 1; i < points.length - 1; i++) {
        const p = points[i];
        const numerator = Math.abs(dy * p.x - dx * p.y + end.x * start.y - end.y * start.x);
        const distance = numerator / denominator;
        if (distance > maxDistance) {
          maxDistance = distance;
        }
      }

      if (maxDistance < 18) {
        return { type: "line", formattedPoints: [start, end] };
      }
    }

    const xCoords = points.map(p => p.x);
    const yCoords = points.map(p => p.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    if (boxWidth > 30 && boxHeight > 30) {
      const loopGap = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      
      if (loopGap < 60 || (loopGap < Math.max(boxWidth, boxHeight) * 0.4)) {
        const corners = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY }
        ];

        let cornerMatchCount = 0;
        const threshold = Math.max(15, Math.min(boxWidth, boxHeight) * 0.25);

        corners.forEach(corner => {
          const hasClosePoint = points.some(p => 
            Math.sqrt(Math.pow(p.x - corner.x, 2) + Math.pow(p.y - corner.y, 2)) < threshold
          );
          if (hasClosePoint) cornerMatchCount++;
        });

        if (cornerMatchCount >= 3) {
          return {
            type: "rect",
            formattedPoints: [
              { x: minX, y: minY },
              { x: maxX, y: maxY }
            ]
          };
        }
      }
    }

    return { type: "free", formattedPoints: points };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;

    if (isAreaZoomActive) {
      const vCoords = getViewportCoords(e);
      setAreaZoomStart(vCoords);
      setAreaZoomCurrent(vCoords);
      return;
    }

    const coords = getCanvasCoords(e);

    if (mode === "fun" && currentStamp) {
      onStampPlaced(coords.x, coords.y, currentStamp);
      return;
    }

    if (!isDrawing) return;

    setIsMouseActive(true);
    setCurrentPoints([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAreaZoomActive && areaZoomStart) {
      const vCoords = getViewportCoords(e);
      setAreaZoomCurrent(vCoords);
      return;
    }

    if (!isDrawing || !isMouseActive) return;
    const coords = getCanvasCoords(e);

    // Calculate real-time drag speed for Auditory noise play
    const prevPoint = currentPoints[currentPoints.length - 1];
    if (prevPoint) {
      const dx = coords.x - prevPoint.x;
      const dy = coords.y - prevPoint.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      onDrawStart(speed);
    }

    setCurrentPoints((prev) => [...prev, coords]);
  };

  const handleMouseUp = () => {
    onDrawStop(); // stop scribble synth

    if (isAreaZoomActive && areaZoomStart && areaZoomCurrent) {
      const width = Math.abs(areaZoomCurrent.x - areaZoomStart.x);
      const height = Math.abs(areaZoomCurrent.y - areaZoomStart.y);

      if (width > 15 && height > 15) {
        onAreaZoomSelected(areaZoomStart, areaZoomCurrent);
      }
      setAreaZoomStart(null);
      setAreaZoomCurrent(null);
      return;
    }

    if (!isMouseActive) return;
    setIsMouseActive(false);

    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }

    let finalType: "free" | "line" | "rect" = "free";
    let finalPoints = currentPoints;

    if (smartSnap) {
      const analysis = analyzeStroke(currentPoints);
      finalType = analysis.type;
      finalPoints = analysis.formattedPoints;
      
      // Play Snap SUCCESS Chime Earcon!
      if (finalType !== "free") {
        onSnapSuccess();
      }
    }

    const newStroke: Stroke = {
      id: Math.random().toString(36).substring(7),
      points: finalPoints,
      color: strokeColor,
      width: strokeWidth,
      type: finalType,
      createdAt: Date.now(),
      opacity: 1.0,
      isFading: false
    };

    setStrokes((prev) => [...prev, newStroke]);
    setCurrentPoints([]);
  };

  return (
    <canvas
      id="drawing-canvas"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`absolute inset-0 h-full w-full bg-transparent ${
        isDrawing || currentStamp || isAreaZoomActive ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
      }`}
      style={{ zIndex: 30 }}
    />
  );
};
