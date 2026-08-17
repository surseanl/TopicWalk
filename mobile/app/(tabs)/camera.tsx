import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Camera } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAPTURE_RADIUS = 100;
const TILE_WALK_METERS = 300;
const TILE_WALK_SOLO = 1609.34;
const AUTO_TILE_MS = 5 * 60 * 1000;
const TOTAL_TILES = 9;
const MIN_TILES_CAPTURE = 3;
const MILES_TO_METERS = 1609.34;

// ── Types ─────────────────────────────────────────────────────────────────────

type Pos = { lat: number; lng: number };

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

// ── Geo helpers ───────────────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function bearingArrow(deg: number): string {
  const dirs = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  return dirs[Math.round(deg / 45) % 8] ?? "↑";
}

function formatDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

function elapsed(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

function survivalStr(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${sec}s`;
}

// ── Tile helpers ──────────────────────────────────────────────────────────────

function makeTileOrder(seed: string): number[] {
  const tiles = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  let h = 5381;
  for (let i = 0; i < seed.length; i++)
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  for (let i = tiles.length - 1; i > 0; i--) {
    h = (h * 1664525 + 1013904223) >>> 0;
    const j = h % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j] as number, tiles[i] as number];
  }
  return tiles;
}

const tileKey = (mascotId: string, uid: string) => `tw_tile_${mascotId}_${uid}`;

async function loadTileProgress(
  mascotId: string,
  uid: string,
): Promise<TileProgress> {
  try {
    const raw = await AsyncStorage.getItem(tileKey(mascotId, uid));
    if (raw) return JSON.parse(raw) as TileProgress;
  } catch {}
  return {
    revealed: 0,
    metersSinceTile: 0,
    totalWalked: 0,
    lastAutoMs: Date.now(),
  };
}

function saveTileProgress(mascotId: string, uid: string, p: TileProgress) {
  AsyncStorage.setItem(tileKey(mascotId, uid), JSON.stringify(p)).catch(
    () => {},
  );
}

// ── TileOverlay ───────────────────────────────────────────────────────────────

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
    <View
      style={[
        StyleSheet.absoluteFillObject,
        { flexDirection: "row", flexWrap: "wrap" },
      ]}
    >
      {Array.from({ length: TOTAL_TILES }, (_, i) => i).map((idx) => (
        <View
          key={idx}
          style={{
            width: "33.34%",
            height: "33.34%",
            backgroundColor: revealedSet.has(idx)
              ? "transparent"
              : "rgba(120,113,108,0.85)",
          }}
        />
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function HuntScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [tab, setTab] = useState<"hunt" | "solo" | "leaderboard">("hunt");
  const [mascots, setMascots] = useState<Mascot[]>([]);
  const [myPos, setMyPos] = useState<Pos | null>(null);
  const [posError, setPosError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [progress, setProgress] = useState<Record<string, TileProgress>>({});
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [soloTotalWalked, setSoloTotalWalked] = useState(0);
  const [soloTiles, setSoloTiles] = useState(0);
  const [soloMetersSince, setSoloMetersSince] = useState(0);

  const prevPosRef = useRef<Pos | null>(null);
  const mascotsRef = useRef<Mascot[]>([]);
  const userIdRef = useRef<string | null>(null);
  const progressRef = useRef<Record<string, TileProgress>>({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadUser();
    void startGps();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadUser();
      else {
        setUserId(null);
        setMascots([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Auto-unlock tiles on a 30s interval
  useEffect(() => {
    const interval = setInterval(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      const now = Date.now();
      let changed = false;
      for (const m of mascotsRef.current.filter(
        (m) => !m.found_at && m.hider_user_id !== uid,
      )) {
        const p = progressRef.current[m.id];
        if (!p) continue;
        const auto = Math.floor((now - p.lastAutoMs) / AUTO_TILE_MS);
        if (auto > 0 && p.revealed < TOTAL_TILES) {
          const updated = {
            ...p,
            revealed: Math.min(TOTAL_TILES, p.revealed + auto),
            lastAutoMs: p.lastAutoMs + auto * AUTO_TILE_MS,
          };
          progressRef.current[m.id] = updated;
          saveTileProgress(m.id, uid, updated);
          changed = true;
        }
      }
      if (changed) setProgress({ ...progressRef.current });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  async function startGps() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPosError("Location permission denied");
      return;
    }
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 2 },
      (loc: Location.LocationObject) => {
        const pos = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        setMyPos(pos);
        onNewPosition(pos);
      },
    );
    return () => sub.remove();
  }

  function onNewPosition(pos: Pos) {
    const prev = prevPosRef.current;
    if (prev) {
      const delta = haversineDistance(prev.lat, prev.lng, pos.lat, pos.lng);
      if (delta > 2 && delta < 500) {
        setSoloTotalWalked((w) => w + delta);
        setSoloMetersSince((m) => {
          const next = m + delta;
          if (next >= TILE_WALK_SOLO) {
            setSoloTiles((t) => Math.min(TOTAL_TILES, t + 1));
            return next - TILE_WALK_SOLO;
          }
          return next;
        });

        const uid = userIdRef.current;
        if (uid) {
          let changed = false;
          for (const m of mascotsRef.current.filter(
            (m) => !m.found_at && m.hider_user_id !== uid,
          )) {
            const cur = progressRef.current[m.id] ?? {
              revealed: 0,
              metersSinceTile: 0,
              totalWalked: 0,
              lastAutoMs: Date.now(),
            };
            let { revealed, metersSinceTile, totalWalked } = cur;
            totalWalked += delta;
            metersSinceTile += delta;
            while (
              metersSinceTile >= TILE_WALK_METERS &&
              revealed < TOTAL_TILES
            ) {
              revealed++;
              metersSinceTile -= TILE_WALK_METERS;
            }
            const updated = { ...cur, revealed, metersSinceTile, totalWalked };
            progressRef.current[m.id] = updated;
            saveTileProgress(m.id, uid, updated);
            changed = true;
          }
          if (changed) setProgress({ ...progressRef.current });
        }
      }
    }
    prevPosRef.current = pos;
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);
    userIdRef.current = session.user.id;
    const { data } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle();
    setDisplayName(data?.username ?? "");
    await fetchMascots(session.user.id);
  }

  async function fetchMascots(uid: string) {
    const { data } = await supabase
      .from("tw_mascots")
      .select("*")
      .eq("group_id", uid)
      .order("hidden_at", { ascending: false });
    if (data) {
      const rows = data as Mascot[];
      mascotsRef.current = rows;
      setMascots(rows);
      buildLeaderboard(rows);
      const now = Date.now();
      const pMap: Record<string, TileProgress> = {};
      for (const m of rows.filter((r) => !r.found_at)) {
        const saved = await loadTileProgress(m.id, uid);
        const auto = Math.floor((now - saved.lastAutoMs) / AUTO_TILE_MS);
        if (auto > 0 && saved.revealed < TOTAL_TILES) {
          saved.revealed = Math.min(TOTAL_TILES, saved.revealed + auto);
          saved.lastAutoMs += auto * AUTO_TILE_MS;
          saveTileProgress(m.id, uid, saved);
        }
        pMap[m.id] = saved;
      }
      progressRef.current = pMap;
      setProgress(pMap);
    }
    setLoading(false);
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

  function showAlert(msg: string) {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 4000);
  }

  async function hideMascot(radius: 5 | 10) {
    setShowRadiusPicker(false);
    if (!myPos || !userId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const path = `${userId}/mascot-${Date.now()}.${ext}`;
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      const { error } = await supabase.storage
        .from("game-photos")
        .upload(path, blob, { contentType: asset.mimeType ?? "image/jpeg" });
      if (!error) {
        await supabase.from("tw_mascots").insert({
          group_id: userId,
          hider_user_id: userId,
          hider_name: displayName,
          photo_path: path,
          lat: myPos.lat,
          lng: myPos.lng,
          radius_miles: radius,
          center_lat: myPos.lat,
          center_lng: myPos.lng,
        });
        await fetchMascots(userId);
        showAlert(`📍 Mascot hidden! Friends search within ${radius} miles.`);
      }
    } finally {
      setUploading(false);
    }
  }

  async function captureMascot(mascotId: string) {
    if (!userId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    setCaptureTarget(mascotId);
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) {
      setCaptureTarget(null);
      return;
    }
    const asset = result.assets[0];
    const ext = asset.uri.split(".").pop() ?? "jpg";
    const path = `${userId}/capture-${Date.now()}.${ext}`;
    const resp = await fetch(asset.uri);
    const blob = await resp.blob();
    const { error } = await supabase.storage
      .from("game-photos")
      .upload(path, blob, { contentType: asset.mimeType ?? "image/jpeg" });
    if (!error) {
      await supabase
        .from("tw_mascots")
        .update({
          found_at: new Date().toISOString(),
          finder_user_id: userId,
          finder_name: displayName,
        })
        .eq("id", mascotId);
      await fetchMascots(userId);
      showAlert("🎯 You captured the mascot!");
    }
    setCaptureTarget(null);
  }

  const active = mascots.filter((m) => !m.found_at);
  const found = mascots.filter((m) => m.found_at);

  if (!loading && !userId) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.centered]}>
        <Text style={s.pageTitle}>Mascot Hunt</Text>
        <Text style={[s.muted, { textAlign: "center", marginBottom: 24 }]}>
          Sign in to hide and hunt mascots with friends.
        </Text>
        <Text style={s.muted}>Go to Profile to sign in →</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      {alertMsg && (
        <View pointerEvents="none" style={s.toast}>
          <Text style={s.toastText}>{alertMsg}</Text>
        </View>
      )}

      <Modal
        visible={showRadiusPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRadiusPicker(false)}
      >
        <TouchableOpacity
          style={s.backdrop}
          activeOpacity={1}
          onPress={() => setShowRadiusPicker(false)}
        >
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text
              style={[s.pageTitle, { textAlign: "center", marginBottom: 4 }]}
            >
              Choose play radius
            </Text>
            <Text style={[s.muted, { textAlign: "center", marginBottom: 20 }]}>
              Friends must find your mascot within this distance.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              {([5, 10] as const).map((miles) => (
                <TouchableOpacity
                  key={miles}
                  onPress={() => hideMascot(miles)}
                  style={s.radiusCard}
                >
                  <Text
                    style={{
                      fontSize: 32,
                      fontWeight: "900",
                      color: colors.primary,
                    }}
                  >
                    {miles}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: colors.foreground,
                    }}
                  >
                    miles
                  </Text>
                  <Text style={s.muted}>
                    {miles === 5 ? "≈ 8 km" : "≈ 16 km"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => setShowRadiusPicker(false)}
              style={s.outlineBtn}
            >
              <Text style={s.outlineBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View>
          <Text style={s.pageTitle}>Mascot Hunt</Text>
          {myPos ? (
            <Text style={{ fontSize: 12, color: colors.primary }}>
              📍 GPS active
            </Text>
          ) : posError ? (
            <Text style={{ fontSize: 12, color: colors.destructive }}>
              {posError}
            </Text>
          ) : (
            <Text style={s.muted}>Getting location…</Text>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["hunt", "solo", "leaderboard"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[s.subTab, tab === t && s.subTabActive]}
            >
              <Text style={[s.subTabText, tab === t && s.subTabTextActive]}>
                {t === "hunt" ? "Hunt" : t === "solo" ? "Solo" : "Board"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── HUNT ─────────────────────────────────────────────────────────── */}
        {tab === "hunt" && (
          <>
            <TouchableOpacity
              onPress={() => setShowRadiusPicker(true)}
              disabled={uploading || !myPos}
              style={[s.primaryBtn, { opacity: uploading || !myPos ? 0.5 : 1 }]}
            >
              <Camera color="#fff" size={18} />
              <Text style={s.primaryBtnText}>
                {uploading ? "Saving…" : "Hide Mascot Here"}
              </Text>
            </TouchableOpacity>

            <Text style={s.sectionLabel}>Active ({active.length})</Text>

            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : active.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.muted}>
                  No mascots hidden yet — be the first!
                </Text>
              </View>
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
                const isOwn = m.hider_user_id === userId;
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

                return (
                  <View
                    key={m.id}
                    style={[s.mascotCard, canCapture && s.mascotCardActive]}
                  >
                    <View style={{ width: "100%", aspectRatio: 1 }}>
                      <Image
                        source={{ uri: url }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                      {!isOwn && (
                        <TileOverlay mascotId={m.id} revealed={prog.revealed} />
                      )}
                      <View style={s.badgeRight}>
                        <Text style={s.badgeText}>
                          {prog.revealed}/{TOTAL_TILES} tiles
                        </Text>
                      </View>
                      {isOwn && (
                        <View style={s.badgeLeft}>
                          <Text style={s.badgeText}>Your mascot</Text>
                        </View>
                      )}
                      {m.radius_miles && (
                        <View style={[s.badgeLeft, isOwn && { top: 36 }]}>
                          <Text style={s.badgeText}>
                            📍 {m.radius_miles} mi
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={s.mascotInfo}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: colors.foreground,
                            }}
                          >
                            {m.hider_name}
                          </Text>
                          <Text style={s.muted}>
                            {elapsed(m.hidden_at)} ago
                          </Text>
                        </View>
                        {dist !== null && (
                          <View style={{ alignItems: "flex-end" }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: colors.primary,
                              }}
                            >
                              {prog.revealed === 0 ? "???" : formatDist(dist)}
                            </Text>
                            {dir !== null && prog.revealed >= 6 && (
                              <Text style={{ fontSize: 20 }}>
                                {bearingArrow(dir)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>

                      {!isOwn && (
                        <View style={{ gap: 6 }}>
                          <View style={s.progressBar}>
                            <View
                              style={[
                                s.progressFill,
                                {
                                  width: `${(prog.metersSinceTile / TILE_WALK_METERS) * 100}%`,
                                },
                              ]}
                            />
                          </View>
                          {canCapture ? (
                            <TouchableOpacity
                              onPress={() => captureMascot(m.id)}
                              disabled={captureTarget === m.id}
                              style={[
                                s.primaryBtn,
                                { opacity: captureTarget === m.id ? 0.6 : 1 },
                              ]}
                            >
                              <Camera color="#fff" size={16} />
                              <Text style={s.primaryBtnText}>
                                {captureTarget === m.id
                                  ? "Uploading…"
                                  : "📸 Capture Mascot!"}
                              </Text>
                            </TouchableOpacity>
                          ) : close && tilesLeft > 0 ? (
                            <Text style={[s.muted, { textAlign: "center" }]}>
                              You're close! Reveal {tilesLeft} more tile
                              {tilesLeft !== 1 ? "s" : ""}
                            </Text>
                          ) : !close ? (
                            <Text style={[s.muted, { textAlign: "center" }]}>
                              Walk closer — need to be within {CAPTURE_RADIUS}m
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {found.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Found ({found.length})</Text>
                {found.map((m) => {
                  const url = supabase.storage
                    .from("game-photos")
                    .getPublicUrl(m.photo_path).data.publicUrl;
                  const ms =
                    new Date(m.found_at ?? "").getTime() -
                    new Date(m.hidden_at).getTime();
                  return (
                    <View key={m.id} style={s.foundCard}>
                      <Image
                        source={{ uri: url }}
                        style={{ width: 64, height: 64 }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, padding: 12 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.foreground,
                          }}
                        >
                          {m.hider_name}'s mascot
                        </Text>
                        <Text style={s.muted}>
                          Survived {survivalStr(ms)} · Found by {m.finder_name}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* ── SOLO ─────────────────────────────────────────────────────────── */}
        {tab === "solo" && (
          <>
            <View style={s.card}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={s.sectionLabel}>Today's walk</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "900",
                      color: colors.foreground,
                    }}
                  >
                    {(soloTotalWalked / MILES_TO_METERS).toFixed(2)}
                    <Text
                      style={{ fontSize: 14, color: colors.mutedForeground }}
                    >
                      {" "}
                      mi
                    </Text>
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.sectionLabel}>Tiles</Text>
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "900",
                      color: colors.foreground,
                    }}
                  >
                    {soloTiles}
                    <Text
                      style={{ fontSize: 14, color: colors.mutedForeground }}
                    >
                      /{TOTAL_TILES}
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={[s.progressBar, { marginTop: 12 }]}>
                <View
                  style={[
                    s.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(soloMetersSince / TILE_WALK_SOLO) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[s.muted, { marginTop: 4 }]}>
                {((TILE_WALK_SOLO - soloMetersSince) / MILES_TO_METERS).toFixed(
                  2,
                )}{" "}
                mi to next tile
              </Text>
            </View>
            <View style={s.emptyState}>
              <Text style={[s.muted, { textAlign: "center" }]}>
                Walk to earn tiles and unlock clues. Solo mascot place discovery
                is available on the web app.
              </Text>
            </View>
          </>
        )}

        {/* ── LEADERBOARD ──────────────────────────────────────────────────── */}
        {tab === "leaderboard" &&
          (leaderboard.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.muted}>No data yet — start hiding mascots!</Text>
            </View>
          ) : (
            <View style={[s.card, { padding: 0, overflow: "hidden" }]}>
              <View style={[s.tableRow, { backgroundColor: colors.muted }]}>
                <Text style={[s.th, { width: 32 }]}>#</Text>
                <Text style={[s.th, { flex: 1 }]}>Player</Text>
                <Text style={[s.th, { width: 48, textAlign: "center" }]}>
                  Found
                </Text>
                <Text style={[s.th, { width: 52, textAlign: "center" }]}>
                  Hidden
                </Text>
                <Text style={[s.th, { width: 60, textAlign: "right" }]}>
                  Survival
                </Text>
              </View>
              {leaderboard.map((row, i) => (
                <View
                  key={row.name}
                  style={[
                    s.tableRow,
                    i > 0 && {
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    },
                    i === 0 && { backgroundColor: "#fffbeb" },
                  ]}
                >
                  <Text
                    style={[s.td, { width: 32, color: colors.mutedForeground }]}
                  >
                    {i === 0
                      ? "🥇"
                      : i === 1
                        ? "🥈"
                        : i === 2
                          ? "🥉"
                          : `${i + 1}`}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      { flex: 1, fontWeight: "500", color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {row.name}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      {
                        width: 48,
                        textAlign: "center",
                        color: colors.mutedForeground,
                      },
                    ]}
                  >
                    {row.found}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      {
                        width: 52,
                        textAlign: "center",
                        color: colors.mutedForeground,
                      },
                    ]}
                  >
                    {row.hidden}
                  </Text>
                  <Text
                    style={[
                      s.td,
                      { width: 60, textAlign: "right", color: colors.primary },
                    ]}
                  >
                    {row.survivalMs > 0 ? survivalStr(row.survivalMs) : "—"}
                  </Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  primaryBtn: {
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: "#fff",
  },
  outlineBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  emptyState: {
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
  },
  toast: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: "center",
  },
  toastText: {
    backgroundColor: colors.foreground,
    color: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 99,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  radiusCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  subTab: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 9,
    alignItems: "center",
  },
  subTabActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: colors.mutedForeground,
  },
  subTabTextActive: { color: "#fff" },
  mascotCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    overflow: "hidden",
  },
  mascotCardActive: { borderColor: colors.primary },
  mascotInfo: { padding: 14, gap: 8 },
  badgeRight: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.foreground,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  foundCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    overflow: "hidden",
    opacity: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  th: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.mutedForeground,
    textTransform: "uppercase",
  },
  td: { fontSize: 14, fontWeight: "500", color: colors.foreground },
});
