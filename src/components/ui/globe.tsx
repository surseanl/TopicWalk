"use client";

import * as d3 from "d3";
import type { GeoJsonProperties } from "geojson";
import { useEffect, useRef, useState } from "react";
import {
  bearing,
  bearingArrow,
  formatDistance,
  haversineDistance,
} from "~/lib/geo";
import { cn } from "~/lib/utils";

type LandmarkItem = {
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  emoji: string;
};

interface GlobeProps {
  landmarks: readonly LandmarkItem[];
  userPos?: { lat: number; lng: number } | null;
  className?: string;
}

type Feature = d3.ExtendedFeature<d3.GeoGeometryObjects, GeoJsonProperties>;
type IconType =
  | "tower"
  | "mountain"
  | "flat"
  | "dome"
  | "cross"
  | "arch"
  | "star"
  | "drops"
  | "columns";

const LANDMARK_TYPES: Record<string, IconType> = {
  "Eiffel Tower": "tower",
  "Tokyo Tower": "tower",
  "Big Ben": "tower",
  "Burj Khalifa": "tower",
  "Sagrada Família": "tower",
  "Machu Picchu": "mountain",
  "Grand Canyon": "mountain",
  "Table Mountain": "flat",
  "Taj Mahal": "dome",
  "Christ the Redeemer": "cross",
  "Sydney Opera House": "arch",
  "Golden Gate Bridge": "arch",
  "Colosseum": "arch",
  "Times Square": "star",
  "Statue of Liberty": "star",
  "Brandenburg Gate": "columns",
  "Angkor Wat": "columns",
  "Acropolis": "columns",
  "Forbidden City": "columns",
  "Niagara Falls": "drops",
};

const RENDER_SIZE = 400;
const LAND_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json";
const COUNTRIES_URL =
  "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/cultural/ne_110m_admin_0_countries.json";

// ── simple solid canvas icons ─────────────────────────────────────────────────

