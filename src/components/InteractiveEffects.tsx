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
  setCursorTrailType: (type: "none" | "star" | "fire" | "bubble") => void;
  playMeteorShower: () => void;
  triggerScreenFreeze: () => void;
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

export const InteractiveEffects = forwardRef<InteractiveEffectsRef, InteractiveEffectsProps>(
  ({ stamps, zoomLevel, zoomOffset, soundEnabled }, ref) => {
    const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
    const effectsCanvasRef = useRef<HTMLCanvasElement>(null);
    
    const myConfettiRef = useRef<any>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Particle registers (Ref-backed for performance)
    const emojiParticlesRef = useRef<EmojiReactionParticle[]>([]);
    const starParticlesRef = useRef<StarParticle[]>([]);
    const fireParticlesRef = useRef<FireParticle[]>([]);
    const bubbleParticlesRef = useRef<BubbleParticle[]>([]);
    const meteorParticlesRef = useRef<MeteorParticle[]>([]);
    const glassShardsRef = useRef<GlassShard[]>([]);

    // State bindings
    const [cursorTrailType, setCursorTrailTypeState] = useState<"none" | "star" | "fire" | "bubble">("none");
    const [isFrozen, setIsFrozen] = useState(false);
    const [freezeAnimState, setFreezeAnimState] = useState<"none" | "freezing" | "frozen" | "shattering">("none");
    const [freezeProgress, setFreezeProgress] = useState(0);

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
        } else if (presetType === "freeze") {
          // Low blowing wind/ice sweep
          playTone(180, "triangle", 1.2, 0);
          playTone(220, "sine", 1.5, 0.2);
          playTone(330, "sine", 1.8, 0.4);
        } else if (presetType === "shatter") {
          // High frequency cracking metallic noise
          playTone(1200, "sawtooth", 0.1, 0);
          playTone(900, "sawtooth", 0.15, 0.04);
          playTone(700, "triangle", 0.2, 0.08);
          playTone(150, "sawtooth", 0.4, 0.12); // low explosion thud
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

    const playEmojiBurst = () => {
      playAudioPreset("bubble");
      const emojis = ["❤️", "💖", "👍", "👏", "🔥", "🎉", "🌟", "🎈", "🥰", "🤩"];
      const newParticles: EmojiReactionParticle[] = [];
      const count = 25 + Math.floor(Math.random() * 10);
      const winW = window.innerWidth;
      const winH = window.innerHeight;

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

    // Meteor Shower Trigger
    const playMeteorShower = () => {
      playAudioPreset("ding");
      const colors = ["#facc15", "#60a5fa", "#f472b6", "#a7f3d0", "#ffffff"];
      const newMeteors: MeteorParticle[] = [];
      const winW = window.innerWidth;

      for (let i = 0; i < 25; i++) {
        newMeteors.push({
          x: Math.random() * (winW * 1.2) - (winW * 0.2), // start scattered
          y: -50 - Math.random() * 200,
          vx: 8 + Math.random() * 6,     // slide down-right speed
          vy: 6 + Math.random() * 5,
          len: 40 + Math.random() * 80,
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: 0.8 + Math.random() * 0.2
        });
      }
      meteorParticlesRef.current = [...meteorParticlesRef.current, ...newMeteors];
    };

    // Screen Freezing Trigger
    const triggerScreenFreeze = () => {
      if (freezeAnimState !== "none") return;
      playAudioPreset("freeze");
      setIsFrozen(true);
      setFreezeAnimState("freezing");
      setFreezeProgress(0);
    };

    // Screen Shattering Core Physics
    const triggerScreenShatter = (clickX: number, clickY: number) => {
      playAudioPreset("shatter");
      setFreezeAnimState("shattering");

      const canvas = effectsCanvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;

      // Slice screen viewport into small triangular pieces
      const rows = 9;
      const cols = 12;
      const shardW = w / cols;
      const shardH = h / rows;
      const newShards: GlassShard[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const sx = c * shardW;
          const sy = r * shardH;

          // Generate 2 triangular shards per grid block
          const p1 = { x: sx, y: sy };
          const p2 = { x: sx + shardW, y: sy };
          const p3 = { x: sx, y: sy + shardH };
          const p4 = { x: sx + shardW, y: sy + shardH };

          // Shard 1
          const center1 = { x: sx + shardW/3, y: sy + shardH/3 };
          const dX1 = center1.x - clickX;
          const dY1 = center1.y - clickY;
          const dist1 = Math.sqrt(dX1*dX1 + dY1*dY1) || 1;

          // Blast velocity vectors pushing outwards from click point
          const force1 = Math.max(1, 15 - dist1 * 0.015);
          newShards.push({
            points: [p1, p2, p3],
            vx: (dX1 / dist1) * force1 + (Math.random() - 0.5) * 3,
            vy: (dY1 / dist1) * force1 - (2 + Math.random() * 3), // lift-off push
            rot: 0,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            opacity: 1.0
          });

          // Shard 2
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

    // Global cursor trail generator on mousemove
    useEffect(() => {
      if (cursorTrailType === "none") return;

      const handleMouseMove = (e: MouseEvent) => {
        const canvas = effectsCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (cursorTrailType === "star") {
          // 1. Star Trail
          const newStars: StarParticle[] = [];
          const colors = ["#facc15", "#fef08a", "#a7f3d0", "#bae6fd", "#fbcfe8"];
          for (let i = 0; i < 2; i++) {
            newStars.push({
              id: Math.random().toString(36).substring(7),
              x: mouseX,
              y: mouseY,
              vx: (Math.random() - 0.5) * 2.2,
              vy: (Math.random() - 0.5) * 2.2,
              size: 8 + Math.random() * 10,
              opacity: 1.0,
              color: colors[Math.floor(Math.random() * colors.length)],
              rot: Math.random() * Math.PI,
              rotSpeed: (Math.random() - 0.5) * 0.08
            });
          }
          starParticlesRef.current = [...starParticlesRef.current, ...newStars];
        } else if (cursorTrailType === "fire") {
          // 2. Fire Particle Trail
          const newFire: FireParticle[] = [];
          const colors = ["#ef4444", "#f97316", "#f59e0b", "#eab308"]; // red, orange, gold sparks
          for (let i = 0; i < 3; i++) {
            newFire.push({
              x: mouseX,
              y: mouseY,
              vx: (Math.random() - 0.5) * 1.8,
              vy: -1.2 - Math.random() * 2.5, // floats up
              size: 10 + Math.random() * 12,
              opacity: 1.0,
              color: colors[Math.floor(Math.random() * colors.length)]
            });
          }
          fireParticlesRef.current = [...fireParticlesRef.current, ...newFire];
        } else if (cursorTrailType === "bubble") {
          // 3. Bubble Particle Trail
          const newBubbles: BubbleParticle[] = [];
          const colors = ["rgba(167, 243, 208, 0.45)", "rgba(186, 230, 253, 0.45)", "rgba(251, 207, 232, 0.45)"];
          for (let i = 0; i < 1; i++) {
            if (Math.random() > 0.4) { // spawn rate control
              newBubbles.push({
                x: mouseX,
                y: mouseY,
                vx: (Math.random() - 0.5) * 1.0,
                vy: -0.4 - Math.random() * 0.8, // floats up slowly
                radius: 6 + Math.random() * 10,
                opacity: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)]
              });
            }
          }
          bubbleParticlesRef.current = [...bubbleParticlesRef.current, ...newBubbles];
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [cursorTrailType]);

    // Handle screen resizing
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

    // Main 60fps Canvas render loop
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

      const loop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // A. SCENE EFFECT: FREEZING LAYER
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
            // Draw frosted blue texture filter
            ctx.save();
            ctx.fillStyle = `rgba(186, 230, 253, ${freezeProgress * 0.35})`; // frost overlay
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw frosted vignette edge
            const grad = ctx.createRadialGradient(
              canvas.width/2, canvas.height/2, canvas.height/4,
              canvas.width/2, canvas.height/2, canvas.width/2
            );
            grad.addColorStop(0, "rgba(255, 255, 255, 0)");
            grad.addColorStop(1, `rgba(147, 197, 253, ${freezeProgress * 0.65})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Frosted border frame
            ctx.strokeStyle = `rgba(255, 255, 255, ${freezeProgress * 0.8})`;
            ctx.lineWidth = 14 * freezeProgress;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
          }
        }

        // B. SCENE EFFECT: GLASS SHATTER PHYSICS
        if (freezeAnimState === "shattering") {
          const activeShards: GlassShard[] = [];
          ctx.save();

          glassShardsRef.current.forEach((shard) => {
            // physics calculation
            shard.vx *= 0.98; // friction
            shard.vy += 0.42; // gravity fall
            shard.rot += shard.rotSpeed;
            shard.opacity -= 0.015; // slow disappear

            // Calculate barycenter
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

              // frosted color
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
            // Completed shattering phase
            setIsFrozen(false);
            setFreezeAnimState("none");
            setFreezeProgress(0);
          }
        }

        // 1. EMOJI BURST
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

        // 2. STAR CURSOR TRAILS
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

        // 3. FIRE CURSOR TRAILS
        const activeFire: FireParticle[] = [];
        fireParticlesRef.current.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          f.opacity -= 0.038;
          f.size = Math.max(0, f.size - 0.35);

          if (f.opacity > 0 && f.size > 0.5) {
            ctx.save();
            ctx.globalAlpha = f.opacity;
            
            // Draw soft round flames
            const radGrad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size);
            radGrad.addColorStop(0, f.color);
            radGrad.addColorStop(0.3, f.color);
            radGrad.addColorStop(1, "rgba(239, 68, 68, 0)"); // fade border

            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            activeFire.push(f);
          }
        });
        fireParticlesRef.current = activeFire;

        // 4. BUBBLE CURSOR TRAILS
        const activeBubbles: BubbleParticle[] = [];
        bubbleParticlesRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
          b.opacity -= 0.015;

          if (b.opacity > 0) {
            ctx.save();
            ctx.globalAlpha = b.opacity;
            ctx.strokeStyle = b.color;
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.stroke();

            // highlight reflection shine
            ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            activeBubbles.push(b);
          }
        });
        bubbleParticlesRef.current = activeBubbles;

        // 5. METEOR SHOWER OVERLAY
        const activeMeteors: MeteorParticle[] = [];
        meteorParticlesRef.current.forEach((m) => {
          m.x += m.vx;
          m.y += m.vy;
          m.opacity -= 0.008; // slow fade

          if (m.opacity > 0 && m.y < canvas.height + 100 && m.x < canvas.width + 100) {
            ctx.save();
            ctx.globalAlpha = m.opacity;
            ctx.lineWidth = 2.0;

            // Draw streak tail gradient
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

            // Tiny sparkle head
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(headX, headY, 1.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            activeMeteors.push(m);
          }
        });
        meteorParticlesRef.current = activeMeteors;

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      loop();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isFrozen, freezeAnimState, freezeProgress]);

    // Handle canvas click during freeze (triggers shatter crack)
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

    // Expose methods to parent App
    useImperativeHandle(ref, () => ({
      triggerConfetti,
      playAudioPreset,
      playEmojiBurst,
      setCursorTrailType: (type: "none" | "star" | "fire" | "bubble") => {
        setCursorTrailTypeState(type);
        // flush other arrays to prevent carryover
        starParticlesRef.current = [];
        fireParticlesRef.current = [];
        bubbleParticlesRef.current = [];
      },
      setMagicTrailActive: (active: boolean) => {
        setCursorTrailTypeState(active ? "star" : "none");
        starParticlesRef.current = [];
      },
      playMeteorShower,
      triggerScreenFreeze
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
      <div 
        className={`absolute inset-0 h-full w-full overflow-hidden ${
          isFrozen && freezeAnimState === "frozen" 
            ? "pointer-events-auto cursor-pointer" 
            : "pointer-events-none"
        }`} 
        style={{ zIndex: 35 }}
      >
        {/* Fullscreen Confetti Canvas Overlay */}
        <canvas ref={confettiCanvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />

        {/* 60fps Custom Interaction Canvas (Shatter, Emoji, Star, Fire, Bubble, Meteor) */}
        <canvas 
          ref={effectsCanvasRef} 
          onClick={handleCanvasClick}
          className={`absolute inset-0 h-full w-full z-10 ${
            isFrozen && freezeAnimState === "frozen" ? "pointer-events-auto" : "pointer-events-none"
          }`} 
        />

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
