import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { AuthUser } from "@login-lab/shared";
import { CAT_H, CAT_W, catDataUrl } from "./catArt";

type Food = { emoji: string; name: string; points: number; weight: number };

export const FOODS: Food[] = [
  { emoji: "🍓", name: "Stroberi", points: 5, weight: 6 },
  { emoji: "🍙", name: "Onigiri", points: 8, weight: 5 },
  { emoji: "🍩", name: "Donat", points: 10, weight: 5 },
  { emoji: "🍕", name: "Pizza", points: 12, weight: 4 },
  { emoji: "🍜", name: "Mie", points: 12, weight: 4 },
  { emoji: "🍔", name: "Burger", points: 15, weight: 3 },
  { emoji: "🍣", name: "Sushi", points: 20, weight: 2 },
  { emoji: "🐟", name: "Ikan", points: 30, weight: 1 },
];
const TOTAL_WEIGHT = FOODS.reduce((s, f) => s + f.weight, 0);

type FoodItem = { kind: "food"; food: Food; x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number };
type RockItem = { kind: "rock"; x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; shape: number[]; craters: [number, number, number][] };
type Item = FoodItem | RockItem;
type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; star: boolean };
type FloatText = { x: number; y: number; text: string; life: number; color: string };
type Star = { x: number; y: number; size: number; speed: number; phase: number };
type Phase = "ready" | "playing" | "paused" | "over";

type Hud = {
  phase: Phase;
  score: number;
  best: number;
  lives: number;
  combo: number;
  collected: Record<string, number>;
  newBest: boolean;
};

const MAX_LIVES = 3;
const COMBO_WINDOW = 1.6;
const SPEED = 460;
const TRAIL_COLORS = ["#5ee7ff", "#b18cff", "#ff7ad9", "#ffe066"];
const BURST_COLORS = ["#ffe066", "#ff7ad9", "#ffffff", "#5ee7ff"];
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function pickFood(): Food {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const f of FOODS) {
    r -= f.weight;
    if (r <= 0) return f;
  }
  return FOODS[0];
}

function loadBest(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}
function saveBest(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* penyimpanan tidak tersedia */
  }
}

function createGame(best: number) {
  return {
    phase: "ready" as Phase,
    w: 0,
    h: 0,
    s: 1,
    cat: { x: 0, y: 0, tilt: 0 },
    keys: new Set<string>(),
    pointer: null as null | { x: number; y: number },
    items: [] as Item[],
    particles: [] as Particle[],
    texts: [] as FloatText[],
    stars: [] as Star[],
    score: 0,
    lives: MAX_LIVES,
    combo: 0,
    lastCatch: -99,
    time: 0,
    elapsed: 0,
    spawnT: 0.6,
    invuln: 0,
    shake: 0,
    trailT: 0,
    planetX: 0,
    collected: {} as Record<string, number>,
    best,
    newBest: false,
  };
}
type Game = ReturnType<typeof createGame>;

