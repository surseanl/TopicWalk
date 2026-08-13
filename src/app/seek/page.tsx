"use client";

import { ArrowLeft, Camera, MapPin, TriangleAlert, Trophy } from "lucide-react";
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
const TILE_WALK_METERS = 300; // meters to unlock one tile by walking
const AUTO_TILE_MS = 5 * 60 * 1000; // one auto-tile every 5 minutes
const TOTAL_TILES = 9; // 3×3 grid
const MIN_TILES_CAPTURE = 3; // must reveal at least 3/9 tiles before capturing
const MILES_TO_METERS = 1609.34;

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
  radius_miles: number | null;
  center_lat: number | null;
  center_lng: number | null;
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

function metersToMiles(m: number): string {
  return `${(m / MILES_TO_METERS).toFixed(2)} mi`;
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

const hintKey = (mascotId: string, userId: string) =>
  `tw_hints_${mascotId}_${userId}`;

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

function loadHintData(
  mascotId: string,
  userId: string,
): { hints: string[]; fetchedUpTo: number } {
  try {
    const raw = localStorage.getItem(hintKey(mascotId, userId));
    if (raw) return JSON.parse(raw) as { hints: string[]; fetchedUpTo: number };
  } catch {}
  return { hints: [], fetchedUpTo: 0 };
}

function saveHintData(
  mascotId: string,
  userId: string,
  data: { hints: string[]; fetchedUpTo: number },
) {
  try {
    localStorage.setItem(hintKey(mascotId, userId), JSON.stringify(data));
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
    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 bg-secondary/20 pointer-events-none">
      {order.map((tileIdx) => (
        <div
          key={tileIdx}
          style={{
            transition: "opacity 0.6s ease, transform 0.6s ease",
            opacity: revealedSet.has(tileIdx) ? 0 : 1,
            transform: revealedSet.has(tileIdx) ? "scale(0.9)" : "scale(1)",
          }}
          className="bg-secondary/85"
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
  const fetchedHintTilesRef = useRef<Record<string, number>>({});

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [tab, setTab] = useState<"hunt" | "solo" | "leaderboard">("hunt");
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [progress, setProgress] = useState<Record<string, TileProgress>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [soloSpawn, setSoloSpawn] = useState<Pos | null>(null);
  const [soloCaptured, setSoloCaptured] = useState(false);

  // hide flow state
  const [hideStep, setHideStep] = useState<"pickRadius" | "walking" | null>(
    null,
  );
  const [hideCenter, setHideCenter] = useState<Pos | null>(null);
  const [hideRadius, setHideRadius] = useState<5 | 10 | null>(null);

  // AI hint state
  const [hints, setHints] = useState<Record<string, string[]>>({});

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

  // ── load saved tile progress + hints when mascots first arrive ────────────

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
        // initialise hint tracking so we don't re-fetch on reload
        if (!(m.id in fetchedHintTilesRef.current)) {
          const { fetchedUpTo } = loadHintData(m.id, identity.userId);
          fetchedHintTilesRef.current[m.id] = fetchedUpTo;
        }
      }
      return next;
    });
    // restore saved hints into state
    setHints((prev) => {
      const next = { ...prev };
      for (const m of mascots.filter(
        (m) => !m.found_at && m.hider_user_id !== identity.userId,
      )) {
        if (next[m.id]) continue;
        const { hints: saved } = loadHintData(m.id, identity.userId);
        if (saved.length > 0) next[m.id] = saved;
      }
      return next;
    });
  }, [mascots, identity]);

  // ── fetch AI hint whenever new tiles are revealed ─────────────────────────

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchHintForTile stable within render
  useEffect(() => {
    if (!identity) return;
    for (const m of mascotsRef.current) {
      if (m.found_at || m.hider_user_id === identity.userId) continue;
      const prog = progress[m.id];
      if (!prog) continue;
      const fetchedUpTo = fetchedHintTilesRef.current[m.id] ?? 0;
      if (prog.revealed > fetchedUpTo) {
        for (let tile = fetchedUpTo + 1; tile <= prog.revealed; tile++) {
          void fetchHintForTile(m, tile);
        }
        fetchedHintTilesRef.current[m.id] = prog.revealed;
      }
    }
  }, [progress, identity]);

  async function fetchHintForTile(mascot: Mascot, tileNumber: number) {
    if (!identity) return;
    const photoUrl = supabase.storage
      .from("game-photos")
      .getPublicUrl(mascot.photo_path).data.publicUrl;
    try {
      const res = await fetch("/api/mascot-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          tileNumber,
          totalTiles: TOTAL_TILES,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { hint?: string };
      const hint = data.hint?.trim();
      if (!hint) return;
      const userId = identity.userId;
      setHints((prev) => {
        const existing = prev[mascot.id] ?? [];
        const updated = [...existing, hint];
        const { fetchedUpTo: prevFetched } = loadHintData(mascot.id, userId);
        saveHintData(mascot.id, userId, {
          hints: updated,
          fetchedUpTo: Math.max(prevFetched, tileNumber),
        });
        return { ...prev, [mascot.id]: updated };
      });
    } catch {
      // silent fail — hints are non-critical
    }
  }

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

  // ── hide mascot flow ──────────────────────────────────────────────────────

  function startHide() {
    if (!myPos) {
      setPosError("Waiting for GPS — try again in a moment");
      return;
    }
    setHideStep("pickRadius");
  }

  function confirmRadius(miles: 5 | 10) {
    if (!myPos) return;
    setHideCenter(myPos);
    setHideRadius(miles);
    setHideStep("walking");
  }

  function takeHidePhoto() {
    setHiding(true);
    hideFileRef.current?.click();
  }

  function cancelHide() {
    setHideStep(null);
    setHideCenter(null);
    setHideRadius(null);
    setHiding(false);
    if (hideFileRef.current) hideFileRef.current.value = "";
  }

  async function handleHidePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !hideCenter || !identity) {
      cancelHide();
      return;
    }
    const err = validateImage(file);
    if (err) {
      setPosError(err);
      cancelHide();
      return;
    }
    // validate within radius
    if (myPos && hideRadius) {
      const dist = haversineDistance(
        hideCenter.lat,
        hideCenter.lng,
        myPos.lat,
        myPos.lng,
      );
      if (dist > hideRadius * MILES_TO_METERS) {
        setPosError(
          `You're outside the ${hideRadius}-mile play area — get closer to the center.`,
        );
        cancelHide();
        return;
      }
    }
    const ext = imageExt(file);
    const path = `${identity.groupId}/mascot-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("game-photos")
      .upload(path, file, { upsert: false });
    if (!uploadErr) {
      const lat = myPos?.lat ?? hideCenter.lat;
      const lng = myPos?.lng ?? hideCenter.lng;
      await supabase.from("tw_mascots").insert({
        group_id: identity.groupId,
        hider_user_id: identity.userId,
        hider_name: identity.displayName,
        photo_path: path,
        lat,
        lng,
        radius_miles: hideRadius,
        center_lat: hideCenter.lat,
        center_lng: hideCenter.lng,
      });
      fetchMascots(identity);
      showAlert(`📍 Mascot hidden! Friends search within ${hideRadius} miles.`);
    }
    cancelHide();
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

  // ── derived values ────────────────────────────────────────────────────────

  const active = mascots.filter((m) => !m.found_at);
  const found = mascots.filter((m) => m.found_at);

  const walkDist =
    hideCenter && myPos
      ? haversineDistance(myPos.lat, myPos.lng, hideCenter.lat, hideCenter.lng)
      : 0;
  const walkMaxMeters = (hideRadius ?? 5) * MILES_TO_METERS;
  const walkPct = Math.min(1, walkDist / walkMaxMeters);
  const walkRemaining = Math.max(0, walkMaxMeters - walkDist);
  const walkOutOfBounds = walkDist > walkMaxMeters;

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

      {/* Radius picker bottom sheet */}
      {hideStep === "pickRadius" && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop: a real <button> sibling so it isn't nested inside the dialog */}
          <button
            type="button"
            aria-label="Close radius picker"
            className="absolute inset-0 w-full bg-black/50 border-0 cursor-default"
            onClick={() => setHideStep(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Choose play radius"
            className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-6 max-w-lg mx-auto space-y-5"
          >
            <div className="w-10 h-1.5 bg-border rounded-full mx-auto" />
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold">Choose play radius</h2>
              <p className="text-sm text-muted-foreground">
                Friends must find your mascot within this distance from your
                starting point.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([5, 10] as const).map((miles) => (
                <button
                  key={miles}
                  type="button"
                  onClick={() => confirmRadius(miles)}
                  className="rounded-2xl border-2 border-border hover:border-primary bg-muted/30 hover:bg-primary/5 p-5 flex flex-col items-center gap-0.5 transition-colors"
                >
                  <span className="text-4xl font-black text-primary">
                    {miles}
                  </span>
                  <span className="text-base font-semibold">miles</span>
                  <span className="text-xs text-muted-foreground">
                    {miles === 5 ? "≈ 8 km" : "≈ 16 km"}
                  </span>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setHideStep(null)}
            >
              Cancel
            </Button>
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
            !posError && (
              <p className="text-xs text-muted-foreground">Getting location…</p>
            )
          )}
        </div>
      </div>

      {/* GPS error alert */}
      {posError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3.5"
        >
          <div className="shrink-0 w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
            <TriangleAlert className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-none mb-0.5">
              Location access needed
            </p>
            <p className="text-xs text-muted-foreground truncate">{posError}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(["hunt", "solo", "leaderboard"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-xl py-2 text-xs font-bold transition-all duration-200",
              tab === t
                ? "bg-foreground text-background hover:scale-[1.04] hover:shadow-lg"
                : "border border-border/50 text-foreground/40 hover:border-foreground/40 hover:text-foreground/70 hover:-translate-y-0.5 hover:shadow-sm",
            )}
          >
            {t === "hunt" ? "Hunt" : t === "solo" ? "Solo" : "Board"}
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

              {/* Walking-to-hide panel */}
              {hideStep === "walking" && hideCenter && hideRadius ? (
                <div
                  className={cn(
                    "rounded-2xl border-2 p-5 space-y-4 transition-colors",
                    walkOutOfBounds
                      ? "border-destructive bg-destructive/5"
                      : "border-primary bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🚶</span>
                    <div>
                      <p className="font-bold">Walk to your hiding spot</p>
                      <p className="text-xs text-muted-foreground">
                        {hideRadius}-mile play radius from your start
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {metersToMiles(walkDist)} from start
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          walkOutOfBounds
                            ? "text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {walkOutOfBounds
                          ? "⚠️ Out of bounds!"
                          : `${metersToMiles(walkRemaining)} remaining`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          walkOutOfBounds ? "bg-destructive" : "bg-primary",
                        )}
                        style={{ width: `${walkPct * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={cancelHide}
                      disabled={hiding}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={takeHidePhoto}
                      disabled={hiding || walkOutOfBounds}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {hiding ? "Saving…" : "Take Photo Here"}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full h-14 rounded-2xl bg-foreground text-background text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                  onClick={startHide}
                  disabled={hideStep === "pickRadius"}
                >
                  <Camera className="h-4 w-4" />
                  Hide Mascot Here
                </button>
              )}

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
                    const mascotHints = hints[m.id] ?? [];

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
                          {/* Radius badge */}
                          {m.radius_miles && (
                            <div className="absolute top-2 left-2 bg-background/90 rounded-full px-2.5 py-1 text-xs font-semibold shadow">
                              📍 {m.radius_miles} mi radius
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

                        {/* AI hints */}
                        {!isOwn && mascotHints.length > 0 && (
                          <div className="border-t px-3 pb-3 pt-2.5 space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                              💡 Clues
                            </p>
                            <div className="space-y-1">
                              {mascotHints.map((hint, hintIdx) => (
                                <div
                                  key={`${m.id}-${hint}`}
                                  className="text-xs bg-muted/60 rounded-lg px-3 py-2 text-foreground/80 leading-relaxed"
                                >
                                  <span className="font-mono text-primary/70 mr-1.5 text-[10px]">
                                    #{hintIdx + 1}
                                  </span>
                                  {hint}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">Today's Mascot</p>
                  <p className="text-xs text-muted-foreground">
                    Within 5 miles
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                Resets midnight
              </span>
            </div>

            {/* Loading */}
            {!myPos && !posError && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
                Getting your location…
              </div>
            )}

            {/* Inline error */}
            {posError && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2.5">
                <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-destructive" />
                <p className="text-xs text-muted-foreground">{posError}</p>
              </div>
            )}

            {/* Distance + direction */}
            {myPos && soloSpawn && !soloCaptured && (
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3.5">
                <div>
                  <p className="text-3xl font-black tabular-nums">
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

            {/* Capture button */}
            {myPos &&
              soloSpawn &&
              haversineDistance(
                myPos.lat,
                myPos.lng,
                soloSpawn.lat,
                soloSpawn.lng,
              ) <= CAPTURE_RADIUS &&
              !soloCaptured && (
                <button
                  type="button"
                  className="w-full h-12 rounded-2xl bg-foreground text-background text-sm font-bold transition-all duration-200 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                  onClick={() => setSoloCaptured(true)}
                >
                  You're here — Capture!
                </button>
              )}

            {/* Captured state */}
            {soloCaptured && (
              <div className="text-center space-y-1.5 py-3">
                <p className="text-3xl">🎉</p>
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
