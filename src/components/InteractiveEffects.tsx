import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import confetti from "canvas-confetti";

export interface StampInstance {
  id: string;
  x: number;
  y: number;
  type: string; // "excellent" | "focus" | "correct" | "wrong" | "custom"
  text?: string;
  shape?: "badge" | "circle" | "bubble" | "star";
  createdAt: number;
}

interface InteractiveEffectsProps {
  stamps: StampInstance[];
  zoomLevel: number;
  zoomOffset: { x: number; y: number };
  soundEnabled: boolean;
  isEffectsInteractive: boolean;
}

export interface InteractiveEffectsRef {
  triggerConfetti: () => void;
  playAudioPreset: (presetType: string) => void;
  playEmojiBurst: () => void;
  setCursorTrailType: (type: "none" | "star" | "fire" | "bubble") => void;
  playMeteorShower: () => void;
  triggerScreenFreeze: () => void;
  startScribbleSound: (speed: number) => void;
  stopScribbleSound: () => void;
  playCustomEffect: (shape: string, style: "crystal" | "jelly" | "gold", animation: "explosion" | "rain" | "float", customImageUrl?: string) => void;
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

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

interface BubbleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
}

interface MeteorParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  color: string;
  opacity: number;
}

interface GlassShard {
  points: { x: number; y: number }[];
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  opacity: number;
}

interface CustomParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  image: HTMLImageElement;
  animation: "explosion" | "rain" | "float";
  life: number;
  maxLife: number;
}

interface SimulatedStamp {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  text: string;
  shape: "badge" | "circle" | "bubble" | "star";
  scale: number;
  targetScale: number;
  scaleVel: number;
  isDragging: boolean;
  width: number;
  height: number;
}

