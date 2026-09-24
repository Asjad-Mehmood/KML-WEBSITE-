"use client";

import React, { useEffect, useRef, useState } from "react";

interface Point3D {
  x: number;
  y: number;
  z: number;
}

export default function Preloader() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING WGS84 ELLIPSOID");
  const [coordText, setCoordText] = useState("25° 11' 35.7\" N  55° 28' 04.2\" E");
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("kml_preloader_seen");
    const totalDuration = hasSeen ? 500 : 1400; // fast if seen in session

    const startTime = Date.now();

    // Telemetry ticker intervals
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (pct < 25) {
        setStatusText("INITIALIZING WGS84 ELLIPSOID");
        setCoordText("25° 11' 35.7\" N  55° 28' 04.2\" E");
      } else if (pct < 55) {
        setStatusText("LOCKING 6,864 EPSG GRIDS // DUBAI DLTM, OSGB36, NAD83");
        setCoordText("51° 30' 26.1\" N  00° 07' 39.9\" W");
      } else if (pct < 85) {
        setStatusText("CALIBRATING HELMERT 2D SITE TIERS");
        setCoordText("40° 42' 46.1\" N  74° 00' 21.6\" W");
      } else {
        setStatusText("GEOSPATIAL ENGINE READY");
        setCoordText("GLOBAL DATUM SYNCHRONIZED");
      }

      if (pct >= 100) {
        clearInterval(progressTimer);
        sessionStorage.setItem("kml_preloader_seen", "true");
        setFadingOut(true);
        setTimeout(() => {
          setVisible(false);
        }, 650);
      }
    }, 20);

    return () => clearInterval(progressTimer);
  }, []);

  // 3D Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angleY = 0;
    let angleX = 0.25;

    // Build 3D sphere points (meridians and parallels)
    const radius = 80;
    const parallels = 7; // latitudinal rings
    const meridians = 12; // longitudinal rings

    const resize = () => {
      if (!canvas) return;
      canvas.width = 320;
      canvas.height = 320;
    };
    resize();

    // Satellite orbits definition
    const satellites = [
      { radius: 110, tiltX: 0.6, tiltZ: 0.3, speed: 0.04, angle: 0, color: "#38bdf8" },
      { radius: 120, tiltX: -0.5, tiltZ: 0.8, speed: -0.03, angle: 2.1, color: "#60a5fa" },
      { radius: 105, tiltX: 1.1, tiltZ: -0.4, speed: 0.05, angle: 4.2, color: "#34d399" },
    ];

    // Key surveyor benchmark pins on sphere surface (lat, lon in radians)
    const benchmarkPins = [
      { lat: 0.44, lon: 0.96, label: "BM-01 (Dubai)" },
      { lat: 0.90, lon: -0.02, label: "BM-02 (London)" },
      { lat: 0.71, lon: -1.29, label: "BM-03 (NYC)" },
      { lat: -0.59, lon: 2.63, label: "BM-04 (Sydney)" },
    ];

    const rotatePoint = (p: Point3D, ay: number, ax: number): Point3D => {
      // Rotate around Y
      const cosY = Math.cos(ay);
      const sinY = Math.sin(ay);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotate around X
      const cosX = Math.cos(ax);
      const sinX = Math.sin(ax);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      return { x: x1, y: y2, z: z2 };
    };

    const project = (p: Point3D, cx: number, cy: number) => {
      const fov = 350;
      const scale = fov / (fov + p.z + 100);
      return {
        x: cx + p.x * scale,
        y: cy + p.y * scale,
        scale,
        depth: p.z,
      };
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angleY += 0.018;

      // 1. Draw Hologram Core Ambient Glow
      const glowGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, radius * 1.4);
      glowGrad.addColorStop(0, "rgba(59, 130, 246, 0.15)");
      glowGrad.addColorStop(0.6, "rgba(14, 165, 233, 0.05)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Sphere Latitude Parallels
      for (let i = 1; i < parallels; i++) {
        const phi = (Math.PI / parallels) * i - Math.PI / 2;
        const r = radius * Math.cos(phi);
        const y = radius * Math.sin(phi);

        ctx.beginPath();
        const segments = 36;
        for (let j = 0; j <= segments; j++) {
          const theta = (Math.PI * 2 / segments) * j;
          const rawP: Point3D = { x: r * Math.cos(theta), y, z: r * Math.sin(theta) };
          const rot = rotatePoint(rawP, angleY, angleX);
          const proj = project(rot, cx, cy);

          // Alpha fade for points on back of globe
          const alpha = rot.z < 0 ? 0.35 : 0.08;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = rot.z < 0 ? 1.2 : 0.7;

          if (j === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }

      // 3. Draw Sphere Longitude Meridians
      for (let i = 0; i < meridians; i++) {
        const lambda = (Math.PI / meridians) * i;
        ctx.beginPath();
        const segments = 40;
        for (let j = 0; j <= segments; j++) {
          const phi = (Math.PI * 2 / segments) * j;
          const rawP: Point3D = {
            x: radius * Math.cos(phi) * Math.cos(lambda),
            y: radius * Math.sin(phi),
            z: radius * Math.cos(phi) * Math.sin(lambda),
          };
          const rot = rotatePoint(rawP, angleY, angleX);
          const proj = project(rot, cx, cy);

          const alpha = rot.z < 0 ? 0.35 : 0.08;
          ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
          ctx.lineWidth = rot.z < 0 ? 1.1 : 0.6;

          if (j === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
      }

      // 4. Draw Orbit Rings & Satellites
      satellites.forEach((sat) => {
        sat.angle += sat.speed;

        // Draw elliptical orbit path
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);

        const orbitPoints = 48;
        for (let i = 0; i <= orbitPoints; i++) {
          const a = (Math.PI * 2 / orbitPoints) * i;
          let p: Point3D = {
            x: sat.radius * Math.cos(a),
            y: sat.radius * Math.sin(a) * Math.sin(sat.tiltX),
            z: sat.radius * Math.sin(a) * Math.cos(sat.tiltX),
          };
          // Tilt Z
          const cosZ = Math.cos(sat.tiltZ);
          const sinZ = Math.sin(sat.tiltZ);
          const tx = p.x * cosZ - p.y * sinZ;
          const ty = p.x * sinZ + p.y * cosZ;
          p = { x: tx, y: ty, z: p.z };

          const rot = rotatePoint(p, angleY * 0.4, angleX);
          const proj = project(rot, cx, cy);

          if (i === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();
        ctx.restore();

        // Calculate satellite position
        let satP: Point3D = {
          x: sat.radius * Math.cos(sat.angle),
          y: sat.radius * Math.sin(sat.angle) * Math.sin(sat.tiltX),
          z: sat.radius * Math.sin(sat.angle) * Math.cos(sat.tiltX),
        };
        const cosZ = Math.cos(sat.tiltZ);
        const sinZ = Math.sin(sat.tiltZ);
        satP = {
          x: satP.x * cosZ - satP.y * sinZ,
          y: satP.x * sinZ + satP.y * cosZ,
          z: satP.z,
        };
        const rotSat = rotatePoint(satP, angleY * 0.4, angleX);
        const projSat = project(rotSat, cx, cy);

        // Draw Satellite Beacon Dot
        ctx.save();
        ctx.fillStyle = sat.color;
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(projSat.x, projSat.y, 3 * projSat.scale, 0, Math.PI * 2);
        ctx.fill();

        // Draw laser tie to globe center if on front hemisphere
        if (rotSat.z < 0) {
          ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(projSat.x, projSat.y);
          ctx.lineTo(cx, cy);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 5. Draw Benchmark Target Pins
      benchmarkPins.forEach((pin) => {
        const rawP: Point3D = {
          x: radius * Math.cos(pin.lat) * Math.cos(pin.lon),
          y: radius * Math.sin(pin.lat),
          z: radius * Math.cos(pin.lat) * Math.sin(pin.lon),
        };
        const rot = rotatePoint(rawP, angleY, angleX);
        const proj = project(rot, cx, cy);

        // Only draw when front-facing (z < 0)
        if (rot.z < 0) {
          ctx.save();
          // Outer ping ring
          ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 5 * proj.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Center solid point
          ctx.fillStyle = "#38bdf8";
          ctx.shadowColor = "#38bdf8";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 2.5 * proj.scale, 0, Math.PI * 2);
          ctx.fill();

          // Mini elevation pillar
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(proj.x, proj.y);
          ctx.lineTo(proj.x, proj.y - 10 * proj.scale);
          ctx.stroke();
          ctx.restore();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFadingOut(true);
        setTimeout(() => setVisible(false), 300);
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090e] text-slate-100 select-none cursor-pointer transition-all duration-700 ease-out ${
        fadingOut ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-hidden="true"
    >
      {/* Background Holographic Gridlines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#07090e]/60 to-[#07090e] pointer-events-none" />

      {/* Main 3D Canvas Stage */}
      <div className="relative flex flex-col items-center">
        {/* Canvas for 3D Rotating Wireframe Earth */}
        <div className="relative w-[320px] h-[320px] flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-[320px] h-[320px] block"
            style={{ width: "320px", height: "320px" }}
          />

          {/* Central Target Reticle */}
          <div className="absolute w-8 h-8 rounded-full border border-sky-400/40 flex items-center justify-center pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          </div>
        </div>

        {/* Brand & Telemetry Header */}
        <div className="text-center mt-1 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-black tracking-tight text-white font-sans">
              EXCEL<span className="text-sky-400">→</span>KML
            </span>
            <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 bg-sky-500/10 border border-sky-400/25 px-1.5 py-0.5 rounded">
              PRO
            </span>
          </div>
          <div className="text-[11px] font-mono text-sky-300/80 tracking-wider">
            {coordText}
          </div>
        </div>

        {/* Progress Bar & Telemetry Status */}
        <div className="w-64 sm:w-72 mt-5 space-y-2">
          {/* Progress track */}
          <div className="w-full h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-emerald-400 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span className="truncate text-slate-400 max-w-[200px]">{statusText}</span>
            <span className="font-bold text-sky-400 shrink-0">{progress}%</span>
          </div>
        </div>

        {/* Skip hint */}
        <p className="text-[10px] font-mono text-slate-600 tracking-wider mt-4">
          CLICK ANYWHERE TO SKIP
        </p>
      </div>
    </div>
  );
}
