import { useEffect, useRef, useState } from 'react';
import type { Person } from '../logic/types';

// Strip view: wheel centre is off-screen below the canvas.
// Only the top arc of the wheel is visible — like the top of a roulette wheel.
const CW = 700;          // canvas width
const CH = 400;          // canvas height
const R  = 1200;         // wheel radius (large → flat, more segments visible)
const WX = CW / 2;       // wheel centre x
const WY = R + 16;       // wheel centre y (off-screen; rim appears at y ≈ 16)
const RIM_Y = WY - R;    // y-coordinate of the outer rim on canvas (= 16)
const TEXT_R = R - 192;  // radial distance at which labels are drawn (centres text in visible strip)
const FADE = 130;        // left/right gradient fade width in px

function easeOut(t: number): number {
  // 25% of time: constant speed; 75%: power-5 ease-out for a long slow-down tail
  // frac=0.625 chosen so velocity is continuous at the boundary
  const split = 0.25;
  const frac  = 0.625;
  if (t < split) {
    return frac * (t / split);
  }
  const s = (t - split) / (1 - split);
  return frac + (1 - frac) * (1 - Math.pow(1 - s, 5));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Angular distance of `angle` from the top of the wheel (−π/2), in [0, π]. */
function distFromTop(angle: number): number {
  const d = ((angle + Math.PI / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  segs: Person[],
  rotation: number,
  winnerIdx: number,
  highlight: boolean,
) {
  const n = segs.length;
  const segAngle = (2 * Math.PI) / n;
  // Font scales with arc cell width at the rim; clamped for legibility
  const fontSize = Math.max(14, Math.min(32, Math.floor(R * segAngle * 0.40)));

  ctx.clearRect(0, 0, CW, CH);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CW, CH);

  // ── Segments ──────────────────────────────────────────────────────────────
  const strokeW = n > 80 ? 0.6 : 1.5;
  for (let i = 0; i < n; i++) {
    const a0 = rotation + i * segAngle;
    const a1 = a0 + segAngle;
    const isW = highlight && i === winnerIdx;

    ctx.beginPath();
    ctx.moveTo(WX, WY);
    ctx.arc(WX, WY, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = isW ? '#166534' : i % 2 === 0 ? '#1d4ed8' : '#1e3a8a';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = strokeW;
    ctx.stroke();
  }

  // ── Winner glow overlay ────────────────────────────────────────────────────
  if (highlight && winnerIdx >= 0) {
    ctx.save();
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 28;
    const a0 = rotation + winnerIdx * segAngle;
    ctx.beginPath();
    ctx.moveTo(WX, WY);
    ctx.arc(WX, WY, R, a0, a0 + segAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(34,197,94,0.12)';
    ctx.fill();
    ctx.restore();
  }

  // ── ID labels ─────────────────────────────────────────────────────────────
  // Text is placed at (TEXT_R from centre) and rotated tangentially so labels
  // curve naturally with the wheel. Near the pointer they are nearly horizontal.
  for (let i = 0; i < n; i++) {
    const mid = rotation + i * segAngle + segAngle / 2;
    if (distFromTop(mid) > Math.PI / 2) continue; // outside ±90° of top

    const tx = WX + TEXT_R * Math.cos(mid);
    const ty = WY + TEXT_R * Math.sin(mid);
    if (tx < -30 || tx > CW + 30 || ty > CH + 10) continue; // off-canvas

    const isW = highlight && i === winnerIdx;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid + Math.PI); // radial → text runs vertically (rim → centre)
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isW ? '#bbf7d0' : '#e2e8f0';
    const maxNameW = CH - RIM_Y - 40;
    const displayName = segs[i].name.replace(/\s*\(.*?\)\s*/g, '').trim();
    ctx.fillText(displayName, 0, 0, maxNameW);
    ctx.restore();
  }

  // ── Edge gradient fades ────────────────────────────────────────────────────
  const lg = ctx.createLinearGradient(0, 0, FADE, 0);
  lg.addColorStop(0, 'rgba(15,23,42,1)');
  lg.addColorStop(1, 'rgba(15,23,42,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, FADE, CH);

  const rg = ctx.createLinearGradient(CW - FADE, 0, CW, 0);
  rg.addColorStop(0, 'rgba(15,23,42,0)');
  rg.addColorStop(1, 'rgba(15,23,42,1)');
  ctx.fillStyle = rg;
  ctx.fillRect(CW - FADE, 0, FADE, CH);

  // ── Rim border ─────────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(0, RIM_Y);
  ctx.lineTo(CW, RIM_Y);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Centre selection line ──────────────────────────────────────────────────
  ctx.beginPath();
  ctx.moveTo(WX, RIM_Y);
  ctx.lineTo(WX, CH);
  ctx.strokeStyle = 'rgba(248,113,113,0.18)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Pointer (red triangle at top, pointing downward into the wheel) ────────
  ctx.beginPath();
  ctx.moveTo(WX,      RIM_Y + 6);  // tip — inside the wheel
  ctx.lineTo(WX - 16, RIM_Y - 14); // top-left (above rim)
  ctx.lineTo(WX + 16, RIM_Y - 14); // top-right
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();
}

interface DrawWheelProps {
  candidates: Person[];
  drawTrigger: number;
  onComplete: (winner: Person) => void;
}

export default function DrawWheel({ candidates, drawTrigger, onComplete }: DrawWheelProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number | null>(null);
  const rotRef      = useRef(0);
  const isAnimRef   = useRef(false);
  const prevTrigRef = useRef(0);

  const [displaySegs, setDisplaySegs]     = useState<Person[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Person | null>(null);

  // Redraw static wheel when displaySegs change (not during animation)
  useEffect(() => {
    if (isAnimRef.current || displaySegs.length === 0) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawFrame(ctx, displaySegs, rotRef.current, -1, false);
  }, [displaySegs]);

  // Build initial preview from all candidates (only before first draw)
  useEffect(() => {
    if (isAnimRef.current || candidates.length === 0 || prevTrigRef.current > 0) return;
    setDisplaySegs(shuffle([...candidates]));
    setCurrentWinner(null);
  }, [candidates]);

  // Spin when drawTrigger increments
  useEffect(() => {
    if (drawTrigger === 0 || drawTrigger === prevTrigRef.current || candidates.length === 0) return;
    prevTrigRef.current = drawTrigger;

    if (animRef.current) cancelAnimationFrame(animRef.current);
    isAnimRef.current = true;
    setCurrentWinner(null);

    const winner    = candidates[Math.floor(Math.random() * candidates.length)];
    const segs      = shuffle([...candidates]);
    const winnerIdx = segs.findIndex((p) => p.registrantId === winner.registrantId);

    const n         = segs.length;
    const segAngle  = (2 * Math.PI) / n;
    const baseAngle = -Math.PI / 2 - (winnerIdx * segAngle + segAngle / 2);
    const norm      = ((baseAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const totalSpin = 2 * 2 * Math.PI + norm;

    const startRot  = rotRef.current;
    const duration  = 9000;
    const startTime = performance.now();

    function animate(now: number) {
      const t   = Math.min((now - startTime) / duration, 1);
      const rot = startRot + totalSpin * easeOut(t);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawFrame(ctx, segs, rot, winnerIdx, t === 1);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        rotRef.current = startRot + totalSpin;
        isAnimRef.current = false;
        setDisplaySegs(segs);
        setCurrentWinner(winner);
        onComplete(winner);
      }
    }

    animRef.current = requestAnimationFrame(animate);
  }, [drawTrigger, candidates, onComplete]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  if (candidates.length === 0) {
    return (
      <div
        className="flex items-center justify-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-sm"
        style={{ width: CW, height: CH, maxWidth: '100%' }}
      >
        No eligible candidates
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full rounded-xl overflow-hidden"
        style={{ maxWidth: CW }}
      />
      {currentWinner && (
        <div className="animate-winner-pop w-full max-w-sm px-6 py-4 rounded-2xl border-2 border-green-500 bg-green-950/50 text-center">
          <div className="text-4xl font-black text-green-300">{currentWinner.name}</div>
          <div className="text-sm text-green-600 mt-1">#{currentWinner.registrantId}</div>
          <div className="text-green-500 text-xs mt-2 uppercase tracking-widest font-semibold">Winner</div>
        </div>
      )}
    </div>
  );
}
