"use client";

import { ArrowLeft, Camera, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  bearing,
  bearingArrow,
  formatDistance,
  haversineDistance,
} from "~/lib/geo";
import type { Identity } from "~/lib/identity";
import { getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { imageExt, validateImage } from "~/lib/upload";
import { cn } from "~/lib/utils";

const CAPTURE_RADIUS = 100;

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
};

type LeaderRow = {
  name: string;
  hidden: number;
  found: number;
  survivalMs: number;
};

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

export default function SeekPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [guestBlocked, setGuestBlocked] = useState(false);
  const [tab, setTab] = useState<"seek" | "leaderboard">("seek");
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [hidePos, setHidePos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [capturing, setCapturing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (!id || id.isGuest) {
      setGuestBlocked(true);
      setLoading(false);
      return;
    }
    setIdentity(id);
    fetchMascots(id);
    const interval = setInterval(() => fetchMascots(id), 8000);

    if (!navigator.geolocation) {
      setPosError("Geolocation not supported by your browser");
    } else {
      const watchId = navigator.geolocation.watchPosition(
        (pos) =>
          setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setPosError("Location unavailable — check permissions"),
        { enableHighAccuracy: true },
      );
      return () => {
        clearInterval(interval);
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => clearInterval(interval);
  }, []);

  async function fetchMascots(id: Identity) {
    const { data } = await supabase
      .from("tw_mascots")
      .select("*")
      .eq("group_id", id.groupId)
      .order("hidden_at", { ascending: false });
    if (data) {
      const rows = data as Mascot[];
      setMascots(rows);
      buildLeaderboard(rows);
    }
    setLoading(false);
  }

  function buildLeaderboard(rows: Mascot[]) {
    const map = new Map<string, LeaderRow>();
    for (const m of rows) {
      if (!map.has(m.hider_name)) {
        map.set(m.hider_name, {
          name: m.hider_name,
          hidden: 0,
          found: 0,
          survivalMs: 0,
        });
      }
      const h = map.get(m.hider_name);
      if (h) {
        h.hidden++;
        if (m.found_at) {
          h.survivalMs +=
            new Date(m.found_at).getTime() - new Date(m.hidden_at).getTime();
        }
      }
      if (m.finder_name) {
        if (!map.has(m.finder_name)) {
          map.set(m.finder_name, {
            name: m.finder_name,
            hidden: 0,
            found: 0,
            survivalMs: 0,
          });
        }
        const f = map.get(m.finder_name);
        if (f) f.found++;
      }
    }
    setLeaderboard(
      [...map.values()].sort((a, b) => b.survivalMs - a.survivalMs),
    );
  }

  function startHide() {
    if (!myPos) {
      setPosError("Waiting for GPS — try again in a moment");
      return;
    }
    setHidePos(myPos);
    setHiding(true);
    fileRef.current?.click();
  }

  async function handleHidePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !hidePos || !identity) {
      setHiding(false);
      return;
    }
    const validationError = validateImage(file);
    if (validationError) {
      setPosError(validationError);
      setHiding(false);
      if (fileRef.current) fileRef.current.value = "";
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
    if (fileRef.current) fileRef.current.value = "";
  }

  async function captureMascot(mascotId: string) {
    if (!identity) return;
    setCapturing(mascotId);
    await supabase
      .from("tw_mascots")
      .update({
        found_at: new Date().toISOString(),
        finder_user_id: identity.userId,
        finder_name: identity.displayName,
      })
      .eq("id", mascotId);
    setCapturing(null);
    fetchMascots(identity);
  }

  if (guestBlocked) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 gap-6">
        <div className="w-full max-w-sm rounded-2xl border bg-muted/30 p-8 space-y-4 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">
            Hide &amp; Seek requires an account
          </h2>
          <p className="text-sm text-muted-foreground">
            Hiding mascots and hunting with friends is a social feature. Create
            an account to play.
          </p>
          <div className="flex gap-2 pt-1">
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
        <Link
          href="/walk"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Free Walk
        </Link>
      </div>
    );
  }

  if (!identity) return null;

  const active = mascots.filter((m) => !m.found_at);
  const found = mascots.filter((m) => m.found_at);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/home">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Hide &amp; Seek</h1>
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
      <div className="flex rounded-lg bg-muted p-1">
        {(["seek", "leaderboard"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              tab === t ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {t === "leaderboard" ? "🏆 Leaderboard" : "🎯 Seek"}
          </button>
        ))}
      </div>

      {tab === "seek" && (
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleHidePhoto}
          />
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={startHide}
            disabled={hiding}
          >
            <Camera className="h-5 w-5 mr-2" />
            {hiding ? "Capturing location…" : "Hide Mascot Here"}
          </Button>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Active Mascots ({active.length})
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
                const isOwn = m.hider_user_id === identity.userId;
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-xl border overflow-hidden",
                      close && "border-primary ring-1 ring-primary/30",
                    )}
                  >
                    <div className="flex">
                      {/* biome-ignore lint/performance/noImgElement: Supabase storage public URL */}
                      <img
                        src={url}
                        alt="Mascot"
                        className="h-24 w-24 object-cover flex-shrink-0"
                      />
                      <div className="p-3 flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
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
                        {close && !isOwn && (
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => captureMascot(m.id)}
                            disabled={capturing === m.id}
                          >
                            {capturing === m.id ? "Capturing…" : "🎯 Capture!"}
                          </Button>
                        )}
                        {isOwn && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            Your mascot
                          </p>
                        )}
                        {!close && !isOwn && dist !== null && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Get within {CAPTURE_RADIUS}m to capture
                          </p>
                        )}
                        {dist === null && !isOwn && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Enable GPS to see distance
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

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
                          {m.hider_name}&apos;s mascot
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Survived {survivalStr(ms)} · Found by {m.finder_name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-muted/40 border p-3 text-xs text-muted-foreground">
            <strong>Scoring:</strong> Hiders are ranked by total survival time
            across all their hidden mascots. Longer = better.
          </div>
          {leaderboard.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
              No data yet — start hiding mascots!
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold">Player</th>
                    <th className="text-center p-3 font-semibold">Hidden</th>
                    <th className="text-center p-3 font-semibold">Found</th>
                    <th className="text-right p-3 font-semibold">Survival</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr
                      key={row.name}
                      className={cn("border-t", i === 0 && "bg-primary/5")}
                    >
                      <td className="p-3 font-medium">
                        {i === 0 && "🥇 "}
                        {i === 1 && "🥈 "}
                        {i === 2 && "🥉 "}
                        {row.name}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {row.hidden}
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {row.found}
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
