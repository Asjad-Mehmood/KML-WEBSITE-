"use client";

// The radar display beside the converter: a sweep and a blip where the point is.
import { useEffect, useRef } from "react";

/* ─── Radar Display Canvas ─── */
export function RadarCanvas({ blipX, blipY }: { blipX: number; blipY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const frameRef = useRef(0);
  const blipRef = useRef({ x: blipX, y: blipY });

  useEffect(() => {
    blipRef.current = { x: blipX, y: blipY };
  }, [blipX, blipY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(cx, cy) * 0.88;

      ctx.clearRect(0, 0, w, h);

      // Radial background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 1.4);
      bgGrad.addColorStop(0, "rgba(3, 17, 35, 0.97)");
      bgGrad.addColorStop(1, "rgba(1, 5, 12, 1)");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle Grid
      ctx.strokeStyle = "rgba(0, 180, 255, 0.04)";
      ctx.lineWidth = 0.5;
      for (let i = 1; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 8) * i);
        ctx.lineTo(w, (h / 8) * i);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((w / 8) * i, 0);
        ctx.lineTo((w / 8) * i, h);
        ctx.stroke();
      }

      // Rings
      for (const frac of [0.25, 0.5, 0.75, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 180, 255, ${frac === 1 ? 0.15 : 0.07})`;
        ctx.lineWidth = frac === 1 ? 1 : 0.6;
        ctx.stroke();
      }

      // Sweep Beam
      const sweep = angleRef.current;
      const trail = Math.PI * 0.3;
      for (let i = 0; i < 30; i++) {
        const f = i / 30;
        const a2 = sweep - trail * f;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, a2 - 0.025, a2 + 0.025);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 200, 255, ${0.15 * (1 - f)})`;
        ctx.fill();
      }

      // Leading line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.strokeStyle = "rgba(0, 220, 255, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Blip
      const bx = cx + blipRef.current.x * maxR * 0.7;
      const by = cy - blipRef.current.y * maxR * 0.7;
      const blipAngle = Math.atan2(-blipRef.current.y, blipRef.current.x);
      const angleDiff = ((sweep - blipAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      let alpha = angleDiff < Math.PI * 0.5 ? 1 - angleDiff / (Math.PI * 0.5) : 0;
      alpha = Math.max(alpha, 0.15 + 0.08 * Math.sin(Date.now() / 400));

      const glow = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
      glow.addColorStop(0, `rgba(0, 255, 180, ${alpha * 0.6})`);
      glow.addColorStop(1, "rgba(0, 255, 180, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(bx, by, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bx, by, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 180, ${alpha})`;
      ctx.fill();

      // Cardinal labels
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "rgba(0, 180, 255, 0.25)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("N", cx, cy - maxR - 8);
      ctx.fillText("S", cx, cy + maxR + 8);
      ctx.fillText("E", cx + maxR + 8, cy);
      ctx.fillText("W", cx - maxR - 8, cy);

      angleRef.current += 0.018;
      if (angleRef.current > Math.PI * 2) angleRef.current -= Math.PI * 2;
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-xl" />;
}