function drawIcon(
  ctx: CanvasRenderingContext2D,
  name: string,
  px: number,
  py: number,
  r: number,
) {
  const s = r * 0.6;
  ctx.save();
  ctx.fillStyle = "#fff";
  const type = LANDMARK_TYPES[name] ?? "star";

  switch (type) {
    case "tower": {
      // Narrow upward triangle — towers & spires
      ctx.beginPath();
      ctx.moveTo(px, py - s);
      ctx.lineTo(px + s * 0.42, py + s * 0.55);
      ctx.lineTo(px - s * 0.42, py + s * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "mountain": {
      // Wider triangle — mountains / canyons
      ctx.beginPath();
      ctx.moveTo(px, py - s * 0.85);
      ctx.lineTo(px + s * 0.85, py + s * 0.55);
      ctx.lineTo(px - s * 0.85, py + s * 0.55);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "flat": {
      // Flat-top trapezoid — Table Mountain
      ctx.beginPath();
      ctx.moveTo(px - s * 0.42, py - s * 0.4);
      ctx.lineTo(px + s * 0.42, py - s * 0.4);
      ctx.lineTo(px + s * 0.82, py + s * 0.5);
      ctx.lineTo(px - s * 0.82, py + s * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "dome": {
      // Filled semicircle on a base — Taj Mahal
      ctx.beginPath();
      ctx.arc(px, py + s * 0.05, s * 0.65, Math.PI, 0);
      ctx.lineTo(px + s * 0.65, py + s * 0.65);
      ctx.lineTo(px - s * 0.65, py + s * 0.65);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "cross": {
      // Latin cross — Christ the Redeemer
      const a = s * 0.22;
      ctx.beginPath();
      ctx.rect(px - a, py - s, a * 2, s * 1.8);
      ctx.fill();
      ctx.beginPath();
      ctx.rect(px - s * 0.6, py - s * 0.3, s * 1.2, a * 2);
      ctx.fill();
      break;
    }
    case "arch": {
      // Filled arch (half-disc + legs) — Golden Gate, Colosseum, Sydney Opera House
      ctx.beginPath();
      ctx.arc(px, py + s * 0.05, s * 0.72, Math.PI, 0);
      ctx.lineTo(px + s * 0.72, py + s * 0.65);
      ctx.lineTo(px - s * 0.72, py + s * 0.65);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "star": {
      // 5-pointed star — Times Square, Statue of Liberty
      const ro = s * 0.85;
      const ri = s * 0.38;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? ro : ri;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0)
          ctx.moveTo(px + rad * Math.cos(angle), py + rad * Math.sin(angle));
        else ctx.lineTo(px + rad * Math.cos(angle), py + rad * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "drops": {
      // Three teardrops pointing down — Niagara Falls
      for (let i = -1; i <= 1; i++) {
        const ox = px + i * s * 0.36;
        ctx.beginPath();
        ctx.arc(ox, py - s * 0.1, s * 0.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ox - s * 0.16, py - s * 0.1);
        ctx.quadraticCurveTo(ox - s * 0.28, py + s * 0.4, ox, py + s * 0.65);
        ctx.quadraticCurveTo(ox + s * 0.28, py + s * 0.4, ox + s * 0.16, py - s * 0.1);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "columns": {
      // Three columns with entablature — Acropolis, Brandenburg Gate, Colosseum…
      // Top beam
      ctx.beginPath();
      ctx.rect(px - s * 0.82, py - s * 0.6, s * 1.64, s * 0.2);
      ctx.fill();
      // Three shafts
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.rect(px + i * s * 0.5 - s * 0.13, py - s * 0.42, s * 0.26, s * 0.95);
        ctx.fill();
      }
      // Base step
      ctx.beginPath();
      ctx.rect(px - s * 0.82, py + s * 0.5, s * 1.64, s * 0.18);
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// ── Globe component ───────────────────────────────────────────────────────────

export default function Globe({ landmarks, userPos, className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef<LandmarkItem | null>(null);
  const hoveredRef = useRef<LandmarkItem | null>(null);
  const [selected, setSelected] = useState<LandmarkItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawCanvas = canvasRef.current;
    if (!rawCanvas) return;
    const rawCtx = rawCanvas.getContext("2d");
    if (!rawCtx) return;

    // Explicitly typed as non-null so closures see them without null
    const canvas: HTMLCanvasElement = rawCanvas;
    const ctx: CanvasRenderingContext2D = rawCtx;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = RENDER_SIZE * dpr;
    canvas.height = RENDER_SIZE * dpr;
    ctx.scale(dpr, dpr);

    const BASE_RADIUS = RENDER_SIZE / 2 - 10;
    const cx = RENDER_SIZE / 2;
    const cy = RENDER_SIZE / 2;

    const projection = d3
      .geoOrthographic()
      .scale(BASE_RADIUS)
      .translate([cx, cy])
      .clipAngle(90);

    const pathGen = d3.geoPath().projection(projection).context(ctx);

    const rotation: [number, number, number] = [0, -25, 0];
    let autoRotate = true;
    let landFeatures: Feature[] = [];
    let countryFeatures: Feature[] = [];
    const dots: Array<[number, number]> = [];

    function isVisible(lng: number, lat: number): boolean {
      const center = projection.invert?.([cx, cy]);
      if (!center) return false;
      return (
        d3.geoDistance([lng, lat], center as [number, number]) < Math.PI / 2
      );
    }

    function toCanvas(e: MouseEvent | Touch): [number, number] {
      const rect = canvas.getBoundingClientRect();
      return [
        ((e.clientX - rect.left) * RENDER_SIZE) / rect.width,
        ((e.clientY - rect.top) * RENDER_SIZE) / rect.height,
      ];
    }

    function nearestLandmark(
      mx: number,
      my: number,
      threshold = 28,
    ): LandmarkItem | null {
      let nearest: LandmarkItem | null = null;
      let minD = threshold;
      for (const lm of landmarks) {
        if (!isVisible(lm.lng, lm.lat)) continue;
        const proj = projection([lm.lng, lm.lat]);
        if (!proj) continue;
        const d = Math.hypot(proj[0] - mx, proj[1] - my);
        if (d < minD) {
          minD = d;
          nearest = lm;
        }
      }
      return nearest;
    }

    function selectLandmark(lm: LandmarkItem | null) {
      selectedRef.current = lm;
      setSelected(lm);
    }

    function draw() {
      const scale = projection.scale();
      ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);

      // ── Ocean (solid, no transparency) ─────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, 2 * Math.PI);
      ctx.fillStyle = "#071220";
      ctx.fill();

      // ── Country fills (land mass) ───────────────────────────────────────────
      if (countryFeatures.length > 0) {
        ctx.beginPath();
        for (const feat of countryFeatures) pathGen(feat);
        ctx.fillStyle = "#0d2035";
        ctx.fill();

        // Country borders
        for (const feat of countryFeatures) {
          ctx.beginPath();
          pathGen(feat);
          ctx.strokeStyle = "rgba(60,140,200,0.5)";
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      } else if (landFeatures.length > 0) {
        // Fallback: plain land outlines if countries didn't load
        ctx.beginPath();
        for (const feat of landFeatures) pathGen(feat);
        ctx.fillStyle = "#0d2035";
        ctx.fill();
      }

      // ── Graticule ──────────────────────────────────────────────────────────
      ctx.beginPath();
      pathGen(d3.geoGraticule()());
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 0.4;
      ctx.stroke();

      // ── Land dots (texture) ────────────────────────────────────────────────
      ctx.fillStyle = "#2060808a";
      for (const [lng, lat] of dots) {
        const proj = projection([lng, lat]);
        if (!proj) continue;
        ctx.beginPath();
        ctx.arc(proj[0], proj[1], 0.75, 0, 2 * Math.PI);
        ctx.fill();
      }

      // ── Country name labels ───────────────────────────────────────────────
      if (countryFeatures.length > 0) {
        const center = projection.invert?.([cx, cy]);
        if (center) {
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
          for (const feat of countryFeatures) {
            const props = feat.properties as {
              NAME?: string;
              ISO_A3?: string;
            } | null;
            const fullName = props?.NAME ?? "";
            if (!fullName) continue;
            const label =
              fullName.length <= 11
                ? fullName
                : (props?.ISO_A3 ?? fullName.slice(0, 10));
            const centroid = d3.geoCentroid(feat);
            if (
              d3.geoDistance(centroid, center as [number, number]) >=
              Math.PI / 2 - 0.08
            )
              continue;
            const boundsGeo = d3.geoBounds(feat);
            const pL = projection([boundsGeo[0][0], centroid[1]]);
            const pR = projection([boundsGeo[1][0], centroid[1]]);
            if (!pL || !pR) continue;
            if (Math.abs(pR[0] - pL[0]) < 22) continue;
            const p = projection(centroid);
            if (!p) continue;
            ctx.fillStyle = "rgba(0,0,0,0.55)";
            ctx.fillText(label, p[0] + 0.6, p[1] + 0.6);
            ctx.fillStyle = "rgba(255,255,255,0.65)";
            ctx.fillText(label, p[0], p[1]);
          }
          ctx.restore();
        }
      }

      // ── Landmark markers ───────────────────────────────────────────────────
      const sel = selectedRef.current;
      const hov = hoveredRef.current;

      for (const lm of landmarks) {
        if (!isVisible(lm.lng, lm.lat)) continue;
        const proj = projection([lm.lng, lm.lat]);
        if (!proj) continue;
        const [px, py] = proj;

        const isSel = sel?.name === lm.name;
        const isHov = hov?.name === lm.name;
        const r = isSel ? 13 : isHov ? 11 : 8;

        // Glow ring
        const grd = ctx.createRadialGradient(px, py, 0, px, py, r + 8);
        grd.addColorStop(
          0,
          isSel ? "rgba(251,191,36,0.65)" : "rgba(251,191,36,0.2)",
        );
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(px, py, r + 8, 0, 2 * Math.PI);
        ctx.fillStyle = grd;
        ctx.fill();

        // Gold circle
        ctx.beginPath();
        ctx.arc(px, py, r, 0, 2 * Math.PI);
        ctx.fillStyle = isSel ? "#fbbf24" : isHov ? "#fcd34d" : "#d97706";
        ctx.fill();

        // White icon inside the circle
        drawIcon(ctx, lm.name, px, py, r);
      }

      // ── Specular highlight (3-D sheen, no transparency at edge) ───────────
      const spec = ctx.createRadialGradient(
        cx - scale * 0.32,
        cy - scale * 0.32,
        0,
        cx - scale * 0.15,
        cy - scale * 0.15,
        scale * 0.55,
      );
      spec.addColorStop(0, "rgba(255,255,255,0.06)");
      spec.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, 2 * Math.PI);
      ctx.fillStyle = spec;
      ctx.fill();

      // ── Globe rim ──────────────────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, scale, 0, 2 * Math.PI);
      ctx.strokeStyle = "#1e4a7a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Load GeoJSON data in parallel ─────────────────────────────────────────

    let alive = true;
    (async () => {
      try {
        const [landRes, countriesRes] = await Promise.all([
          fetch(LAND_URL),
          fetch(COUNTRIES_URL),
        ]);

        if (!alive) return;

        if (landRes.ok) {
          const geo = (await landRes.json()) as { features: Feature[] };
          landFeatures = geo.features;
          for (const feat of landFeatures) {
            const bounds = d3.geoBounds(feat);
            const [[minLng, minLat], [maxLng, maxLat]] = bounds;
            for (let lng = minLng; lng <= maxLng; lng += 1.4) {
              for (let lat = minLat; lat <= maxLat; lat += 1.4) {
                if (d3.geoContains(feat, [lng, lat])) {
                  dots.push([lng, lat]);
                }
              }
            }
          }
        }

        if (countriesRes.ok) {
          const geo = (await countriesRes.json()) as { features: Feature[] };
          countryFeatures = geo.features;
        }
      } catch {
        // proceed without land/country data — globe still renders with landmarks
      }

      if (alive) {
        setLoading(false);
        draw();
      }
    })();

    // ── Auto-rotation ─────────────────────────────────────────────────────────

    projection.rotate(rotation);
    const timer = d3.timer(() => {
      if (!autoRotate) return;
      rotation[0] += 0.22;
      projection.rotate(rotation);
      draw();
    });

    // ── Mouse interactions ────────────────────────────────────────────────────

    let resumeTimeout: ReturnType<typeof setTimeout>;

    const onMouseDown = (e: MouseEvent) => {
      autoRotate = false;
      clearTimeout(resumeTimeout);
      const sx = e.clientX;
      const sy = e.clientY;
      const sr: [number, number, number] = [rotation[0], rotation[1], rotation[2]];
      const onMove = (me: MouseEvent) => {
        rotation[0] = sr[0] + (me.clientX - sx) * 0.35;
        rotation[1] = Math.max(-80, Math.min(80, sr[1] - (me.clientY - sy) * 0.35));
        projection.rotate(rotation);
        draw();
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        resumeTimeout = setTimeout(() => { autoRotate = true; }, 2500);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = e.deltaY > 0 ? 0.92 : 1.09;
      projection.scale(
        Math.max(BASE_RADIUS * 0.55, Math.min(BASE_RADIUS * 3.5, projection.scale() * f)),
      );
      draw();
    };

    const onMouseMove = (e: MouseEvent) => {
      const [mx, my] = toCanvas(e);
      const lm = nearestLandmark(mx, my);
      if (hoveredRef.current?.name !== lm?.name) {
        hoveredRef.current = lm;
        canvas.style.cursor = lm ? "pointer" : "grab";
        draw();
      }
    };

    const onClick = (e: MouseEvent) => {
      const [mx, my] = toCanvas(e);
      const lm = nearestLandmark(mx, my);
      selectLandmark(lm);
      draw();
    };

    // ── Touch interactions ────────────────────────────────────────────────────

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      autoRotate = false;
      clearTimeout(resumeTimeout);
      const t0 = e.touches[0];
      if (!t0) return;
      const sx = t0.clientX;
      const sy = t0.clientY;
      const sr: [number, number, number] = [rotation[0], rotation[1], rotation[2]];
      let moved = false;

      const onTouchMove = (me: TouchEvent) => {
        const t = me.touches[0];
        if (!t) return;
        moved = true;
        rotation[0] = sr[0] + (t.clientX - sx) * 0.35;
        rotation[1] = Math.max(-80, Math.min(80, sr[1] - (t.clientY - sy) * 0.35));
        projection.rotate(rotation);
        draw();
      };

      const onTouchEnd = (me: TouchEvent) => {
        canvas.removeEventListener("touchmove", onTouchMove);
        canvas.removeEventListener("touchend", onTouchEnd);
        if (!moved) {
          const ct = me.changedTouches[0];
          if (ct) {
            const [mx, my] = toCanvas(ct);
            const lm = nearestLandmark(mx, my, 36);
            if (lm) { selectLandmark(lm); draw(); }
          }
        }
        resumeTimeout = setTimeout(() => { autoRotate = true; }, 2500);
      };

      canvas.addEventListener("touchmove", onTouchMove, { passive: false });
      canvas.addEventListener("touchend", onTouchEnd);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.style.cursor = "grab";

    return () => {
      alive = false;
      timer.stop();
      clearTimeout(resumeTimeout);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
    };
  }, [landmarks]);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative w-full" style={{ aspectRatio: "1 / 1" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#071220]">
            <p className="text-xs text-slate-400 animate-pulse">
              Loading globe…
            </p>
          </div>
        )}
        <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 bg-[#071220]/80 px-2 py-0.5 rounded-md pointer-events-none">
          Drag · Scroll to zoom · Tap pin
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border bg-card p-3 animate-scale-in">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">{selected.emoji}</span>
              <div>
                <p className="font-bold text-sm">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selected.city}, {selected.country}
                </p>
                {userPos && (
                  <p className="text-xs text-primary font-medium mt-0.5">
                    {formatDistance(
                      haversineDistance(
                        userPos.lat,
                        userPos.lng,
                        selected.lat,
                        selected.lng,
                      ),
                    )}{" "}
                    away{" "}
                    {bearingArrow(
                      bearing(
                        userPos.lat,
                        userPos.lng,
                        selected.lat,
                        selected.lng,
                      ),
                    )}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                selectedRef.current = null;
                setSelected(null);
              }}
              className="text-muted-foreground hover:text-foreground text-xl leading-none flex-shrink-0 p-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