const getStylizedSvg = (shape: "heart" | "star" | "cloud", style: "crystal" | "jelly" | "gold"): string => {
  let innerPaths = "";
  let defs = "";
  let size = 64;

  if (shape === "heart") {
    if (style === "crystal") {
      defs = `
        <linearGradient id="c-h-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ff758c" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#ff7eb3" stop-opacity="0.4" />
        </linearGradient>
        <filter id="c-h-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
      innerPaths = `
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#c-h-grad)" stroke="#00f3ff" stroke-width="1.5" filter="url(#c-h-glow)" />
        <path d="M7.5 4.5c-2.2 0-4 1.8-4 4 0 2.5 2.2 4.8 6.7 8.9l1.8 1.6 1.8-1.6c4.5-4.1 6.7-6.4 6.7-8.9 0-2.2-1.8-4-4-4-1.3 0-2.5.7-3.2 1.8L12 7.7l-1.3-1.4c-.7-1.1-1.9-1.8-3.2-1.8z" fill="none" stroke="#fff" stroke-width="0.75" stroke-opacity="0.6" />
      `;
    } else if (style === "jelly") {
      defs = `
        <radialGradient id="j-h-grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#ff9a9e" />
          <stop offset="50%" stop-color="#f6416c" />
          <stop offset="100%" stop-color="#8b002c" />
        </radialGradient>
      `;
      innerPaths = `
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#j-h-grad)" />
        <ellipse cx="8.5" cy="7" rx="2.5" ry="1.5" transform="rotate(-30 8.5 7)" fill="#ffffff" fill-opacity="0.8" />
      `;
    } else { // gold
      defs = `
        <linearGradient id="g-h-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe259" />
          <stop offset="50%" stop-color="#ffa751" />
          <stop offset="100%" stop-color="#b8860b" />
        </linearGradient>
      `;
      innerPaths = `
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#g-h-grad)" stroke="#fff" stroke-width="0.5" />
        <path d="M12 19.5l-1.2-1.1C6.2 14.2 3 11.2 3 8c0-2.5 2-4.5 4.5-4.5 1.5 0 2.9.7 3.8 1.8l.7.8.7-.8c.9-1.1 2.3-1.8 3.8-1.8C19 3.5 21 5.5 21 8c0 3.2-3.2 6.2-7.8 10.4l-1.2 1.1z" fill="none" stroke="#ffe259" stroke-width="1.2" stroke-opacity="0.8" />
      `;
    }
  } else if (shape === "star") {
    if (style === "crystal") {
      defs = `
        <linearGradient id="c-s-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#4facfe" stop-opacity="0.4" />
        </linearGradient>
        <filter id="c-s-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
      innerPaths = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="url(#c-s-grad)" stroke="#ff007f" stroke-width="1.5" filter="url(#c-s-glow)" />
        <polygon points="12,4 14.2,9.5 20,9.5 16,13.5 17.5,19 12,16 6.5,19 8,13.5 4,9.5 9.8,9.5" fill="none" stroke="#fff" stroke-width="0.75" stroke-opacity="0.6" />
      `;
    } else if (style === "jelly") {
      defs = `
        <radialGradient id="j-s-grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#fffb54" />
          <stop offset="60%" stop-color="#ffb300" />
          <stop offset="100%" stop-color="#ff6f00" />
        </radialGradient>
      `;
      innerPaths = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="url(#j-s-grad)" />
        <ellipse cx="10" cy="8" rx="2" ry="1.2" transform="rotate(-15 10 8)" fill="#ffffff" fill-opacity="0.8" />
      `;
    } else { // gold
      defs = `
        <linearGradient id="g-s-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff" />
          <stop offset="30%" stop-color="#ffe259" />
          <stop offset="100%" stop-color="#c59b27" />
        </linearGradient>
      `;
      innerPaths = `
        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="url(#g-s-grad)" stroke="#b8860b" stroke-width="0.5" />
        <polygon points="12,3.8 14.5,9.3 20.3,9.3 16.2,13.3 17.7,19 12,16 6.3,19 7.8,13.3 3.7,9.3 9.5,9.3" fill="none" stroke="#ffe57f" stroke-width="1.2" stroke-opacity="0.8" />
      `;
    }
  } else { // cloud
    if (style === "crystal") {
      defs = `
        <linearGradient id="c-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0c3fc" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#8ec5fc" stop-opacity="0.4" />
        </linearGradient>
        <filter id="c-c-glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      `;
      innerPaths = `
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="url(#c-c-grad)" stroke="#b5179e" stroke-width="1.5" filter="url(#c-c-glow)" />
        <path d="M19.35 11.04C18.67 7.59 15.64 5 12 5c-2.9 0-5.4 1.6-6.6 4-.2-.1-.5-.1-.7-.1-2.5 0-4.5 2-4.5 4.5S2.2 18 4.7 18h13.6c2.2 0 4-1.8 4-4 0-2.1-1.7-3.9-3.9-3.96z" fill="none" stroke="#fff" stroke-width="0.75" stroke-opacity="0.6" />
      `;
    } else if (style === "jelly") {
      defs = `
        <radialGradient id="j-c-grad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#e0f7fa" />
          <stop offset="60%" stop-color="#b2ebf2" />
          <stop offset="100%" stop-color="#4dd0e1" />
        </radialGradient>
      `;
      innerPaths = `
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="url(#j-c-grad)" />
        <ellipse cx="8" cy="11" rx="2" ry="1.2" fill="#ffffff" fill-opacity="0.8" />
        <ellipse cx="14" cy="8" rx="2.5" ry="1.5" fill="#ffffff" fill-opacity="0.8" />
      `;
    } else { // gold
      defs = `
        <linearGradient id="g-c-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffe259" />
          <stop offset="100%" stop-color="#c59b27" />
        </linearGradient>
      `;
      innerPaths = `
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="url(#g-c-grad)" stroke="#b8860b" stroke-width="0.5" />
        <path d="M19.35 11.04C18.67 7.59 15.64 5 12 5c-2.9 0-5.4 1.6-6.6 4-.2-.1-.5-.1-.7-.1-2.5 0-4.5 2-4.5 4.5S2.2 18 4.7 18h13.6c2.2 0 4-1.8 4-4 0-2.1-1.7-3.9-3.9-3.96z" fill="none" stroke="#ffe57f" stroke-width="1.2" stroke-opacity="0.8" />
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <defs>${defs}</defs>
      ${innerPaths}
    </svg>
  `.trim();
};

export const InteractiveEffects = forwardRef<InteractiveEffectsRef, InteractiveEffectsProps>(
  ({ stamps, zoomLevel, zoomOffset, soundEnabled, isEffectsInteractive }, ref) => {
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
    const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const myConfettiRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);

    const emojiParticlesRef = useRef<EmojiReactionParticle[]>([]);
    const starParticlesRef = useRef<StarParticle[]>([]);
    const fireParticlesRef = useRef<FireParticle[]>([]);
    const bubbleParticlesRef = useRef<BubbleParticle[]>([]);
    const meteorParticlesRef = useRef<MeteorParticle[]>([]);
    const glassShardsRef = useRef<GlassShard[]>([]);
    const customParticlesRef = useRef<CustomParticle[]>([]);

    const localStampsRef = useRef<SimulatedStamp[]>([]);
    const draggingStampIdRef = useRef<string | null>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    const [cursorTrailType, setCursorTrailTypeState] = useState<"none" | "star" | "fire" | "bubble">("none");
    const [isFrozen, setIsFrozen] = useState(false);
    const [freezeAnimState, setFreezeAnimState] = useState<"none" | "freezing" | "frozen" | "shattering">("none");
    const [freezeProgress, setFreezeProgress] = useState(0);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const scribbleSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const scribbleGainRef = useRef<GainNode | null>(null);
    const scribbleActiveRef = useRef<boolean>(false);

    useEffect(() => {
      if (stamps.length === 0) {
        localStampsRef.current = [];
        return;
      }
      
      const currentIds = localStampsRef.current.map((s) => s.id);
      stamps.forEach((parentStamp) => {
        if (!currentIds.includes(parentStamp.id)) {
          const textContent = parentStamp.type === "custom" ? (parentStamp.text || "메모") : getPresetText(parentStamp.type);
          const textLen = textContent.length;
          const w = parentStamp.shape === "circle" || parentStamp.shape === "star" ? 96 : Math.max(90, textLen * 14 + 30);
          const h = parentStamp.shape === "circle" || parentStamp.shape === "star" ? 96 : 42;

          localStampsRef.current.push({
            id: parentStamp.id,
            x: parentStamp.x,
            y: parentStamp.y,
            vx: 0,
            vy: 0,
            type: parentStamp.type,
            text: textContent,
            shape: parentStamp.shape || "badge",
            scale: 0.05,
            targetScale: 1.0,
            scaleVel: 0,
            isDragging: false,
            width: w,
            height: h
          });

          playAudioPreset("focus");
        }
      });
    }, [stamps]);

    useEffect(() => {
      const confettiCanvas = confettiCanvasRef.current;
      const effectsCanvas = effectsCanvasRef.current;
      
      const handleResize = () => {
        const parent = confettiCanvas?.parentElement;
        if (parent) {
          const rect = parent.getBoundingClientRect();
          if (confettiCanvas) {
            confettiCanvas.width = rect.width;
            confettiCanvas.height = rect.height;
          }
          if (effectsCanvas) {
            effectsCanvas.width = rect.width;
            effectsCanvas.height = rect.height;
          }
        }
      };

      handleResize();
      window.addEventListener("resize", handleResize);

      if (confettiCanvasRef.current) {
        myConfettiRef.current = confetti.create(confettiCanvasRef.current, {
          resize: true,
          useWorker: true
        });
      }

      return () => {
        window.removeEventListener("resize", handleResize);
        stopScribbleSound();
        if (audioCtxRef.current) {
          audioCtxRef.current.close();
        }
      };
    }, []);

    useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (cursorTrailType === "none" || isFrozen) return;

        const canvas = effectsCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        // Convert screen mouse coordinates into canvas pixels
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;

        if (cursorTrailType === "star") {
          starParticlesRef.current.push({
            id: Math.random().toString(36).substring(7),
            x,
            y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            size: 4 + Math.random() * 6,
            opacity: 1.0,
            color: ["#facc15", "#38bdf8", "#f472b6", "#a7f3d0", "#ffffff"][Math.floor(Math.random() * 5)],
            rot: Math.random() * Math.PI,
            rotSpeed: (Math.random() - 0.5) * 0.1
          });
        } else if (cursorTrailType === "fire") {
          for (let i = 0; i < 2; i++) {
            fireParticlesRef.current.push({
              x: x + (Math.random() - 0.5) * 6,
              y: y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 0.6,
              vy: -1.2 - Math.random() * 1.5,
              size: 10 + Math.random() * 8,
              opacity: 1.0,
              color: ["#f97316", "#ef4444", "#eab308"][Math.floor(Math.random() * 3)]
            });
          }
        } else if (cursorTrailType === "bubble") {
          if (Math.random() < 0.28) {
            bubbleParticlesRef.current.push({
              x,
              y,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -0.8 - Math.random() * 1.5,
              radius: 12 + Math.random() * 18,
              opacity: 0.88,
              color: `hsla(${Math.random() * 360}, 90%, 75%, 0.65)`
            });
          }
        }
      };

      window.addEventListener("mousemove", handleGlobalMouseMove);
      return () => {
        window.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }, [cursorTrailType, isFrozen]);

    useEffect(() => {
      let shatterTimer: any = null;
      if (freezeAnimState === "frozen") {
        shatterTimer = setTimeout(() => {
          const canvas = effectsCanvasRef.current;
          const clickX = canvas ? canvas.width / 2 : window.innerWidth / 2;
          const clickY = canvas ? canvas.height / 2 : window.innerHeight / 2;
          triggerScreenShatter(clickX, clickY);
        }, 1000);
      }
      return () => {
        if (shatterTimer) {
          clearTimeout(shatterTimer);
        }
      };
    }, [freezeAnimState]);

    const playAudioPreset = (presetType: string) => {
      if (!soundEnabled) return;

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
          }, delay * 1000);
        };

        if (presetType === "ding") {
          playTone(523.25, "sine", 0.35, 0);
          playTone(659.25, "sine", 0.35, 0.08);
          playTone(783.99, "sine", 0.35, 0.16);
        } else if (presetType === "cheer") {
          playTone(392.00, "triangle", 0.4, 0);
          playTone(523.25, "triangle", 0.4, 0.1);
          playTone(659.25, "triangle", 0.4, 0.2);
          playTone(783.99, "triangle", 0.6, 0.3);
        } else if (presetType === "focus") {
          playTone(600, "sine", 0.15, 0);
        } else if (presetType === "buzzer") {
          playTone(180.00, "sawtooth", 0.6, 0);
          playTone(170.00, "sawtooth", 0.6, 0.08);
        } else if (presetType === "bubble") {
          playTone(587.33, "sine", 0.12, 0);
          playTone(880.00, "sine", 0.15, 0.04);
          playTone(1174.66, "sine", 0.2, 0.08);
        } else if (presetType === "freeze") {
          playTone(200, "sine", 1.4, 0);
          playTone(300, "sine", 1.6, 0.2);
        } else if (presetType === "shatter") {
          playTone(1300, "sawtooth", 0.08, 0);
          playTone(950, "sawtooth", 0.12, 0.03);
          playTone(180, "sawtooth", 0.4, 0.08);
        }
      } catch (err) {
        console.error("Audio Context failed to initialize:", err);
      }
    };

    const initScribbleSynth = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const bufferSize = ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2.0 - 1.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;
        source.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = "bandpass";
        bandpass.frequency.value = 1300;
        bandpass.Q.value = 0.9;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 3500;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);

        source.connect(bandpass);
        bandpass.connect(lowpass);
        lowpass.connect(gainNode);
        gainNode.connect(ctx.destination);

        source.start(0);

        scribbleSourceRef.current = source;
        scribbleGainRef.current = gainNode;
        scribbleActiveRef.current = true;
      } catch (e) {
        console.error("Pencil synth audio initialization failed:", e);
      }
    };

    const startScribbleSound = (speed: number) => {
      if (!soundEnabled) return;
      if (!scribbleActiveRef.current) {
        initScribbleSynth();
      }

      const gain = scribbleGainRef.current;
      const ctx = audioCtxRef.current;
      if (gain && ctx) {
        const targetVol = Math.min(0.06, speed * 0.0025);
        gain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.05);
      }
    };

    const stopScribbleSound = () => {
      const gain = scribbleGainRef.current;
      const ctx = audioCtxRef.current;
      if (gain && ctx) {
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
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

    const playEmojiBurst = () => {
      playAudioPreset("bubble");
      const emojis = ["❤️", "💖", "👍", "👏", "🔥", "🎉", "🌟", "🎈", "🥰", "🤩"];
      const newParticles: EmojiReactionParticle[] = [];
      const count = 25 + Math.floor(Math.random() * 10);
      
      const canvas = effectsCanvasRef.current;
      const rect = canvas ? canvas.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
      const winW = rect.width;
      const winH = rect.height;

      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: Math.random().toString(36).substring(7),
          x: (winW * 0.15) + (Math.random() * (winW * 0.7)),
          y: winH + 20,
          vx: (Math.random() - 0.5) * 4.5,
          vy: -6 - Math.random() * 7,
          char: emojis[Math.floor(Math.random() * emojis.length)],
          size: 20 + Math.floor(Math.random() * 22),
          opacity: 1.0,
          rot: (Math.random() - 0.5) * 0.5,
          rotSpeed: (Math.random() - 0.5) * 0.05
        });
      }
      emojiParticlesRef.current = [...emojiParticlesRef.current, ...newParticles];
    };

    const playMeteorShower = () => {
      playAudioPreset("focus");
      const colors = ["#facc15", "#60a5fa", "#f472b6", "#a7f3d0", "#ffffff"];
      const newMeteors: MeteorParticle[] = [];
      const winW = window.innerWidth;

      for (let i = 0; i < 75; i++) {
        newMeteors.push({
          x: Math.random() * (winW * 1.3) - (winW * 0.3),
          y: -50 - Math.random() * 350,
          vx: 11 + Math.random() * 8,
          vy: 8 + Math.random() * 6,
          len: 50 + Math.random() * 90,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 0.85 + Math.random() * 0.15
        });
      }
      meteorParticlesRef.current = [...meteorParticlesRef.current, ...newMeteors];
    };

    const triggerScreenFreeze = () => {
      if (freezeAnimState !== "none") return;
      playAudioPreset("freeze");
      setIsFrozen(true);
      setFreezeAnimState("freezing");
      setFreezeProgress(0);
    };

    const triggerScreenShatter = (clickX: number, clickY: number) => {
      playAudioPreset("shatter");
      setFreezeAnimState("shattering");

      const canvas = effectsCanvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      const rows = 9;
      const cols = 12;
      const shardW = w / cols;
      const shardH = h / rows;
      const newShards: GlassShard[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const sx = c * shardW;
          const sy = r * shardH;

          const p1 = { x: sx, y: sy };
          const p2 = { x: sx + shardW, y: sy };
          const p3 = { x: sx, y: sy + shardH };
          const p4 = { x: sx + shardW, y: sy + shardH };

          const center1 = { x: sx + shardW/3, y: sy + shardH/3 };
          const dX1 = center1.x - clickX;
          const dY1 = center1.y - clickY;
          const dist1 = Math.sqrt(dX1*dX1 + dY1*dY1) || 1;
          const force1 = Math.max(1, 15 - dist1 * 0.015);

          newShards.push({
            points: [p1, p2, p3],
            vx: (dX1 / dist1) * force1 + (Math.random() - 0.5) * 3,
            vy: (dY1 / dist1) * force1 - (2 + Math.random() * 3),
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            opacity: 1.0
          });

          const center2 = { x: sx + (shardW*2)/3, y: sy + (shardH*2)/3 };
          const dX2 = center2.x - clickX;
          const dY2 = center2.y - clickY;
          const dist2 = Math.sqrt(dX2*dX2 + dY2*dY2) || 1;
          const force2 = Math.max(1, 15 - dist2 * 0.015);

          newShards.push({
            points: [p2, p4, p3],
            vx: (dX2 / dist2) * force2 + (Math.random() - 0.5) * 3,
            vy: (dY2 / dist2) * force2 - (2 + Math.random() * 3),
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            opacity: 1.0
          });
        }
      }
      glassShardsRef.current = newShards;
    };

    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        if (isFrozen) return;

        const canvas = effectsCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        for (let i = localStampsRef.current.length - 1; i >= 0; i--) {
          const s = localStampsRef.current[i];
          const screenX = s.x * zoomLevel + zoomOffset.x;
          const screenY = s.y * zoomLevel + zoomOffset.y;
          const sWidth = s.width * zoomLevel;
          const sHeight = s.height * zoomLevel;
          const halfW = sWidth / 2;
          const halfH = sHeight / 2;

          if (
            mouseX >= screenX - halfW && mouseX <= screenX + halfW &&
            mouseY >= screenY - halfH && mouseY <= screenY + halfH
          ) {
            draggingStampIdRef.current = s.id;
            s.isDragging = true;
            dragOffsetRef.current = { 
              x: (mouseX - zoomOffset.x)/zoomLevel - s.x, 
              y: (mouseY - zoomOffset.y)/zoomLevel - s.y 
            };
            lastMousePosRef.current = { x: mouseX, y: mouseY };
            s.vx = 0;
            s.vy = 0;
            break;
          }
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (isFrozen || !draggingStampIdRef.current) return;

        const canvas = effectsCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const s = localStampsRef.current.find((stamp) => stamp.id === draggingStampIdRef.current);
        if (s) {
          s.x = (mouseX - zoomOffset.x)/zoomLevel - dragOffsetRef.current.x;
          s.y = (mouseY - zoomOffset.y)/zoomLevel - dragOffsetRef.current.y;

          s.vx = (mouseX - lastMousePosRef.current.x) / zoomLevel;
          s.vy = (mouseY - lastMousePosRef.current.y) / zoomLevel;
          
          lastMousePosRef.current = { x: mouseX, y: mouseY };
        }
      };

      const handleMouseUp = () => {
        if (draggingStampIdRef.current) {
          const s = localStampsRef.current.find((stamp) => stamp.id === draggingStampIdRef.current);
          if (s) {
            s.isDragging = false;
            const speedSq = s.vx * s.vx + s.vy * s.vy;
            if (speedSq > 30) {
              playAudioPreset("bubble");
            }
          }
          draggingStampIdRef.current = null;
        }
      };

      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isFrozen, zoomLevel, zoomOffset]);

    useEffect(() => {
      const canvas = effectsCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      const drawCanvasStamp = (c: CanvasRenderingContext2D, s: SimulatedStamp) => {
        const halfW = s.width / 2;
        const halfH = s.height / 2;

        c.save();
        const screenX = s.x * zoomLevel + zoomOffset.x;
        const screenY = s.y * zoomLevel + zoomOffset.y;
        const finalScale = s.scale * zoomLevel;

        c.translate(screenX, screenY);
        c.scale(finalScale, finalScale);
        
        const grad = c.createLinearGradient(-halfW, -halfH, halfW, halfH);
        const presetColors = getColorPreset(s.type);
        grad.addColorStop(0, presetColors.c1);
        grad.addColorStop(1, presetColors.c2);

        if (s.shape === "circle") {
          c.beginPath();
          c.arc(0, 0, halfW, 0, Math.PI * 2);
          c.fillStyle = grad;
          c.fill();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.5;
          c.stroke();
          
          c.fillStyle = presetColors.textCol;
          c.font = "bold 13px sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(s.text, 0, 0);
        } else if (s.shape === "star") {
          drawStar(c, 0, 0, 5, halfW, halfW * 0.45, "#fbbf24", 0);
          c.fillStyle = "#1e293b";
          c.font = "bold 10px sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(s.text.replace("👍 ", "").replace("👀 ", "").replace("🎉 ", "").replace("⚠️ ", ""), 0, 0);
        } else if (s.shape === "bubble") {
          c.beginPath();
          c.roundRect(-halfW, -halfH, s.width, s.height, 14);
          c.moveTo(-6, halfH);
          c.lineTo(0, halfH + 8);
          c.lineTo(6, halfH);
          c.closePath();
          
          c.fillStyle = grad;
          c.fill();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.5;
          c.stroke();

          c.fillStyle = presetColors.textCol;
          c.font = "bold 13px sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(s.text, 0, 0);
        } else {
          c.beginPath();
          c.roundRect(-halfW, -halfH, s.width, s.height, 14);
          c.fillStyle = grad;
          c.fill();
          c.strokeStyle = "#ffffff";
          c.lineWidth = 2.5;
          c.stroke();

          c.fillStyle = presetColors.textCol;
          c.font = "bold 13px sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(s.text, 0, 0);
        }

        c.restore();
      };

      const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isFrozen) {
          if (freezeAnimState === "freezing") {
            setFreezeProgress((p) => {
              const next = p + 0.025;
              if (next >= 1.0) {
                setFreezeAnimState("frozen");
                return 1.0;
              }
              return next;
            });
          }

          if (freezeAnimState !== "shattering") {
            ctx.save();
            ctx.fillStyle = `rgba(186, 230, 253, ${freezeProgress * 0.35})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const grad = ctx.createRadialGradient(
              canvas.width/2, canvas.height/2, canvas.height/4,
              canvas.width/2, canvas.height/2, canvas.width/2
            );
            grad.addColorStop(0, "rgba(255, 255, 255, 0)");
            grad.addColorStop(1, `rgba(147, 197, 253, ${freezeProgress * 0.65})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = `rgba(255, 255, 255, ${freezeProgress * 0.8})`;
            ctx.lineWidth = 14 * freezeProgress;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }

        if (freezeAnimState === "shattering") {
          const activeShards: GlassShard[] = [];
          ctx.save();

          glassShardsRef.current.forEach((shard) => {
            shard.vx *= 0.98;
            shard.vy += 0.42;
            shard.rot += shard.rotSpeed;
            shard.opacity -= 0.015;

            let cx = 0;
            let cy = 0;
            shard.points.forEach((p) => {
              cx += p.x;
              cy += p.y;
            });
            cx /= shard.points.length;
            cy /= shard.points.length;

            if (shard.opacity > 0 && cy < canvas.height + 200) {
              ctx.save();
              ctx.globalAlpha = shard.opacity;
              ctx.translate(cx, cy);
              ctx.rotate(shard.rot);

              ctx.fillStyle = "rgba(191, 219, 254, 0.4)";
              ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
              ctx.lineWidth = 1.2;

              ctx.beginPath();
              ctx.moveTo(shard.points[0].x - cx, shard.points[0].y - cy);
              for (let i = 1; i < shard.points.length; i++) {
                ctx.lineTo(shard.points[i].x - cx, shard.points[i].y - cy);
              }
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.restore();

              activeShards.push(shard);
            }
          });

          ctx.restore();
          glassShardsRef.current = activeShards;

          if (activeShards.length === 0) {
            setIsFrozen(false);
            setFreezeAnimState("none");
            setFreezeProgress(0);
          }
        }

        if (!isFrozen) {
          const activeStamps: SimulatedStamp[] = [];
          
          localStampsRef.current.forEach((s) => {
            if (s.scale !== s.targetScale) {
              const springStiffness = 0.16;
              const springDamping = 0.78;
              const force = (s.targetScale - s.scale) * springStiffness;
              s.scaleVel = (s.scaleVel + force) * springDamping;
              s.scale += s.scaleVel;
              if (Math.abs(s.scale - s.targetScale) < 0.001 && Math.abs(s.scaleVel) < 0.001) {
                s.scale = s.targetScale;
              }
            }

            if (!s.isDragging) {
              s.x += s.vx;
              s.y += s.vy;
              s.vx *= 0.92;
              s.vy *= 0.92;
            }

            const margin = 120;
            const isOffScreen = 
              s.x < -margin || s.x > canvas.width/zoomLevel + margin ||
              s.y < -margin || s.y > canvas.height/zoomLevel + margin;

            if (!isOffScreen) {
              drawCanvasStamp(ctx, s);
              activeStamps.push(s);
            }
          });

          localStampsRef.current = activeStamps;
        }

        const activeEmojis: EmojiReactionParticle[] = [];
        emojiParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; 
          p.rot += p.rotSpeed;
          p.opacity -= 0.012;

          if (p.opacity > 0 && p.y > -50) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.font = `${p.size}px sans-serif`;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(p.char, 0, 0);
            ctx.restore();
            activeEmojis.push(p);
          }
        });
        emojiParticlesRef.current = activeEmojis;

        const activeStars: StarParticle[] = [];
        starParticlesRef.current.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.rot += s.rotSpeed;
          s.opacity -= 0.035;
          s.size = Math.max(0, s.size - 0.2);

          if (s.opacity > 0 && s.size > 0.5) {
            ctx.save();
            ctx.globalAlpha = s.opacity;
            drawStar(ctx, s.x, s.y, 4, s.size, s.size * 0.4, s.color, s.rot);
            ctx.restore();
            activeStars.push(s);
          }
        });
        starParticlesRef.current = activeStars;

        const activeFire: FireParticle[] = [];
        fireParticlesRef.current.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          f.opacity -= 0.038;
          f.size = Math.max(0, f.size - 0.35);

          if (f.opacity > 0 && f.size > 0.5) {
            ctx.save();
            ctx.globalAlpha = f.opacity;
            
            const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
            radGrad.addColorStop(0, f.color);
            radGrad.addColorStop(0.3, f.color);
            radGrad.addColorStop(1, "rgba(239, 68, 68, 0)");

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            activeFire.push(f);
          }
        });
        fireParticlesRef.current = activeFire;

        const activeBubbles: BubbleParticle[] = [];
        bubbleParticlesRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
          b.opacity -= 0.015;

          if (b.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = b.opacity;
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.18, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            activeBubbles.push(b);
          }
        });
        bubbleParticlesRef.current = activeBubbles;

        const activeMeteors: MeteorParticle[] = [];
        meteorParticlesRef.current.forEach((m) => {
          m.x += m.vx;
          m.y += m.vy;
          m.opacity -= 0.008;

          if (m.opacity > 0 && m.y < canvas.height + 100 && m.x < canvas.width + 100) {
            ctx.save();
            ctx.globalAlpha = m.opacity;
            ctx.lineWidth = 3.5; // Thicker meteor streak glow

            const headX = m.x;
            const headY = m.y;
            const tailX = m.x - m.vx * 3;
            const tailY = m.y - m.vy * 3;

            const streakGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
            streakGrad.addColorStop(0, m.color);
            streakGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

            ctx.strokeStyle = streakGrad;
            ctx.beginPath();
            ctx.moveTo(headX, headY);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(headX, headY, 2.5, 0, Math.PI * 2); // Larger star tip
            ctx.fill();

            ctx.restore();

            // Eject stardust particles behind the falling meteor head for dramatic visual trail
            if (Math.random() < 0.42) {
              starParticlesRef.current.push({
                id: Math.random().toString(36).substring(7),
                x: headX + (Math.random() - 0.5) * 6,
                y: headY + (Math.random() - 0.5) * 6,
                vx: -m.vx * 0.15 + (Math.random() - 0.5) * 1.5,
                vy: -m.vy * 0.15 + (Math.random() - 0.5) * 1.5,
                size: 2.2 + Math.random() * 3.5,
                opacity: 0.95,
                color: m.color,
                rot: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.1
              });
            }

            activeMeteors.push(m);
          }
        });
        meteorParticlesRef.current = activeMeteors;

        // Draw AI Custom Particles
        const activeCustom: CustomParticle[] = [];
        customParticlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;
          p.life++;

          // Apply physics based on animation type
          if (p.animation === "rain") {
            p.vy += 0.08; // gravity
            p.vx = Math.sin(p.life / 15) * 0.5; // slight sway
          } else if (p.animation === "float") {
            p.vy = -1.5 - Math.sin(p.life / 30) * 0.5; // float velocity
            p.vx = Math.sin(p.life / 20) * 0.8; // wobble sway
          } else if (p.animation === "explosion") {
            p.vx *= 0.98; // air resistance friction
            p.vy *= 0.98;
          }

          // Calculate opacity fade out based on life
          if (p.life > p.maxLife * 0.7) {
            p.opacity = 1.0 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3);
          }

          if (p.life < p.maxLife && p.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.drawImage(p.image, -p.size / 2, -p.size / 2, p.size, p.size);
            ctx.restore();
            activeCustom.push(p);
          }
        });
        customParticlesRef.current = activeCustom;

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      loop();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isFrozen, freezeAnimState, freezeProgress, zoomLevel, zoomOffset]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isFrozen && freezeAnimState === "frozen") {
        const rect = effectsCanvasRef.current?.getBoundingClientRect();
        if (rect) {
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          triggerScreenShatter(clickX, clickY);
        }
      }
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
          return { c1: "#f59e0b", c2: "#d97706", textCol: "#1e293b" };
        case "focus":
          return { c1: "#6366f1", c2: "#4f46e5", textCol: "#ffffff" };
        case "correct":
          return { c1: "#ec4899", c2: "#db2777", textCol: "#ffffff" };
        case "wrong":
          return { c1: "#f97316", c2: "#ea580c", textCol: "#ffffff" };
        case "custom":
        default:
          return { c1: "#a855f7", c2: "#7c3aed", textCol: "#ffffff" };
      }
    };

    const playCustomEffect = (
      shape: string,
      style: "crystal" | "jelly" | "gold",
      animation: "explosion" | "rain" | "float",
      customImageUrl?: string
    ) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      if (customImageUrl) {
        img.src = customImageUrl;
      } else {
        const svgStr = getStylizedSvg(shape as any, style);
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);
      }

      if (soundEnabled) {
        playAudioPreset("ding");
      }

      img.onload = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        if (animation === "explosion") {
          const spawnX = lastMousePosRef.current.x || width / 2;
          const spawnY = lastMousePosRef.current.y || height / 2;

          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            customParticlesRef.current.push({
              id: Math.random().toString(36).substring(7),
              x: spawnX,
              y: spawnY,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 24 + Math.random() * 24,
              opacity: 1.0,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: -0.1 + Math.random() * 0.2,
              image: img,
              animation: "explosion",
              life: 0,
              maxLife: 60 + Math.random() * 40
            });
          }
        } else if (animation === "rain") {
          for (let i = 0; i < 30; i++) {
            customParticlesRef.current.push({
              id: Math.random().toString(36).substring(7),
              x: Math.random() * width,
              y: -50 - Math.random() * 150,
              vx: -1 + Math.random() * 2,
              vy: 2 + Math.random() * 4,
              size: 20 + Math.random() * 20,
              opacity: 1.0,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: -0.05 + Math.random() * 0.1,
              image: img,
              animation: "rain",
              life: 0,
              maxLife: 150 + Math.random() * 100
            });
          }
        } else if (animation === "float") {
          for (let i = 0; i < 25; i++) {
            customParticlesRef.current.push({
              id: Math.random().toString(36).substring(7),
              x: Math.random() * width,
              y: height + 50 + Math.random() * 150,
              vx: -0.5 + Math.random() * 1,
              vy: -1.5 - Math.random() * 3,
              size: 20 + Math.random() * 24,
              opacity: 1.0,
              rotation: Math.random() * Math.PI * 2,
              rotSpeed: -0.02 + Math.random() * 0.04,
              image: img,
              animation: "float",
              life: 0,
              maxLife: 150 + Math.random() * 100
            });
          }
        }
      };
    };

    useImperativeHandle(ref, () => ({
      triggerConfetti,
      playAudioPreset,
      playEmojiBurst,
      setCursorTrailType: (type: "none" | "star" | "fire" | "bubble") => {
        setCursorTrailTypeState(type);
        starParticlesRef.current = [];
        fireParticlesRef.current = [];
        bubbleParticlesRef.current = [];
      },
      setMagicTrailActive: (active: boolean) => {
        setCursorTrailTypeState(active ? "star" : "none");
        starParticlesRef.current = [];
      },
      playMeteorShower,
      triggerScreenFreeze,
      startScribbleSound,
      stopScribbleSound,
      playCustomEffect
    }));

    return (
      <div 
        className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none" 
        style={{ zIndex: 35 }}
      >
        <canvas ref={confettiCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        <canvas 
          ref={effectsCanvasRef} 
          onClick={handleCanvasClick}
          className={`absolute inset-0 h-full w-full z-10 ${
            isFrozen || isEffectsInteractive ? "pointer-events-auto" : "pointer-events-none"
          }`} 
        />
      </div>
    );
  }
);

InteractiveEffects.displayName = "InteractiveEffects";
