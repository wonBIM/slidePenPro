import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import confetti from "canvas-confetti";

export interface StampInstance {
  id: string;
  x: number;
  y: number;
  type: string; // "excellent" | "focus" | "correct" | "wrong" | "custom"
  text?: string; // custom manually entered text
  shape?: "badge" | "circle" | "bubble" | "star"; // shape styling
  createdAt: number;
}

interface InteractiveEffectsProps {
  stamps: StampInstance[];
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
  soundEnabled: boolean;
}

export interface InteractiveEffectsRef {
  triggerConfetti: () => void;
  playAudioPreset: (presetType: string) => void;
  playEmojiBurst: () => void;
  setMagicTrailActive: (active: boolean) => void;
}

interface EmojiReactionParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  size: number;
  opacity: number;
  rot: number;
  rotSpeed: number;
}

interface StarParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  rot: number;
  rotSpeed: number;
}

export const InteractiveEffects = forwardRef<InteractiveEffectsRef, InteractiveEffectsProps>(
  ({ stamps, zoomLevel, zoomOffset, soundEnabled }, ref) => {
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
    const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const myConfettiRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Particles collections (Ref-backed for buttery smooth 60fps updates)
    const emojiParticlesRef = useRef<EmojiReactionParticle[]>([]);
    const starParticlesRef = useRef<StarParticle[]>([]);
    const [magicTrailActiveInternal, setMagicTrailActiveInternal] = useState(false);

    // Setup custom confetti instance
    useEffect(() => {
      if (confettiCanvasRef.current) {
        myConfettiRef.current = confetti.create(confettiCanvasRef.current, {
          resize: true,
          useWorker: true
        });
      }
    }, []);

    // Web Audio Synthesizer (Synth) for Instant zero-dependency sound effects
    const playAudioPreset = (presetType: string) => {
      if (!soundEnabled) return;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();

        const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            // Volume Envelope
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
          }, delay * 1000);
        };

        if (presetType === "ding") {
          playTone(523.25, "sine", 0.3, 0);      // C5
          playTone(659.25, "sine", 0.3, 0.08);   // E5
          playTone(783.99, "sine", 0.3, 0.16);   // G5
          playTone(1046.50, "sine", 0.5, 0.24);  // C6
        } else if (presetType === "cheer") {
          playTone(392.00, "triangle", 0.4, 0);   // G4
          playTone(523.25, "triangle", 0.4, 0.1); // C5
          playTone(659.25, "triangle", 0.4, 0.2); // E5
          playTone(783.99, "triangle", 0.6, 0.3); // G5
          
          playTone(440.00, "sawtooth", 0.3, 0.05); // Support chord
          playTone(554.37, "sawtooth", 0.3, 0.15);
          playTone(698.46, "sawtooth", 0.5, 0.35);
        } else if (presetType === "focus") {
          playTone(880.00, "sine", 0.15, 0);    // A5
          playTone(880.00, "sine", 0.25, 0.18);   // A5
        } else if (presetType === "buzzer") {
          playTone(220.00, "sawtooth", 0.5, 0);   // A3
          playTone(207.65, "sawtooth", 0.5, 0.08); // Ab3
        } else if (presetType === "bubble") {
          playTone(587.33, "sine", 0.15, 0);     // D5
          playTone(880.00, "sine", 0.2, 0.05);    // A5
          playTone(1174.66, "sine", 0.25, 0.1);   // D6
        }
      } catch (err) {
        console.error("Audio Context failed to initialize:", err);
      }
    };

    const triggerConfetti = () => {
      playAudioPreset("cheer");

      if (myConfettiRef.current) {
        myConfettiRef.current({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#ff007f", "#39ff14", "#bd00ff", "#ffeb3b", "#00e5ff"]
        });
      } else {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };

    // Trigger Emoji Reaction Bubble Burst
    const playEmojiBurst = () => {
      playAudioPreset("bubble");
      const emojis = ["❤️", "💖", "👍", "👏", "🔥", "🎉", "🌟", "🎈", "🥰", "🤩"];
      const newParticles: EmojiReactionParticle[] = [];

      // Spawn 25-30 emojis starting from bottom
      const count = 25 + Math.floor(Math.random() * 10);
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: Math.random().toString(36).substring(7),
          x: (winW * 0.15) + (Math.random() * (winW * 0.7)), // cluster around middle 70% width
          y: winH + 20,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -6 - Math.random() * 7, // speed upwards
          char: emojis[Math.floor(Math.random() * emojis.length)],
          size: 20 + Math.floor(Math.random() * 22),
          opacity: 1.0,
          rot: (Math.random() - 0.5) * 0.5,
          rotSpeed: (Math.random() - 0.5) * 0.05
        });
      }

      emojiParticlesRef.current = [...emojiParticlesRef.current, ...newParticles];
    };

    // Magic Star Trail Mouse Move Tracker (Pure screen coordinates)
    useEffect(() => {
      if (!magicTrailActiveInternal) return;

      const handleMouseMove = (e: MouseEvent) => {
        const canvas = effectsCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Spawn 2-3 sparkle star particles on mouse trajectory
        const newStars: StarParticle[] = [];
        const colors = ["#facc15", "#fef08a", "#a7f3d0", "#bae6fd", "#fbcfe8"]; // yellow, pink, blue, mint sparkles
        
        for (let i = 0; i < 2; i++) {
          newStars.push({
            id: Math.random().toString(36).substring(7),
            x: mouseX,
            y: mouseY,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 8 + Math.random() * 10,
            opacity: 1.0,
            color: colors[Math.floor(Math.random() * colors.length)],
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.08
          });
        }

        starParticlesRef.current = [...starParticlesRef.current, ...newStars];
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [magicTrailActiveInternal]);

    // Handle effects canvas size and resize
    useEffect(() => {
      const canvas = effectsCanvasRef.current;
      if (!canvas) return;

      const handleResize = () => {
        const parent = canvas.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Main 60fps Canvas render loop for Custom Emoji Reactions and Star Trail
    useEffect(() => {
      const canvas = effectsCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw 5-pointed star helper
      const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string, rot: number) => {
        let rotation = (Math.PI / 2) * 3 + rot;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        c.save();
        c.beginPath();
        c.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
          x = cx + Math.cos(rotation) * outerRadius;
          y = cy + Math.sin(rotation) * outerRadius;
          c.lineTo(x, y);
          rotation += step;

          x = cx + Math.cos(rotation) * innerRadius;
          y = cy + Math.sin(rotation) * innerRadius;
          c.lineTo(x, y);
          rotation += step;
        }
        c.lineTo(cx, cy - outerRadius);
        c.closePath();
        c.fillStyle = color;
        c.fill();
        c.restore();
      };

      const loop = () => {
        // Clear screen canvas context
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. UPDATE & DRAW EMOJI BUBBLE REACTIONS
        const activeEmojis: EmojiReactionParticle[] = [];
        emojiParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          
          // Slight float gravity
          p.vy += 0.08; 
          p.rot += p.rotSpeed;
          p.opacity -= 0.012; // slow fade out

          if (p.opacity > 0 && p.y > -50) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.font = `${p.size}px sans-serif`;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            // Center aligns text draw
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.char, 0, 0);
            ctx.restore();

            activeEmojis.push(p);
          }
        });
        emojiParticlesRef.current = activeEmojis;

        // 2. UPDATE & DRAW MAGIC STAR TRAILS
        const activeStars: StarParticle[] = [];
        starParticlesRef.current.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.rot += s.rotSpeed;
          s.opacity -= 0.035; // fade sparkles quickly
          s.size = Math.max(0, s.size - 0.2); // shrink stars

          if (s.opacity > 0 && s.size > 0.5) {
            ctx.save();
            ctx.globalAlpha = s.opacity;
            drawStar(ctx, s.x, s.y, 4, s.size, s.size * 0.4, s.color, s.rot);
            ctx.restore();

            activeStars.push(s);
          }
        });
        starParticlesRef.current = activeStars;

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      loop();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    // Expose methods to parent App
    useImperativeHandle(ref, () => ({
      triggerConfetti,
      playAudioPreset,
      playEmojiBurst,
      setMagicTrailActive: (active: boolean) => {
        setMagicTrailActiveInternal(active);
        if (!active) {
          starParticlesRef.current = []; // flush particles
        }
      }
    }));

    // Rendering Stamp SVGs based on shapes and types
    const renderStampContent = (stamp: StampInstance) => {
      const textContent = stamp.type === "custom" ? (stamp.text || "메모") : getPresetText(stamp.type);
      const colorScheme = getColorPreset(stamp.type);
      const shapeType = stamp.shape || "badge";

      // 1. Special case: Star Shape (using custom SVG scaling for absolute centering)
      if (shapeType === "star") {
        return (
          <div className="relative w-28 h-28 flex items-center justify-center select-none pointer-events-none drop-shadow-xl animate-stamp-slam">
            <svg className="absolute inset-0 w-full h-full text-amber-400 stroke-amber-500 stroke-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z" />
            </svg>
            <div className="z-10 flex flex-col items-center justify-center text-center p-2 text-slate-950 font-extrabold max-w-[70%] leading-tight text-xs">
              <span>{textContent}</span>
            </div>
          </div>
        );
      }

      // 2. Bubble Shape (Speech Bubble with tail)
      if (shapeType === "bubble") {
        return (
          <div 
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-3 shadow-xl border-2 border-white text-white select-none pointer-events-none relative ${colorScheme.gradient} after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-0 after:border-x-8 after:border-x-transparent after:border-t-8 ${colorScheme.tailColor}`}
          >
            <span className="text-sm md:text-base font-extrabold tracking-wide font-sans whitespace-nowrap">
              {textContent}
            </span>
          </div>
        );
      }

      // 3. Circle Shape
      if (shapeType === "circle") {
        return (
          <div className={`flex flex-col items-center justify-center rounded-full aspect-square w-24 h-24 p-3 shadow-xl border-2 border-white text-white text-center select-none pointer-events-none ${colorScheme.gradient}`}>
            <span className="text-xs md:text-sm font-extrabold leading-tight break-all font-sans">
              {textContent}
            </span>
          </div>
        );
      }

      // 4. Default Badge Shape
      return (
        <div className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2.5 shadow-xl border-2 border-white text-white select-none pointer-events-none ${colorScheme.gradient}`}>
          <span className="text-sm md:text-base font-extrabold tracking-wide font-sans whitespace-nowrap">
            {textContent}
          </span>
        </div>
      );
    };

    const getPresetText = (type: string): string => {
      switch (type) {
        case "excellent":
          return "👍 참 잘했어요!";
        case "focus":
          return "👀 여기 보세요!";
        case "correct":
          return "🎉 정답입니다!";
        case "wrong":
          return "⚠️ 확인해보세요!";
        default:
          return "";
      }
    };

    const getColorPreset = (type: string) => {
      switch (type) {
        case "excellent":
          return {
            gradient: "bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900",
            tailColor: "after:border-t-amber-500"
          };
        case "focus":
          return {
            gradient: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white",
            tailColor: "after:border-t-blue-600"
          };
        case "correct":
          return {
            gradient: "bg-gradient-to-br from-pink-500 to-rose-600 text-white",
            tailColor: "after:border-t-rose-600"
          };
        case "wrong":
          return {
            gradient: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
            tailColor: "after:border-t-orange-600"
          };
        case "custom":
        default:
          return {
            gradient: "bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white",
            tailColor: "after:border-t-indigo-600"
          };
      }
    };

    return (
      <div className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden" style={{ zIndex: 35 }}>
        {/* Fullscreen Confetti Canvas Overlay */}
        <canvas ref={confettiCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* 60fps Custom Interaction Canvas (Emoji reaction, Magic trail sparkles) */}
        <canvas ref={effectsCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-10" />

        {/* Stamps Overlay under Zoom & Coordinate matrix */}
        <div
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{
            transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "0 0"
          }}
        >
          {stamps.map((stamp) => (
            <div
              key={stamp.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-stamp-slam origin-center"
              style={{
                left: stamp.x,
                top: stamp.y
              }}
            >
              {renderStampContent(stamp)}
            </div>
          ))}
        </div>
      </div>
    );
  }
);

InteractiveEffects.displayName = "InteractiveEffects";
