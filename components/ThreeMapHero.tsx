"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MousePointerClick, RotateCcw } from "lucide-react";

interface SurveyPoint {
  id: string;
  name: string;
  easting: string;
  northing: string;
  elev: string;
  lat: string;
  lon: string;
  // 3D position in scene
  x: number;
  z: number;
  elevHeight: number;
}

const SURVEY_POINTS: SurveyPoint[] = [
  {
    id: "BM-01",
    name: "Master Benchmark",
    easting: "513,556.61",
    northing: "2,787,467.85",
    elev: "+14.8m",
    lat: "25.1932° N",
    lon: "55.4678° E",
    x: -3.5,
    z: 1.5,
    elevHeight: 1.4,
  },
  {
    id: "CP-02",
    name: "Corner Monument",
    easting: "513,720.40",
    northing: "2,787,590.20",
    elev: "+26.5m",
    lat: "25.1944° N",
    lon: "55.4695° E",
    x: -1.0,
    z: -2.8,
    elevHeight: 2.2,
  },
  {
    id: "CR-03",
    name: "Ridge Crest",
    easting: "513,850.15",
    northing: "2,787,480.90",
    elev: "+38.2m",
    lat: "25.1934° N",
    lon: "55.4708° E",
    x: 3.2,
    z: -1.8,
    elevHeight: 3.1,
  },
  {
    id: "BS-04",
    name: "Traverse Station",
    easting: "513,690.80",
    northing: "2,787,350.10",
    elev: "+19.0m",
    lat: "25.1922° N",
    lon: "55.4692° E",
    x: 2.2,
    z: 2.8,
    elevHeight: 1.8,
  },
];