export function SpaceGame({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const bestKey = `kucing-kosmik-best:${user.email}`;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [g] = useState<Game>(() => createGame(loadBest(bestKey)));
  const [hud, setHud] = useState<Hud>(() => snapshot(g));
  const controls = useRef<{ start: () => void; togglePause: () => void }>();

  useEffect(() => {
    const push = () => setHud(snapshot(g));

    const start = () => {
      Object.assign(g, {
        phase: "playing",
        items: [],
        texts: [],
        score: 0,
        lives: MAX_LIVES,
        combo: 0,
        lastCatch: -99,
        elapsed: 0,
        spawnT: 0.8,
        invuln: 1,
        shake: 0,
        collected: {},
        newBest: false,
      });
      push();
    };
    const togglePause = () => {
      if (g.phase === "playing") g.phase = "paused";
      else if (g.phase === "paused") g.phase = "playing";
      else return;
      g.keys.clear();
      push();
    };
    controls.current = { start, togglePause };

    const MOVE_KEYS: Record<string, string> = {
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea")) return;
      const dir = MOVE_KEYS[e.key];
      if (dir) {
        e.preventDefault();
        g.keys.add(dir);
        g.pointer = null;
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if ((e.target as HTMLElement)?.tagName === "BUTTON") return;
        e.preventDefault();
        if (g.phase === "ready" || g.phase === "over") start();
        else if (g.phase === "paused") togglePause();
      } else if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        togglePause();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const dir = MOVE_KEYS[e.key];
      if (dir) g.keys.delete(dir);
    };
    const onVisibility = () => {
      if (document.hidden && g.phase === "playing") togglePause();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);
    const removeListeners = () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return removeListeners;

    const img = new Image();
    img.src = catDataUrl(false);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const first = g.w === 0;
      g.w = window.innerWidth;
      g.h = window.innerHeight;
      g.s = g.w < 600 ? 0.75 : 1.1;
      canvas.width = Math.round(g.w * dpr);
      canvas.height = Math.round(g.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((g.w * g.h) / 6000);
      g.stars = Array.from({ length: count }, () => {
        const layer = Math.random();
        return {
          x: Math.random() * g.w,
          y: Math.random() * g.h,
          size: layer < 0.6 ? 1 : layer < 0.9 ? 1.6 : 2.4,
          speed: layer < 0.6 ? 20 : layer < 0.9 ? 55 : 120,
          phase: Math.random() * Math.PI * 2,
        };
      });
      if (first) {
        g.cat.x = g.w * 0.22;
        g.cat.y = g.h * 0.5;
        g.planetX = g.w * 0.8;
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const emit = (x: number, y: number, n: number, colors: string[], speed: number, star: boolean) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = rand(speed * 0.4, speed);
        const max = rand(0.4, 0.8);
        g.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color: colors[i % colors.length], size: rand(2, 4.5), star });
      }
    };

    const spawn = () => {
      const s = g.s;
      const e = g.elapsed;
      const speed = (170 + e * 3.5 + rand(0, 110)) * (g.w < 600 ? 0.8 : 1);
      const y = rand(50, g.h - 50);
      const base = { x: g.w + 60, y, vx: -speed, vy: rand(-20, 20), rot: rand(0, Math.PI * 2) };
      if (Math.random() < Math.min(0.33, 0.1 + e * 0.004)) {
        const r = rand(16, 32) * s;
        g.items.push({
          ...base,
          kind: "rock",
          r,
          vr: rand(-1.5, 1.5),
          shape: Array.from({ length: 9 }, () => rand(0.75, 1.05)),
          craters: Array.from({ length: 3 }, () => [rand(-0.4, 0.4), rand(-0.4, 0.4), rand(0.12, 0.22)] as [number, number, number]),
        });
      } else {
        g.items.push({ ...base, kind: "food", food: pickFood(), r: 22 * s, vr: rand(-0.8, 0.8) });
      }
      g.spawnT = Math.max(0.25, 0.85 - e * 0.012) * rand(0.6, 1.4);
    };

    const hitCat = (it: Item, pad: number) => {
      const s = g.s;
      const hx = g.cat.x + 30 * s, hy = g.cat.y - 8 * s;
      const bx = g.cat.x - 5 * s, by = g.cat.y + 8 * s;
      return Math.hypot(it.x - hx, it.y - hy) < it.r + 22 * s + pad || Math.hypot(it.x - bx, it.y - by) < it.r + 24 * s + pad;
    };

    const update = (dt: number) => {
      if (g.phase === "paused") return;
      g.time += dt;
      const s = g.s;
      const playing = g.phase === "playing";

      for (const st of g.stars) {
        st.x -= st.speed * dt * (playing ? 1 : 0.4);
        if (st.x < -3) {
          st.x = g.w + 3;
          st.y = Math.random() * g.h;
        }
      }
      g.planetX -= 6 * dt;
      if (g.planetX < -200) g.planetX = g.w + 200;

      for (const p of g.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= dt;
      }
      g.particles = g.particles.filter((p) => p.life > 0);
      for (const t of g.texts) {
        t.y -= 45 * dt;
        t.life -= dt;
      }
      g.texts = g.texts.filter((t) => t.life > 0);

      const prevY = g.cat.y;
      if (playing) {
        g.elapsed += dt;
        let dx = 0, dy = 0;
        if (g.keys.has("up")) dy -= 1;
        if (g.keys.has("down")) dy += 1;
        if (g.keys.has("left")) dx -= 1;
        if (g.keys.has("right")) dx += 1;
        if (dx || dy) {
          const len = Math.hypot(dx, dy);
          g.cat.x += (dx / len) * SPEED * dt;
          g.cat.y += (dy / len) * SPEED * dt;
        } else if (g.pointer) {
          const k = Math.min(1, dt * 7);
          g.cat.x += (g.pointer.x - g.cat.x) * k;
          g.cat.y += (g.pointer.y - g.cat.y) * k;
        }
        g.cat.x = clamp(g.cat.x, 70 * s, g.w - 64 * s);
        g.cat.y = clamp(g.cat.y, 40 * s, g.h - 35 * s);

        g.spawnT -= dt;
        if (g.spawnT <= 0) spawn();
      } else {
        const k = Math.min(1, dt * 3);
        g.cat.x += (g.w * 0.22 - g.cat.x) * k;
        g.cat.y += (g.h * 0.5 + Math.sin(g.time * 2) * 14 - g.cat.y) * k;
      }
      const vy = (g.cat.y - prevY) / Math.max(dt, 1e-3);
      g.cat.tilt += (clamp(vy / 1400, -0.3, 0.3) - g.cat.tilt) * Math.min(1, dt * 8);

      g.trailT -= dt;
      while (g.trailT < 0) {
        g.trailT += 0.018;
        const max = rand(0.5, 0.9);
        g.particles.push({
          x: g.cat.x - 40 * s,
          y: g.cat.y - 9 * s + rand(-5, 5) * s,
          vx: -rand(120, 220),
          vy: rand(-18, 18),
          life: max,
          max,
          color: TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)],
          size: rand(1.5, 3.5) * s,
          star: Math.random() < 0.4,
        });
      }

      let changed = false;
      for (const it of g.items) {
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
        if (it.y < it.r || it.y > g.h - it.r) it.vy *= -1;
        if (!playing || it.x < -100) continue;
        if (it.kind === "food" && hitCat(it, 8 * s)) {
          it.x = -999;
          g.combo = g.time - g.lastCatch < COMBO_WINDOW ? Math.min(5, g.combo + 1) : 1;
          g.lastCatch = g.time;
          const pts = it.food.points * g.combo;
          g.score += pts;
          g.collected[it.food.emoji] = (g.collected[it.food.emoji] ?? 0) + 1;
          g.texts.push({ x: g.cat.x + 40 * s, y: g.cat.y - 40 * s, text: g.combo > 1 ? `+${pts} x${g.combo}` : `+${pts}`, life: 0.9, color: g.combo > 1 ? "#ff7ad9" : "#ffe066" });
          emit(g.cat.x + 35 * s, g.cat.y, 14, BURST_COLORS, 220, true);
          changed = true;
        } else if (it.kind === "rock" && g.invuln <= 0 && hitCat(it, -4 * s)) {
          it.x = -999;
          g.lives -= 1;
          g.invuln = 1.6;
          g.combo = 0;
          g.shake = 0.35;
          emit(g.cat.x, g.cat.y, 20, ["#9aa1b5", "#c9cede", "#ff7a3d"], 260, false);
          g.texts.push({ x: g.cat.x, y: g.cat.y - 50 * s, text: "Aduh!", life: 0.9, color: "#ff8787" });
          if (g.lives <= 0) {
            g.phase = "over";
            g.keys.clear();
            if (g.score > g.best) {
              g.best = g.score;
              g.newBest = true;
              saveBest(bestKey, g.best);
            }
          }
          changed = true;
        }
      }
      g.items = g.items.filter((it) => it.x > -100);
      g.invuln = Math.max(0, g.invuln - dt);
      g.shake = Math.max(0, g.shake - dt);
      if (g.combo > 0 && g.time - g.lastCatch > COMBO_WINDOW) {
        g.combo = 0;
        changed = true;
      }
      if (changed) push();
    };

    const glow = (x: number, y: number, r: number, color: string) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    const sparkle = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2);
      ctx.lineTo(x + r * 0.5, y);
      ctx.lineTo(x, y + r * 2);
      ctx.lineTo(x - r * 0.5, y);
      ctx.closePath();
      ctx.moveTo(x - r * 2, y);
      ctx.lineTo(x, y - r * 0.5);
      ctx.lineTo(x + r * 2, y);
      ctx.lineTo(x, y + r * 0.5);
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      const { w, h, s } = g;
      ctx.save();
      if (g.shake > 0) ctx.translate(rand(-8, 8) * g.shake * 2.5, rand(-8, 8) * g.shake * 2.5);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0a0720");
      bg.addColorStop(1, "#1b0f3d");
      ctx.fillStyle = bg;
      ctx.fillRect(-20, -20, w + 40, h + 40);
      const big = Math.max(w, h);
      glow(w * 0.78, h * 0.22, big * 0.45, "rgba(177,140,255,0.16)");
      glow(w * 0.15, h * 0.85, big * 0.4, "rgba(94,231,255,0.09)");
      glow(w * 0.5, h * 0.55, big * 0.35, "rgba(255,122,217,0.07)");

      for (const st of g.stars) {
        ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(g.time * 1.5 + st.phase));
        ctx.fillStyle = "#fff";
        ctx.fillRect(st.x, st.y, st.size, st.size);
      }
      ctx.globalAlpha = 1;

      // planet bercincin
      const px = g.planetX, py = h * 0.8, pr = 70 * s;
      ctx.strokeStyle = "rgba(255,214,150,0.55)";
      ctx.lineWidth = 6 * s;
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.7, pr * 0.42, -0.25, Math.PI, Math.PI * 2);
      ctx.stroke();
      const pg = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
      pg.addColorStop(0, "#ffb38a");
      pg.addColorStop(0.6, "#c2569e");
      pg.addColorStop(1, "#4b2a8a");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(px, py, pr * 1.7, pr * 0.42, -0.25, 0, Math.PI);
      ctx.stroke();

      for (const it of g.items) {
        ctx.save();
        ctx.translate(it.x, it.y);
        if (it.kind === "food") {
          glow(0, 0, it.r * 1.7, "rgba(255,224,102,0.28)");
          ctx.rotate(Math.sin(it.rot) * 0.35);
          ctx.font = `${Math.round(it.r * 1.75)}px ${EMOJI_FONT}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(it.food.emoji, 0, 2);
        } else {
          ctx.rotate(it.rot);
          ctx.beginPath();
          it.shape.forEach((k, i) => {
            const a = (i / it.shape.length) * Math.PI * 2;
            const x = Math.cos(a) * it.r * k, y = Math.sin(a) * it.r * k;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          const rg = ctx.createRadialGradient(-it.r * 0.3, -it.r * 0.3, 1, 0, 0, it.r);
          rg.addColorStop(0, "#a3a8ba");
          rg.addColorStop(1, "#4a4d5e");
          ctx.fillStyle = rg;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,120,80,0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = "rgba(40,40,55,0.55)";
          for (const [cx, cy, cr] of it.craters) {
            ctx.beginPath();
            ctx.arc(cx * it.r, cy * it.r, cr * it.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      for (const p of g.particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        if (p.star) sparkle(p.x, p.y, p.size);
        else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      const blink = g.invuln > 0 && g.phase === "playing" && Math.floor(g.time * 12) % 2 === 0;
      if (!blink) {
        ctx.save();
        ctx.translate(g.cat.x, g.cat.y);
        ctx.rotate(g.cat.tilt);
        const fx = -35 * s, fy = -9 * s;
        const len = (16 + Math.sin(g.time * 40) * 4 + rand(0, 4)) * s;
        ctx.fillStyle = "#ff7a3d";
        ctx.beginPath();
        ctx.moveTo(fx, fy - 7 * s);
        ctx.quadraticCurveTo(fx - len * 0.6, fy - 2 * s, fx - len * 1.6, fy);
        ctx.quadraticCurveTo(fx - len * 0.6, fy + 2 * s, fx, fy + 7 * s);
        ctx.fill();
        ctx.fillStyle = "#ffe066";
        ctx.beginPath();
        ctx.moveTo(fx, fy - 4 * s);
        ctx.lineTo(fx - len * 0.9, fy);
        ctx.lineTo(fx, fy + 4 * s);
        ctx.fill();
        if (img.complete && img.naturalWidth > 0) ctx.drawImage(img, -65 * s, -42 * s, CAT_W * s, CAT_H * s);
        ctx.restore();
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${Math.round(14 * Math.max(s, 0.9))}px "Press Start 2P", monospace`;
      ctx.lineWidth = 4;
      for (const t of g.texts) {
        ctx.globalAlpha = Math.min(1, t.life / 0.4);
        ctx.strokeStyle = "#140c33";
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    };

    let raf = 0;
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      removeListeners();
    };
  }, [g, bestKey]);

  const onPointer = (e: PointerEvent<HTMLCanvasElement>) => {
    g.pointer = { x: e.clientX, y: e.clientY };
  };

  const hearts = Array.from({ length: MAX_LIVES }, (_, i) => i < hud.lives);
  const collected = Object.entries(hud.collected).sort((a, b) => b[1] - a[1]);

  return (
    <div className="game">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="Arena luar angkasa Kucing Kosmik"
        onPointerMove={onPointer}
        onPointerDown={onPointer}
      />

      <header className="hud">
        <div className="hud-block">
          <span className="hud-label">Skor</span>
          <span className="hud-value" aria-live="polite">{hud.score}</span>
          <span className="hud-sub">Rekor {hud.best}</span>
        </div>
        <div className="hud-block hud-center">
          <span className="hearts" aria-label={`Nyawa ${hud.lives} dari ${MAX_LIVES}`}>
            {hearts.map((on, i) => (
              <span key={i} className={on ? "heart on" : "heart"}>♥</span>
            ))}
          </span>
          {hud.combo > 1 && <span className="combo">Combo x{hud.combo}</span>}
        </div>
        <div className="hud-block hud-user">
          <p className="greeting">
            Halo, <strong>{user.email}</strong>
          </p>
          <div className="hud-actions">
            {(hud.phase === "playing" || hud.phase === "paused") && (
              <button className="btn-ghost" onClick={() => controls.current?.togglePause()}>
                {hud.phase === "paused" ? "Lanjut" : "Jeda"}
              </button>
            )}
            <button className="btn-ghost" onClick={onLogout}>Keluar</button>
          </div>
        </div>
      </header>

      {hud.phase === "ready" && (
        <section className="overlay">
          <div className="panel">
            <h2>Siap terbang?</h2>
            <p>
              Bantu Kucing Kosmik mengumpulkan camilan yang melayang di luar angkasa. Gerakkan dengan mouse atau
              jari, atau pakai tombol panah / WASD. Hindari asteroid, nyawamu cuma 3.
            </p>
            <ul className="food-legend">
              {FOODS.map((f) => (
                <li key={f.emoji}>
                  <span className="food-emoji" aria-hidden="true">{f.emoji}</span>
                  <span>{f.name}</span>
                  <b>+{f.points}</b>
                </li>
              ))}
            </ul>
            <p className="hint">Tangkap beruntun untuk combo sampai x5.</p>
            <button className="btn-primary" onClick={() => controls.current?.start()} autoFocus>
              Mulai terbang
            </button>
          </div>
        </section>
      )}

      {hud.phase === "paused" && (
        <section className="overlay">
          <div className="panel">
            <h2>Jeda</h2>
            <p>Kucing Kosmik sedang ngemil sebentar.</p>
            <button className="btn-primary" onClick={() => controls.current?.togglePause()} autoFocus>
              Lanjut
            </button>
          </div>
        </section>
      )}

      {hud.phase === "over" && (
        <section className="overlay">
          <div className="panel">
            <h2>Game over</h2>
            <p className="final-score">{hud.score}</p>
            <p className="hint">{hud.newBest ? "Rekor baru!" : `Rekor kamu: ${hud.best}`}</p>
            {collected.length > 0 ? (
              <ul className="collected">
                {collected.map(([emoji, n]) => (
                  <li key={emoji}>
                    <span aria-hidden="true">{emoji}</span> ×{n}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Belum ada camilan yang tertangkap. Coba lagi!</p>
            )}
            <button className="btn-primary" onClick={() => controls.current?.start()} autoFocus>
              Main lagi
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function snapshot(g: Game): Hud {
  return {
    phase: g.phase,
    score: g.score,
    best: g.best,
    lives: g.lives,
    combo: g.combo,
    collected: { ...g.collected },
    newBest: g.newBest,
  };
}
