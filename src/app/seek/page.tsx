"use client";

import { ArrowLeft, Camera, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import Globe from "~/components/ui/globe";
import {
  bearing,
  bearingArrow,
  formatDistance,
  GLOBAL_LANDMARKS,
  getDailySpawn,
  haversineDistance,
} from "~/lib/geo";
import type { Identity } from "~/lib/identity";
import { getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { imageExt, validateImage } from "~/lib/upload";
import { cn } from "~/lib/utils";

const CAPTURE_RADIUS = 100; // meters
const TILE_WALK_METERS = 200; // meters to unlock one tile by walking
const AUTO_TILE_MS = 5 * 60 * 1000; // one auto-tile every 5 minutes
const TOTAL_TILES = 16;
const MIN_TILES_CAPTURE = 4; // must reveal at least 4/16 tiles before capturing

type Mascot = {
  id: string;
  hider_user_id: string;
  hider_name: string;
  photo_path: string;
  lat: number;
  lng: number;
  hidden_at: string;
  found_at: string | null;
  finder_user_id: string | null;
  finder_name: string | null;
  finder_photo_path: string | null;
};

type LeaderRow = {
  name: string;
  hidden: number;
  found: number;
  survivalMs: number;
};

type TileProgress = {
  revealed: number;
  metersSinceTile: number;
  totalWalked: number;
  lastAutoMs: number;
};

type Pos = { lat: number; lng: number };

// ── helpers ───────────────────────────────────────────────────────────────────

function elapsed(isoStr: string): string {
  const ms = Date.now() - new Date(isoStr).getTime();
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function survivalStr(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function makeTileOrder(seed: string): number[] {
  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = tiles.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j] as number, tiles[i] as number];
  }
  return tiles;
}

const progressKey = (mascotId: string, userId: string) =>
  `tw_tile_${mascotId}_${userId}`;

function loadProgress(mascotId: string, userId: string): TileProgress {
  try {
    const raw = localStorage.getItem(progressKey(mascotId, userId));
    if (raw) return JSON.parse(raw) as TileProgress;
  } catch {}
  return {
    revealed: 0,
    metersSinceTile: 0,
    totalWalked: 0,
    lastAutoMs: Date.now(),
  };
}

function saveProgress(mascotId: string, userId: string, p: TileProgress) {
  try {
    localStorage.setItem(progressKey(mascotId, userId), JSON.stringify(p));
  } catch {}
}

// ── TileOverlay component ─────────────────────────────────────────────────────

function TileOverlay({
  mascotId,
  revealed,
}: {
  mascotId: string;
  revealed: number;
}) {
  const order = makeTileOrder(mascotId);
  const revealedSet = new Set(order.slice(0, revealed));
  return (
    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px bg-secondary/30 pointer-events-none">
      {order.map((tileIdx) => (
        <div
          key={tileIdx}
          className={cn(
            "transition-opacity duration-700 bg-secondary/80",
            revealedSet.has(tileIdx) ? "opacity-0" : "opacity-100",
          )}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SeekPage() {
  const supabase = createClient();
  const hideFileRef = useRef<HTMLInputElement>(null);
  const captureFileRef = useRef<HTMLInputElement>(null);
  const mascotsRef = useRef<Mascot[]>([]);
  const prevPosRef = useRef<Pos | null>(null);
  const firstFetchRef = useRef(true);
  const knownCapturedRef = useRef<Set<string>>(new Set());

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [tab, setTab] = useState<"hunt" | "solo" | "leaderboard">("hunt");
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [hidePos, setHidePos] = useState<Pos | null>(null);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [progress, setProgress] = useState<Record<string, TileProgress>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [soloSpawn, setSoloSpawn] = useState<Pos | null>(null);
  const [soloCaptured, setSoloCaptured] = useState(false);

  // ── mount ──────────────────────────────────────────────────────────────────

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (!id) {
      setIsGuest(true);
      setLoading(false);
      startGps();
      return;
    }
    if (id.isGuest) {
      setIsGuest(true);
      setLoading(false);
      setTab("solo");
      startGps();
      return;
    }
    setIdentity(id);
    fetchMascots(id);
    const interval = setInterval(() => fetchMascots(id), 8000);
    startGps();
    return () => {
      clearInterval(interval);
    };
  }, []);

  function startGps() {
    if (!navigator.geolocation) {
      setPosError("Geolocation not supported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosError("Location unavailable — check permissions"),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }

  // ── compute daily solo spawn once GPS is available ─────────────────────────

  useEffect(() => {
    if (!myPos || soloSpawn) return;
    const today = new Date().toISOString().split("T")[0];
    setSoloSpawn(getDailySpawn(myPos.lat, myPos.lng, today ?? ""));
  }, [myPos, soloSpawn]);

  // ── track walking distance → unlock tiles ─────────────────────────────────

  useEffect(() => {
    if (!myPos || !identity) return;
    const prev = prevPosRef.current;
    if (prev) {
      const delta = haversineDistance(prev.lat, prev.lng, myPos.lat, myPos.lng);
      if (delta > 2 && delta < 500) {
        setProgress((prev) => {
          const next = { ...prev };
          const active = mascotsRef.current.filter(
            (m) => !m.found_at && m.hider_user_id !== identity.userId,
          );
          for (const m of active) {
            const p = next[m.id] ?? loadProgress(m.id, identity.userId);
            let { revealed, metersSinceTile, totalWalked } = p;
            totalWalked += delta;
            metersSinceTile += delta;
            while (
              metersSinceTile >= TILE_WALK_METERS &&
              revealed < TOTAL_TILES
            ) {
              revealed++;
              metersSinceTile -= TILE_WALK_METERS;
            }
            const updated = { ...p, revealed, metersSinceTile, totalWalked };
            next[m.id] = updated;
            saveProgress(m.id, identity.userId, updated);
          }
          return next;
        });
      }
    }
    prevPosRef.current = myPos;
  }, [myPos, identity]);

  // ── auto-unlock one tile every 5 minutes ─────────────────────────────────

  useEffect(() => {
    if (!identity) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setProgress((prev) => {
        const next = { ...prev };
        const active = mascotsRef.current.filter(
          (m) => !m.found_at && m.hider_user_id !== identity.userId,
        );
        for (const m of active) {
          const p = next[m.id] ?? loadProgress(m.id, identity.userId);
          const autoTiles = Math.floor((now - p.lastAutoMs) / AUTO_TILE_MS);
          if (autoTiles > 0 && p.revealed < TOTAL_TILES) {
            const revealed = Math.min(TOTAL_TILES, p.revealed + autoTiles);
            const updated = {
              ...p,
              revealed,
              lastAutoMs: p.lastAutoMs + autoTiles * AUTO_TILE_MS,
            };
            next[m.id] = updated;
            saveProgress(m.id, identity.userId, updated);
          }
        }
        return next;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [identity]);

  // ── load saved tile progress when mascots first arrive ────────────────────

  useEffect(() => {
    if (!identity || mascots.length === 0) return;
    const now = Date.now();
    setProgress((prev) => {
      const next = { ...prev };
      for (const m of mascots.filter((m) => !m.found_at)) {
        if (next[m.id]) continue;
        const saved = loadProgress(m.id, identity.userId);
        const autoTiles = Math.floor((now - saved.lastAutoMs) / AUTO_TILE_MS);
        if (autoTiles > 0 && saved.revealed < TOTAL_TILES) {
          saved.revealed = Math.min(TOTAL_TILES, saved.revealed + autoTiles);
          saved.lastAutoMs += autoTiles * AUTO_TILE_MS;
          saveProgress(m.id, identity.userId, saved);
        }
        next[m.id] = saved;
      }
      return next;
    });
  }, [mascots, identity]);

  // ── data fetching ─────────────────────────────────────────────────────────

  async function fetchMascots(id: Identity) {
    const { data } = await supabase
      .from("tw_mascots")
      .select("*")
      .eq("group_id", id.groupId)
      .order("hidden_at", { ascending: false });
    if (data) {
      const rows = data as Mascot[];
      mascotsRef.current = rows;
      // Alert on new captures by others
      if (!firstFetchRef.current) {
        for (const m of rows) {
          if (
            m.found_at &&
            !knownCapturedRef.current.has(m.id) &&
            m.finder_user_id !== id.userId
          ) {
            showAlert(`🎉 ${m.finder_name} caught ${m.hider_name}'s mascot!`);
          }
        }
      }
      firstFetchRef.current = false;
      for (const m of rows) {
        if (m.found_at) knownCapturedRef.current.add(m.id);
      }
      setMascots(rows);
      buildLeaderboard(rows);
    }
    setLoading(false);
  }

  function showAlert(msg: string) {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 5000);
  }

  function buildLeaderboard(rows: Mascot[]) {
    const map = new Map<string, LeaderRow>();
    for (const m of rows) {
      if (!map.has(m.hider_name))
        map.set(m.hider_name, {
          name: m.hider_name,
          hidden: 0,
          found: 0,
          survivalMs: 0,
        });
      const h = map.get(m.hider_name);
      if (h) {
        h.hidden++;
        if (m.found_at)
          h.survivalMs +=
            new Date(m.found_at).getTime() - new Date(m.hidden_at).getTime();
      }
      if (m.finder_name) {
        if (!map.has(m.finder_name))
          map.set(m.finder_name, {
            name: m.finder_name,
            hidden: 0,
            found: 0,
            survivalMs: 0,
          });
        const f = map.get(m.finder_name);
        if (f) f.found++;
      }
    }
    setLeaderboard(
      [...map.values()].sort(
        (a, b) => b.found - a.found || b.survivalMs - a.survivalMs,
      ),
    );
  }

  // ── hide mascot ───────────────────────────────────────────────────────────

  function startHide() {
    if (!myPos) {
      setPosError("Waiting for GPS — try again in a moment");
      return;
    }
    setHidePos(myPos);
    setHiding(true);
    hideFileRef.current?.click();
  }

  async function handleHidePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !hidePos || !identity) {
      setHiding(false);
      return;
    }
    const err = validateImage(file);
    if (err) {
      setPosError(err);
      setHiding(false);
      if (hideFileRef.current) hideFileRef.current.value = "";
      return;
    }
    const ext = imageExt(file);
    const path = `${identity.groupId}/mascot-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("game-photos")
      .upload(path, file, { upsert: false });
    if (!uploadErr) {
      await supabase.from("tw_mascots").insert({
        group_id: identity.groupId,
        hider_user_id: identity.userId,
        hider_name: identity.displayName,
        photo_path: path,
        lat: hidePos.lat,
        lng: hidePos.lng,
      });
      fetchMascots(identity);
    }
    setHiding(false);
    setHidePos(null);
    if (hideFileRef.current) hideFileRef.current.value = "";
  }

  // ── capture mascot via photo ──────────────────────────────────────────────

  function startCapture(mascotId: string) {
    setCaptureTarget(mascotId);
    captureFileRef.current?.click();
  }

  async function handleCapturePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !captureTarget || !identity) {
      setCaptureTarget(null);
      return;
    }
    const err = validateImage(file);
    if (err) {
      setPosError(err);
      setCaptureTarget(null);
      if (captureFileRef.current) captureFileRef.current.value = "";
      return;
    }
    const ext = imageExt(file);
    const path = `${identity.groupId}/capture-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("game-photos")
      .upload(path, file, { upsert: false });
    if (!uploadErr) {
      await supabase
        .from("tw_mascots")
        .update({
          found_at: new Date().toISOString(),
          finder_user_id: identity.userId,
          finder_name: identity.displayName,
          finder_photo_path: path,
        })
        .eq("id", captureTarget);
      knownCapturedRef.current.add(captureTarget);
      fetchMascots(identity);
      showAlert("🎯 You captured the mascot!");
    }
    setCaptureTarget(null);
    if (captureFileRef.current) captureFileRef.current.value = "";
  }

  // ── render: guest solo gate ───────────────────────────────────────────────

  const active = mascots.filter((m) => !m.found_at);
  const found = mascots.filter((m) => m.found_at);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-4">
      {/* Alert toast */}
      {alertMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="rounded-2xl bg-foreground text-background px-5 py-3 shadow-lg text-sm font-semibold whitespace-nowrap">
            {alertMsg}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={isGuest ? "/" : "/home"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Mascot Hunt</h1>
          {myPos ? (
            <p className="text-xs text-primary">📍 GPS active</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {posError ?? "Getting location…"}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 gap-1">
        {(["hunt", "solo", "leaderboard"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors capitalize",
              tab === t
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground",
            )}
          >
            {t === "hunt" ? "🎯 Hunt" : t === "solo" ? "🗺️ Solo" : "🏆 Board"}
          </button>
        ))}
      </div>

      {/* ── HUNT TAB ────────────────────────────────────────────────────────── */}
      {tab === "hunt" && (
        <div className="space-y-4">
          {isGuest ? (
            <div className="rounded-2xl border bg-muted/30 p-8 space-y-4 text-center">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-bold">Hunt with friends</h2>
              <p className="text-sm text-muted-foreground">
                Create an account to hide mascots and hunt with your group.
              </p>
              <div className="flex gap-2">
                <Link href="/auth" className="flex-1">
                  <Button className="w-full">Sign Up</Button>
                </Link>
                <Link href="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <input
                ref={hideFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleHidePhoto}
              />
              <input
                ref={captureFileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleCapturePhoto}
              />
              <Button
                size="lg"
                className="w-full h-14 text-base"
                onClick={startHide}
                disabled={hiding}
              >
                <Camera className="h-5 w-5 mr-2" />
                {hiding ? "Saving location…" : "Hide Mascot Here"}
              </Button>

              {/* Active mascots */}
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Active ({active.length})
                </h2>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">
                    Loading…
                  </div>
                ) : active.length === 0 ? (
                  <div className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                    No mascots hidden yet. Be the first!
                  </div>
                ) : (
                  active.map((m) => {
                    const url = supabase.storage
                      .from("game-photos")
                      .getPublicUrl(m.photo_path).data.publicUrl;
                    const dist = myPos
                      ? haversineDistance(myPos.lat, myPos.lng, m.lat, m.lng)
                      : null;
                    const dir = myPos
                      ? bearing(myPos.lat, myPos.lng, m.lat, m.lng)
                      : null;
                    const close = dist !== null && dist <= CAPTURE_RADIUS;
                    const isOwn = m.hider_user_id === identity?.userId;
                    const prog = progress[m.id] ?? {
                      revealed: 0,
                      metersSinceTile: 0,
                      totalWalked: 0,
                      lastAutoMs: 0,
                    };
                    const canCapture =
                      close && !isOwn && prog.revealed >= MIN_TILES_CAPTURE;
                    const tilesLeft = Math.max(
                      0,
                      MIN_TILES_CAPTURE - prog.revealed,
                    );
                    const metersToNextTile = Math.max(
                      0,
                      TILE_WALK_METERS - prog.metersSinceTile,
                    );

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "rounded-2xl border-2 overflow-hidden",
                          canCapture
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border",
                        )}
                      >
                        {/* Tiled photo */}
                        <div className="relative w-full aspect-square">
                          {/* biome-ignore lint/performance/noImgElement: Supabase storage public URL */}
                          <img
                            src={url}
                            alt="Hiding spot"
                            className="w-full h-full object-cover"
                          />
                          {!isOwn && (
                            <TileOverlay
                              mascotId={m.id}
                              revealed={prog.revealed}
                            />
                          )}
                          {/* Tile count badge */}
                          {!isOwn && (
                            <div className="absolute top-2 right-2 bg-background/90 rounded-full px-2.5 py-1 text-xs font-bold shadow">
                              {prog.revealed}/{TOTAL_TILES} tiles
                            </div>
                          )}
                          {isOwn && (
                            <div className="absolute top-2 right-2 bg-background/90 rounded-full px-2.5 py-1 text-xs font-semibold shadow">
                              Your mascot
                            </div>
                          )}
                        </div>

                        {/* Info row */}
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm">
                                {m.hider_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {elapsed(m.hidden_at)} ago
                              </p>
                            </div>
                            {dist !== null && (
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-primary text-sm">
                                  {formatDistance(dist)}
                                </p>
                                {dir !== null && (
                                  <p className="text-xl leading-none">
                                    {bearingArrow(dir)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {!isOwn && (
                            <div className="space-y-1.5">
                              {/* Walk progress bar */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>
                                  🚶 {formatDistance(prog.totalWalked)} walked
                                </span>
                                <span className="text-border">·</span>
                                <span>
                                  next tile in{" "}
                                  {formatDistance(metersToNextTile)}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full bg-secondary rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(prog.metersSinceTile / TILE_WALK_METERS) * 100}%`,
                                  }}
                                />
                              </div>

                              {canCapture ? (
                                <Button
                                  size="sm"
                                  className="w-full mt-1"
                                  onClick={() => startCapture(m.id)}
                                  disabled={captureTarget === m.id}
                                >
                                  <Camera className="h-4 w-4 mr-1.5" />
                                  {captureTarget === m.id
                                    ? "Uploading…"
                                    : "📸 Capture Mascot!"}
                                </Button>
                              ) : close && prog.revealed < MIN_TILES_CAPTURE ? (
                                <p className="text-xs text-muted-foreground text-center">
                                  You're close! Reveal {tilesLeft} more tile
                                  {tilesLeft !== 1 ? "s" : ""} to capture
                                </p>
                              ) : !close ? (
                                <p className="text-xs text-muted-foreground text-center">
                                  Walk closer — need to be within{" "}
                                  {CAPTURE_RADIUS}m
                                </p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Found mascots */}
              {found.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    Found ({found.length})
                  </h2>
                  {found.map((m) => {
                    const url = supabase.storage
                      .from("game-photos")
                      .getPublicUrl(m.photo_path).data.publicUrl;
                    const ms =
                      new Date(m.found_at ?? "").getTime() -
                      new Date(m.hidden_at).getTime();
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl border overflow-hidden opacity-60"
                      >
                        <div className="flex">
                          {/* biome-ignore lint/performance/noImgElement: Supabase storage public URL */}
                          <img
                            src={url}
                            alt="Found mascot"
                            className="h-16 w-16 object-cover flex-shrink-0 grayscale"
                          />
                          <div className="p-3">
                            <p className="text-sm font-medium">
                              {m.hider_name}'s mascot
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Survived {survivalStr(ms)} · Found by{" "}
                              {m.finder_name}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── SOLO TAB ────────────────────────────────────────────────────────── */}
      {tab === "solo" && (
        <div className="space-y-4">
          {/* Daily spawn card */}
          <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <div>
                <p className="font-bold text-sm">Today's Mascot</p>
                <p className="text-xs text-muted-foreground">
                  Resets at midnight · Within 5 miles
                </p>
              </div>
            </div>

            {!myPos && !posError && (
              <p className="text-sm text-muted-foreground animate-pulse">
                Getting your location…
              </p>
            )}
            {posError && <p className="text-sm text-destructive">{posError}</p>}

            {myPos && soloSpawn && !soloCaptured && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-primary tabular-nums">
                    {formatDistance(
                      haversineDistance(
                        myPos.lat,
                        myPos.lng,
                        soloSpawn.lat,
                        soloSpawn.lng,
                      ),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">away</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl leading-none">
                    {bearingArrow(
                      bearing(
                        myPos.lat,
                        myPos.lng,
                        soloSpawn.lat,
                        soloSpawn.lng,
                      ),
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    head this way
                  </p>
                </div>
              </div>
            )}

            {myPos &&
              soloSpawn &&
              haversineDistance(
                myPos.lat,
                myPos.lng,
                soloSpawn.lat,
                soloSpawn.lng,
              ) <= CAPTURE_RADIUS &&
              !soloCaptured && (
                <Button
                  className="w-full"
                  onClick={() => setSoloCaptured(true)}
                >
                  🎯 You're here — Capture!
                </Button>
              )}

            {soloCaptured && (
              <div className="text-center space-y-1 py-2">
                <p className="text-2xl">🎉</p>
                <p className="font-bold">Captured!</p>
                <p className="text-xs text-muted-foreground">
                  Come back tomorrow for a new spawn.
                </p>
              </div>
            )}
          </div>

          {/* Global landmarks globe */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Global Landmarks
            </h2>
            <p className="text-xs text-muted-foreground">
              Mascots hide at famous spots worldwide. Spin the globe and tap a
              pin to see how far you are.
            </p>
          </div>
          <div className="-mx-4">
            <Globe landmarks={GLOBAL_LANDMARKS} userPos={myPos} />
          </div>
        </div>
      )}

      {/* ── LEADERBOARD TAB ──────────────────────────────────────────────────── */}
      {tab === "leaderboard" && (
        <div className="space-y-4">
          {isGuest ? (
            <div className="rounded-2xl border bg-muted/30 p-8 space-y-4 text-center">
              <Trophy className="h-10 w-10 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-bold">Group leaderboard</h2>
              <p className="text-sm text-muted-foreground">
                Sign up to compete with friends.
              </p>
              <div className="flex gap-2">
                <Link href="/auth" className="flex-1">
                  <Button className="w-full">Sign Up</Button>
                </Link>
                <Link href="/auth" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
              No data yet — start hiding mascots!
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Player</th>
                    <th className="text-center p-3 font-semibold">Found</th>
                    <th className="text-center p-3 font-semibold">Hidden</th>
                    <th className="text-right p-3 font-semibold">Survival</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr
                      key={row.name}
                      className={cn("border-t", i === 0 && "bg-primary/5")}
                    >
                      <td className="p-3 text-muted-foreground text-xs">
                        {i === 0
                          ? "🥇"
                          : i === 1
                            ? "🥈"
                            : i === 2
                              ? "🥉"
                              : i + 1}
                      </td>
                      <td className="p-3 font-medium">{row.name}</td>
                      <td className="p-3 text-center text-muted-foreground">
                        {row.found}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {row.hidden}
                      </td>
                      <td className="p-3 text-right font-mono text-primary">
                        {row.survivalMs > 0 ? survivalStr(row.survivalMs) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