export default function ThreeMapHero() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 11, 15);
    camera.lookAt(0, 0, 0);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x0071e3, 1.2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const warmLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    warmLight.position.set(-10, 15, -10);
    scene.add(warmLight);

    // 4. Group for easy manual / auto rotation
    const mapGroup = new THREE.Group();
    scene.add(mapGroup);

    // 5. Procedural 3D Topographic Terrain Plane
    const terrainWidth = 14;
    const terrainHeight = 11;
    const segmentsX = 40;
    const segmentsY = 32;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, terrainHeight, segmentsX, segmentsY);
    terrainGeo.rotateX(-Math.PI / 2);

    // Sculpt natural hill contours
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      // Multi-frequency hill topography
      const dist1 = Math.sqrt((vx - 2.5) ** 2 + (vz + 1.5) ** 2);
      const hill1 = Math.max(0, 2.8 - dist1 * 0.55);

      const dist2 = Math.sqrt((vx + 2.0) ** 2 + (vz - 1.0) ** 2);
      const hill2 = Math.max(0, 1.6 - dist2 * 0.4);

      const valley = Math.sin(vx * 0.5) * Math.cos(vz * 0.5) * 0.4;
      pos.setY(i, hill1 + hill2 + valley);
    }
    terrainGeo.computeVertexNormals();

    // Map Base Material (Soft, clean architectural light map)
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.85,
      metalness: 0.1,
      wireframe: false,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    mapGroup.add(terrainMesh);

    // Wireframe Topographic Overlay (Vector look)
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(terrainGeo, wireframeMat);
    wireMesh.position.y += 0.01;
    mapGroup.add(wireMesh);

    // Contour Elevation Rings / Grid Lines
    const gridHelper = new THREE.GridHelper(15, 15, 0x0071e3, 0xe2e8f0);
    gridHelper.position.y = -0.05;
    mapGroup.add(gridHelper);

    // 6. 3D Survey Placemark Pins & Extrusions
    const pinObjects: { stalk: THREE.Mesh; head: THREE.Mesh; pos: THREE.Vector3 }[] = [];
    const pinGroup = new THREE.Group();
    mapGroup.add(pinGroup);

    // Survey boundary lines connecting the 4 stations
    const boundaryPoints: THREE.Vector3[] = [];

    SURVEY_POINTS.forEach((pt, index) => {
      // Find terrain height at this (x, z)
      const pinY = pt.elevHeight;
      const headY = pinY + 0.9;
      const pointVec = new THREE.Vector3(pt.x, headY, pt.z);
      boundaryPoints.push(pointVec);

      // Stalk (Vertical Extrusion Line)
      const stalkGeo = new THREE.CylinderGeometry(0.04, 0.04, headY, 12);
      stalkGeo.translate(0, headY / 2, 0);
      const stalkMat = new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x0071e3 : 0x64748b,
        metalness: 0.2,
      });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.set(pt.x, 0, pt.z);
      pinGroup.add(stalk);

      // 3D Placemark Head (Sphere Pin)
      const headGeo = new THREE.SphereGeometry(0.32, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: index === 0 ? 0x0071e3 : 0x0284c7,
        roughness: 0.2,
        metalness: 0.5,
      });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.copy(pointVec);
      pinGroup.add(head);

      // Base Target Ring on ground
      const ringGeo = new THREE.RingGeometry(0.2, 0.45, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x0071e3,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pt.x, 0.05, pt.z);
      pinGroup.add(ring);

      pinObjects.push({ stalk, head, pos: pointVec });
    });

    // Close the boundary loop
    boundaryPoints.push(boundaryPoints[0]);

    // Draw boundary line connecting the surveyed points
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineDashedMaterial({
      color: 0x0071e3,
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 2,
    });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    boundaryLine.computeLineDistances();
    mapGroup.add(boundaryLine);

    // 7. Mouse drag rotation interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      mapGroup.rotation.y += deltaX * 0.007;
      mapGroup.rotation.x = Math.max(-0.2, Math.min(0.8, mapGroup.rotation.x + deltaY * 0.005));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
      // Resume slow idle rotation after 4 seconds
      setTimeout(() => {
        autoRotate = true;
      }, 4000);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Touch support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        autoRotate = false;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - touchStartX;
      const deltaY = e.touches[0].clientY - touchStartY;
      mapGroup.rotation.y += deltaX * 0.008;
      mapGroup.rotation.x = Math.max(-0.2, Math.min(0.8, mapGroup.rotation.x + deltaY * 0.006));
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    domEl.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    // 8. Animation loop & 2D HUD projection
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.015;

      // Gentle auto-rotation
      if (autoRotate && !isDragging) {
        mapGroup.rotation.y += 0.003;
      }

      // Gentle pulse on active head
      pinObjects.forEach((pin, idx) => {
        if (idx === activeIdx) {
          const s = 1 + Math.sin(time * 3) * 0.12;
          pin.head.scale.set(s, s, s);
          (pin.head.material as THREE.MeshStandardMaterial).color.setHex(0x0071e3);
        } else {
          pin.head.scale.set(1, 1, 1);
          (pin.head.material as THREE.MeshStandardMaterial).color.setHex(0x0284c7);
        }
      });

      // Project the active pin position to 2D screen coordinates for tooltip
      if (pinObjects[activeIdx]) {
        const worldPos = new THREE.Vector3();
        pinObjects[activeIdx].head.getWorldPosition(worldPos);
        worldPos.y += 0.5; // Hover just above head
        worldPos.project(camera);

        const halfWidth = width / 2;
        const halfHeight = height / 2;
        const screenX = worldPos.x * halfWidth + halfWidth;
        const screenY = -(worldPos.y * halfHeight) + halfHeight;
        setTooltipPos({ x: screenX, y: screenY });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      domEl.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domEl.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      wireframeMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeIdx]);

  const activePoint = SURVEY_POINTS[activeIdx];

  return (
    <div className="relative w-full rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Viewport Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">Interactive 3D Map (Three.js)</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px] hidden sm:inline">WGS84 Ellipsoid</span>
        </div>

        {/* Station switcher tabs */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/80">
          {SURVEY_POINTS.map((pt, i) => (
            <button
              key={pt.id}
              onClick={() => setActiveIdx(i)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all ${
                activeIdx === i
                  ? "bg-[#0071e3] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {pt.id}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas Mount */}
      <div className="relative w-full h-[320px] sm:h-[360px] bg-gradient-to-b from-[#f8fafc] to-[#ffffff] cursor-grab active:cursor-grabbing">
        <div ref={mountRef} className="w-full h-full" />

        {/* Dynamic 2D Tooltip tracking 3D Placemark Head */}
        {tooltipPos && (
          <div
            className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-full transition-transform duration-75 z-10"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y - 8}px`,
            }}
          >
            <div className="bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-lg shadow-lg border border-slate-700 text-left whitespace-nowrap">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{activePoint.id} · {activePoint.name}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                {activePoint.lat}, {activePoint.lon}
              </div>
              <div className="text-[10px] font-mono text-cyan-300 font-semibold">
                Elevation: {activePoint.elev} (Extruded)
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900/95 mx-auto" />
          </div>
        )}

        {/* Drag to rotate badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/80 shadow-xs flex items-center gap-1.5 text-[11px] text-slate-600 font-medium pointer-events-none">
          <RotateCcw className="w-3 h-3 text-[#0071e3]" />
          <span>Click &amp; drag to rotate 3D map</span>
        </div>

        {/* Coords overlay badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/80 shadow-xs font-mono text-[11px] text-slate-600 pointer-events-none hidden sm:block">
          Grid: EPSG:3997 DLTM
        </div>
      </div>

      {/* Bottom Station Details Card */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-600">
          <span>
            <strong className="text-slate-800">EAST:</strong> {activePoint.easting}
          </span>
          <span>
            <strong className="text-slate-800">NORTH:</strong> {activePoint.northing}
          </span>
          <span className="text-[#0071e3] font-bold">
            ELEV: {activePoint.elev}
          </span>
        </div>
        <div className="text-emerald-700 font-semibold flex items-center gap-1">
          <span>● KML 3D Placemark Plotted</span>
        </div>
      </div>
    </div>
  );
}
