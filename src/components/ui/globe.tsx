"use client";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
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

// biome-ignore lint/suspicious/noExplicitAny: maplibre style spec doesn't expose projection in TS types yet
type AnyStyle = any;

export default function Globe({ landmarks, userPos, className }: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [selected, setSelected] = useState<LandmarkItem | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const style: AnyStyle = {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        satellite: {
          type: "raster",
          // Esri World Imagery — free, no API key, excellent satellite coverage
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution:
            "Esri, Maxar, Earthstar Geographics, CNES/Airbus DS, USDA, USGS",
        },
        reference: {
          type: "raster",
          // Esri Reference — city names, roads, boundaries on top of satellite
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        // Deep-space background visible behind the globe sphere
        {
          id: "background",
          type: "background",
          paint: { "background-color": "#05101e" },
        },
        { id: "satellite", type: "raster", source: "satellite" },
        { id: "reference", type: "raster", source: "reference" },
      ],
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [10, 25],
      zoom: 1.8,
      minZoom: 0.5,
      maxZoom: 19,
      maxPitch: 80,
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    );

    map.on("load", () => {
      // Globe projection — renders the earth as a sphere when zoomed out
      if (typeof map.setProjection === "function") {
        map.setProjection({ type: "globe" });
      }
      setMapReady(true);

      for (const lm of landmarks) {
        const el = document.createElement("button");
        el.type = "button";
        el.title = lm.name;
        Object.assign(el.style, {
          width: "34px",
          height: "34px",
          background: "#d97706",
          border: "2.5px solid #fbbf24",
          borderRadius: "50%",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          transition: "transform 0.15s, background 0.15s",
          outline: "none",
          padding: "0",
        });
        el.textContent = lm.emoji;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelected((prev) => (prev?.name === lm.name ? null : lm));
        });
        el.addEventListener("mouseover", () => {
          el.style.transform = "scale(1.3)";
          el.style.background = "#f59e0b";
        });
        el.addEventListener("mouseout", () => {
          el.style.transform = "scale(1)";
          el.style.background = "#d97706";
        });

        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([lm.lng, lm.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    });

    mapRef.current = map;

    return () => {
      setMapReady(false);
      for (const m of markersRef.current) m.remove();
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [landmarks]);

  // Update user-location dot when GPS becomes available
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    if (!userPos) return;

    const el = document.createElement("div");
    Object.assign(el.style, {
      width: "14px",
      height: "14px",
      background: "#3b82f6",
      border: "2px solid white",
      borderRadius: "50%",
      boxShadow: "0 0 0 5px rgba(59,130,246,0.3)",
    });

    userMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: "center",
    })
      .setLngLat([userPos.lng, userPos.lat])
      .addTo(mapRef.current);
  }, [userPos, mapReady]);

  function flyToLandmark(lm: LandmarkItem) {
    mapRef.current?.flyTo({
      center: [lm.lng, lm.lat],
      zoom: 14,
      pitch: 45,
      duration: 2200,
      essential: true,
    });
  }

  return (
    <div className={cn("relative", className)}>
      {/* Map container — full-bleed, taller than the old canvas globe */}
      <div ref={containerRef} className="w-full" style={{ height: "520px" }} />

      {/* Landmark info card (overlaid bottom of map) */}
      {selected && (
        <div className="absolute bottom-10 left-3 right-3 z-10 rounded-xl border bg-card/95 backdrop-blur-sm p-3 shadow-xl animate-scale-in">
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
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground text-xl leading-none flex-shrink-0 p-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            onClick={() => flyToLandmark(selected)}
            className="mt-2 w-full text-xs bg-muted hover:bg-muted/80 rounded-lg px-3 py-1.5 transition-colors text-center font-medium"
          >
            🛰 Fly here
          </button>
        </div>
      )}
    </div>
  );
}
