import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Camera } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";

// ── Constants ─────────────────────────────────────────────────────────────────

const CAPTURE_RADIUS = 100;
const TILE_IDS = Array.from({ length: 9 }, (_, i) => `tile-${i}`);
const TILE_REVEAL_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#10b981",
];
const TILE_WALK_METERS = 300;
const TILE_WALK_SOLO = 1609.34;
const AUTO_TILE_MS = 5 * 60 * 1000;
const TOTAL_TILES = 9;
const MIN_TILES_CAPTURE = 3;
const MILES_TO_METERS = 1609.34;
const TILE_SIZE = (Dimensions.get("window").width - 32) / 3;

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

type HuntGroup = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
};

type HuntMember = {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
};

type HuntInvite = {
  id: string;
  group_id: string;
  from_display_name: string;
  group_name: string;
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

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
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

// ── MascotTileFlip ────────────────────────────────────────────────────────────

function MascotTileFlip({
  row,
  col,
  gridPos,
  photoUrl,
  revealed,
}: {
  row: number;
  col: number;
  gridPos: number;
  photoUrl: string;
  revealed: boolean;
}) {
  const [face, setFace] = useState<"covered" | "revealed">(
    revealed ? "revealed" : "covered",
  );
  const scaleX = useRef(new Animated.Value(1)).current;
  const prevRevealedRef = useRef(revealed);

  useEffect(() => {
    if (revealed && !prevRevealedRef.current) {
      prevRevealedRef.current = true;
      Animated.sequence([
        Animated.delay(gridPos * 60),
        Animated.timing(scaleX, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFace("revealed");
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [revealed, gridPos, scaleX]);

  return (
    <Animated.View
      style={{
        width: TILE_SIZE,
        height: TILE_SIZE,
        overflow: "hidden",
        transform: [{ scaleX }],
      }}
    >
      {face === "covered" ? (
        <View style={s.tileFlipCovered}>
          <Text style={s.tileFlipQuestion}>?</Text>
        </View>
      ) : (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: TILE_SIZE * 3,
            height: TILE_SIZE * 3,
            marginLeft: -col * TILE_SIZE,
            marginTop: -row * TILE_SIZE,
          }}
          resizeMode="cover"
        />
      )}
    </Animated.View>
  );
}

// ── MascotTileGrid ────────────────────────────────────────────────────────────

function MascotTileGrid({
  mascotId,
  photoUrl,
  revealed,
}: {
  mascotId: string;
  photoUrl: string;
  revealed: number;
}) {
  const order = useMemo(() => makeTileOrder(mascotId), [mascotId]);
  const revealedSet = useMemo(
    () => new Set(order.slice(0, revealed)),
    [order, revealed],
  );

  return (
    <View style={{ width: "100%", aspectRatio: 1 }}>
      {[0, 3, 6].map((rowStart) => (
        <View key={rowStart} style={{ flexDirection: "row" }}>
          {[rowStart, rowStart + 1, rowStart + 2].map((gridPos) => (
            <MascotTileFlip
              key={TILE_IDS[gridPos]}
              row={Math.floor(gridPos / 3)}
              col={gridPos % 3}
              gridPos={gridPos}
              photoUrl={photoUrl}
              revealed={revealedSet.has(gridPos)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── SoloTile ──────────────────────────────────────────────────────────────────

function SoloTile({ index, revealed }: { index: number; revealed: boolean }) {
  const [face, setFace] = useState<"covered" | "revealed">(
    revealed ? "revealed" : "covered",
  );
  const scaleX = useRef(new Animated.Value(1)).current;
  const prevRevealedRef = useRef(revealed);

  useEffect(() => {
    if (revealed && !prevRevealedRef.current) {
      prevRevealedRef.current = true;
      Animated.sequence([
        Animated.delay(index * 80),
        Animated.timing(scaleX, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFace("revealed");
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [revealed, index, scaleX]);

  return (
    <Animated.View
      style={[
        s.soloTile,
        face === "revealed" && {
          backgroundColor: TILE_REVEAL_COLORS[index],
          borderColor: TILE_REVEAL_COLORS[index],
        },
        { transform: [{ scaleX }] },
      ]}
    >
      {face === "covered" ? (
        <Text style={s.soloTileCovered}>?</Text>
      ) : (
        <Text style={{ fontSize: 26 }}>⭐</Text>
      )}
    </Animated.View>
  );
}

// ── MascotCard ────────────────────────────────────────────────────────────────

function MascotCard({
  mascot,
  myPos,
  userId,
  prog,
  captureTarget,
  onCapture,
}: {
  mascot: Mascot;
  myPos: Pos | null;
  userId: string;
  prog: TileProgress;
  captureTarget: string | null;
  onCapture: (id: string) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    Location.reverseGeocodeAsync({
      latitude: mascot.lat,
      longitude: mascot.lng,
    })
      .then((results) => {
        const r = results[0];
        if (!r) return;
        const parts = [r.streetNumber, r.street, r.city].filter(Boolean);
        setAddress(parts.join(", ") || null);
      })
      .catch(() => {});
  }, [mascot.lat, mascot.lng]);

  const url = supabase.storage
    .from("game-photos")
    .getPublicUrl(mascot.photo_path).data.publicUrl;
  const dist = myPos
    ? haversineDistance(myPos.lat, myPos.lng, mascot.lat, mascot.lng)
    : null;
  const dir = myPos
    ? bearing(myPos.lat, myPos.lng, mascot.lat, mascot.lng)
    : null;
  const close = dist !== null && dist <= CAPTURE_RADIUS;
  const isOwn = mascot.hider_user_id === userId;
  const canCapture = close && !isOwn && prog.revealed >= MIN_TILES_CAPTURE;
  const tilesLeft = Math.max(0, MIN_TILES_CAPTURE - prog.revealed);
  const addressClue = !isOwn && address && prog.revealed >= 3 ? address : null;

  return (
    <View style={[s.mascotCard, canCapture && s.mascotCardActive]}>
      <View>
        <MascotTileGrid
          mascotId={mascot.id}
          photoUrl={url}
          revealed={isOwn ? TOTAL_TILES : prog.revealed}
        />
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
        {mascot.radius_miles && (
          <View style={[s.badgeLeft, isOwn && { top: 36 }]}>
            <Text style={s.badgeText}>📍 {mascot.radius_miles} mi</Text>
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
              {mascot.hider_name}
            </Text>
            <Text style={s.muted}>{elapsed(mascot.hidden_at)} ago</Text>
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
                <Text style={{ fontSize: 20 }}>{bearingArrow(dir)}</Text>
              )}
            </View>
          )}
        </View>

        {addressClue && (
          <View style={s.addressClue}>
            <Text style={s.addressClueIcon}>📍</Text>
            <Text style={s.addressClueText}>{addressClue}</Text>
          </View>
        )}

        {!isOwn && (
          <View style={{ gap: 8 }}>
            <View style={s.tileDots}>
              {TILE_IDS.map((id, i) => (
                <View
                  key={id}
                  style={[
                    s.tileDot,
                    i < prog.revealed && s.tileDotFilled,
                    i === MIN_TILES_CAPTURE - 1 &&
                      i >= prog.revealed &&
                      s.tileDotThreshold,
                  ]}
                />
              ))}
            </View>
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
                onPress={() => onCapture(mascot.id)}
                disabled={captureTarget === mascot.id}
                style={[
                  s.primaryBtn,
                  s.captureBtn,
                  { opacity: captureTarget === mascot.id ? 0.6 : 1 },
                ]}
              >
                <Camera color="#fff" size={16} />
                <Text style={s.primaryBtnText}>
                  {captureTarget === mascot.id
                    ? "Uploading…"
                    : "📸 Capture Mascot!"}
                </Text>
              </TouchableOpacity>
            ) : close && tilesLeft > 0 ? (
              <Text style={[s.muted, { textAlign: "center" }]}>
                You're close! {tilesLeft} more tile
                {tilesLeft !== 1 ? "s" : ""} to unlock capture
              </Text>
            ) : !close ? (
              <Text style={[s.muted, { textAlign: "center" }]}>
                Walk within {CAPTURE_RADIUS}m to capture
              </Text>
            ) : null}
          </View>
        )}
      </View>
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
  const [celebrationMascot, setCelebrationMascot] = useState<Mascot | null>(
    null,
  );
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [soloTotalWalked, setSoloTotalWalked] = useState(0);
  const [soloTiles, setSoloTiles] = useState(0);
  const [soloMetersSince, setSoloMetersSince] = useState(0);
  const [huntGroup, setHuntGroup] = useState<HuntGroup | null>(null);
  const [huntMembers, setHuntMembers] = useState<HuntMember[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<
    "create" | "join" | "invite"
  >("create");
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<HuntInvite[]>([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const prevPosRef = useRef<Pos | null>(null);
  const mascotsRef = useRef<Mascot[]>([]);
  const userIdRef = useRef<string | null>(null);
  const progressRef = useRef<Record<string, TileProgress>>({});
  const huntGroupRef = useRef<HuntGroup | null>(null);

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
    void loadInvites(session.user.id);
    const group = await loadHuntGroup(session.user.id);
    await fetchMascots(session.user.id, group);
  }

  async function loadHuntGroup(uid: string): Promise<HuntGroup | null> {
    const { data: member } = await supabase
      .from("tw_hunt_members")
      .select("group_id")
      .eq("user_id", uid)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!member) return null;
    const { data: group } = await supabase
      .from("tw_hunt_groups")
      .select("*")
      .eq("id", member.group_id)
      .maybeSingle();
    if (group) {
      const g = group as HuntGroup;
      setHuntGroup(g);
      huntGroupRef.current = g;
      void loadMembers(member.group_id);
      return g;
    }
    return null;
  }

  async function loadMembers(groupId: string) {
    const { data } = await supabase
      .from("tw_hunt_members")
      .select("*")
      .eq("group_id", groupId)
      .order("joined_at");
    if (data) setHuntMembers(data as HuntMember[]);
  }

  async function createGroup() {
    if (!userId || !groupName.trim()) return;
    setGroupLoading(true);
    const invite_code = generateInviteCode();
    const { data: group, error: ge } = await supabase
      .from("tw_hunt_groups")
      .insert({ name: groupName.trim(), invite_code, created_by: userId })
      .select()
      .single();
    if (ge || !group) {
      Alert.alert("Error", ge?.message ?? "Failed to create group.");
      setGroupLoading(false);
      return;
    }
    const { error: me } = await supabase.from("tw_hunt_members").insert({
      group_id: group.id,
      user_id: userId,
      display_name: displayName,
    });
    if (me) {
      Alert.alert("Error", me.message);
      setGroupLoading(false);
      return;
    }
    const g = group as HuntGroup;
    setHuntGroup(g);
    huntGroupRef.current = g;
    setHuntMembers([
      {
        id: "",
        group_id: group.id,
        user_id: userId,
        display_name: displayName,
        joined_at: new Date().toISOString(),
      },
    ]);
    setGroupName("");
    setShowGroupModal(false);
    setGroupLoading(false);
    await fetchMascots(userId, g);
  }

  async function joinGroup() {
    if (!userId || !joinCode.trim()) return;
    setGroupLoading(true);
    const code = joinCode.trim().toUpperCase();
    const { data: group } = await supabase
      .from("tw_hunt_groups")
      .select("*")
      .eq("invite_code", code)
      .maybeSingle();
    if (!group) {
      Alert.alert("Invalid code", "No group found with that invite code.");
      setGroupLoading(false);
      return;
    }
    const { error: me } = await supabase
      .from("tw_hunt_members")
      .upsert(
        { group_id: group.id, user_id: userId, display_name: displayName },
        { onConflict: "group_id,user_id" },
      );
    if (me) {
      Alert.alert("Error", me.message);
      setGroupLoading(false);
      return;
    }
    const g = group as HuntGroup;
    setHuntGroup(g);
    huntGroupRef.current = g;
    await loadMembers(group.id);
    setJoinCode("");
    setShowGroupModal(false);
    setGroupLoading(false);
    await fetchMascots(userId, g);
  }

  function leaveGroup() {
    if (!huntGroup || !userId) return;
    Alert.alert(
      "Leave group?",
      `You'll leave "${huntGroup.name}". You can rejoin with the invite code.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await supabase
              .from("tw_hunt_members")
              .delete()
              .eq("group_id", huntGroup.id)
              .eq("user_id", userId);
            setHuntGroup(null);
            huntGroupRef.current = null;
            setHuntMembers([]);
            setMascots([]);
          },
        },
      ],
    );
  }

  async function loadInvites(uid: string) {
    const { data } = await supabase
      .from("tw_invites")
      .select("id, group_id, from_display_name, group_name")
      .eq("to_user_id", uid);
    if (data) setPendingInvites(data as HuntInvite[]);
  }

  async function acceptInvite(invite: HuntInvite) {
    if (!userId) return;
    if (huntGroupRef.current) {
      await supabase
        .from("tw_hunt_members")
        .delete()
        .eq("group_id", huntGroupRef.current.id)
        .eq("user_id", userId);
      setHuntGroup(null);
      huntGroupRef.current = null;
      setHuntMembers([]);
      setMascots([]);
    }
    const { error } = await supabase.from("tw_hunt_members").upsert(
      {
        group_id: invite.group_id,
        user_id: userId,
        display_name: displayName,
      },
      { onConflict: "group_id,user_id" },
    );
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    await supabase.from("tw_invites").delete().eq("id", invite.id);
    setPendingInvites((prev) => prev.filter((i) => i.id !== invite.id));
    const group = await loadHuntGroup(userId);
    await fetchMascots(userId, group);
  }

  async function declineInvite(inviteId: string) {
    await supabase.from("tw_invites").delete().eq("id", inviteId);
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  async function sendInvite() {
    if (!huntGroup || !userId || !inviteUsername.trim()) return;
    setInviteLoading(true);
    const username = inviteUsername.trim().toLowerCase();
    if (username === displayName.toLowerCase()) {
      Alert.alert("That's you!", "You can't invite yourself.");
      setInviteLoading(false);
      return;
    }
    const { data: target } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (!target) {
      Alert.alert("Not found", `No account with username "${username}".`);
      setInviteLoading(false);
      return;
    }
    const alreadyMember = huntMembers.some((m) => m.user_id === target.id);
    if (alreadyMember) {
      Alert.alert("Already in group", "That person is already in your group.");
      setInviteLoading(false);
      return;
    }
    const { error } = await supabase.from("tw_invites").upsert(
      {
        group_id: huntGroup.id,
        from_user_id: userId,
        from_display_name: displayName,
        group_name: huntGroup.name,
        to_user_id: target.id,
      },
      { onConflict: "group_id,to_user_id" },
    );
    if (error) {
      Alert.alert("Error", error.message);
      setInviteLoading(false);
      return;
    }
    setInviteUsername("");
    setShowGroupModal(false);
    Alert.alert(
      "Invite sent!",
      `${inviteUsername} will see it in their Hunt tab.`,
    );
    setInviteLoading(false);
  }

  async function fetchMascots(uid: string, group: HuntGroup | null) {
    if (!group) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("tw_mascots")
      .select("*")
      .eq("hunt_group_id", group.id)
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
    if (!myPos || !userId || !huntGroupRef.current) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      if (!asset.base64) return;
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      const path = `${userId}/mascot-${Date.now()}.${ext}`;
      const binaryString = atob(asset.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const { error } = await supabase.storage
        .from("game-photos")
        .upload(path, bytes, { contentType: asset.mimeType ?? "image/jpeg" });
      if (error) {
        Alert.alert("Upload failed", error.message);
        return;
      }
      await supabase.from("tw_mascots").insert({
        hunt_group_id: huntGroupRef.current.id,
        hider_user_id: userId,
        hider_name: displayName,
        photo_path: path,
        lat: myPos.lat,
        lng: myPos.lng,
        radius_miles: radius,
        center_lat: myPos.lat,
        center_lng: myPos.lng,
      });
      await fetchMascots(userId, huntGroupRef.current);
      showAlert(`📍 Mascot hidden! Friends search within ${radius} miles.`);
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
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) {
      setCaptureTarget(null);
      return;
    }
    const asset = result.assets[0];
    if (!asset.base64) {
      setCaptureTarget(null);
      return;
    }
    const ext = asset.mimeType?.split("/")[1] ?? "jpg";
    const path = `${userId}/capture-${Date.now()}.${ext}`;
    const binaryString = atob(asset.base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const { error } = await supabase.storage
      .from("game-photos")
      .upload(path, bytes, { contentType: asset.mimeType ?? "image/jpeg" });
    if (error) {
      Alert.alert("Upload failed", error.message);
      setCaptureTarget(null);
      return;
    }
    const foundAt = new Date().toISOString();
    const captured = mascotsRef.current.find((m) => m.id === mascotId) ?? null;
    await supabase
      .from("tw_mascots")
      .update({
        found_at: foundAt,
        finder_user_id: userId,
        finder_name: displayName,
      })
      .eq("id", mascotId);
    await fetchMascots(userId, huntGroupRef.current);
    if (captured) setCelebrationMascot({ ...captured, found_at: foundAt });
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

      {/* ── Capture celebration ─────────────────────────────────────────── */}
      <Modal
        visible={!!celebrationMascot}
        transparent
        animationType="fade"
        onRequestClose={() => setCelebrationMascot(null)}
      >
        <View style={s.celebOverlay}>
          <View style={s.celebCard}>
            <Text style={{ fontSize: 56 }}>🎯</Text>
            <Text style={s.celebTitle}>Mascot Captured!</Text>
            {celebrationMascot && (
              <>
                <Image
                  source={{
                    uri: supabase.storage
                      .from("game-photos")
                      .getPublicUrl(celebrationMascot.photo_path).data
                      .publicUrl,
                  }}
                  style={s.celebPhoto}
                  resizeMode="cover"
                />
                <Text style={s.celebHider}>
                  Hidden by {celebrationMascot.hider_name}
                </Text>
                <Text style={s.celebSurvival}>
                  Survived{" "}
                  {survivalStr(
                    new Date(celebrationMascot.found_at ?? "").getTime() -
                      new Date(celebrationMascot.hidden_at).getTime(),
                  )}
                </Text>
              </>
            )}
            <TouchableOpacity
              onPress={() => setCelebrationMascot(null)}
              style={s.celebBtn}
            >
              <Text style={s.celebBtnText}>Awesome! 🎉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {/* ── Group modal ─────────────────────────────────────────────────────── */}
      <Modal
        visible={showGroupModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGroupModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={s.backdrop}
            activeOpacity={1}
            onPress={() => setShowGroupModal(false)}
          >
            <View style={s.sheet}>
              <View style={s.sheetHandle} />

              {groupModalMode === "create" && (
                <>
                  <Text
                    style={[
                      s.pageTitle,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    Create Group
                  </Text>
                  <Text
                    style={[s.muted, { textAlign: "center", marginBottom: 16 }]}
                  >
                    Give your hunt group a name. You'll get an invite code to
                    share with friends.
                  </Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="Group name (e.g. Weekend Crew)"
                    placeholderTextColor={colors.mutedForeground}
                    value={groupName}
                    onChangeText={setGroupName}
                    maxLength={30}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={createGroup}
                  />
                  <TouchableOpacity
                    onPress={createGroup}
                    disabled={!groupName.trim() || groupLoading}
                    style={[
                      s.primaryBtn,
                      {
                        opacity: !groupName.trim() || groupLoading ? 0.5 : 1,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>
                      {groupLoading ? "Creating…" : "Create Group"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGroupModalMode("join")}
                    style={s.outlineBtn}
                  >
                    <Text style={s.outlineBtnText}>
                      Have a code? Join instead
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {groupModalMode === "join" && (
                <>
                  <Text
                    style={[
                      s.pageTitle,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    Join Group
                  </Text>
                  <Text
                    style={[s.muted, { textAlign: "center", marginBottom: 16 }]}
                  >
                    Enter the 6-character invite code from your friend.
                  </Text>
                  <TextInput
                    style={[
                      s.textInput,
                      { letterSpacing: 8, textAlign: "center", fontSize: 24 },
                    ]}
                    placeholder="ABCDEF"
                    placeholderTextColor={colors.mutedForeground}
                    value={joinCode}
                    onChangeText={(t) => setJoinCode(t.toUpperCase())}
                    maxLength={6}
                    autoCapitalize="characters"
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={joinGroup}
                  />
                  <TouchableOpacity
                    onPress={joinGroup}
                    disabled={joinCode.length < 6 || groupLoading}
                    style={[
                      s.primaryBtn,
                      {
                        opacity: joinCode.length < 6 || groupLoading ? 0.5 : 1,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>
                      {groupLoading ? "Joining…" : "Join Group"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setGroupModalMode("create")}
                    style={s.outlineBtn}
                  >
                    <Text style={s.outlineBtnText}>
                      Create a new group instead
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {groupModalMode === "invite" && huntGroup && (
                <>
                  <Text
                    style={[
                      s.pageTitle,
                      { textAlign: "center", marginBottom: 4 },
                    ]}
                  >
                    Invite to {huntGroup.name}
                  </Text>
                  <Text
                    style={[s.muted, { textAlign: "center", marginBottom: 16 }]}
                  >
                    Enter a friend's username and they'll see the invite in
                    their Hunt tab.
                  </Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="username"
                    placeholderTextColor={colors.mutedForeground}
                    value={inviteUsername}
                    onChangeText={setInviteUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                    returnKeyType="send"
                    onSubmitEditing={sendInvite}
                  />
                  <TouchableOpacity
                    onPress={sendInvite}
                    disabled={!inviteUsername.trim() || inviteLoading}
                    style={[
                      s.primaryBtn,
                      {
                        opacity:
                          !inviteUsername.trim() || inviteLoading ? 0.5 : 1,
                        marginTop: 8,
                      },
                    ]}
                  >
                    <Text style={s.primaryBtnText}>
                      {inviteLoading ? "Sending…" : "Send Invite"}
                    </Text>
                  </TouchableOpacity>
                  <Text
                    style={[s.muted, { textAlign: "center", marginTop: 12 }]}
                  >
                    Or share the code manually:{" "}
                    <Text
                      style={{ fontWeight: "800", color: colors.foreground }}
                    >
                      {huntGroup.invite_code}
                    </Text>
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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

        {tab === "hunt" &&
          pendingInvites.map((invite) => (
            <View key={invite.id} style={s.inviteCard}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: colors.foreground,
                  }}
                >
                  {invite.from_display_name} invited you
                </Text>
                <Text style={s.muted}>{invite.group_name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => acceptInvite(invite)}
                style={s.acceptBtn}
              >
                <Text style={s.acceptBtnText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => declineInvite(invite.id)}>
                <Text style={{ fontSize: 18, color: colors.mutedForeground }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          ))}

        {tab === "hunt" &&
          (!huntGroup ? (
            <>
              <TouchableOpacity
                onPress={() => {
                  setGroupModalMode("create");
                  setShowGroupModal(true);
                }}
                style={s.primaryBtn}
              >
                <Text style={s.primaryBtnText}>Create Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setGroupModalMode("join");
                  setShowGroupModal(true);
                }}
                style={s.outlineBtn}
              >
                <Text style={s.outlineBtnText}>Join with Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Group header */}
              <View style={s.groupHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.groupName}>{huntGroup.name}</Text>
                  <Text style={s.muted}>
                    {huntMembers.length} member
                    {huntMembers.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setGroupModalMode("invite");
                    setShowGroupModal(true);
                  }}
                  style={s.codeChip}
                >
                  <Text style={s.codeChipText}>+ Invite</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={leaveGroup} style={s.leaveBtn}>
                  <Text style={s.leaveBtnText}>Leave</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => setShowRadiusPicker(true)}
                disabled={uploading || !myPos}
                style={[
                  s.primaryBtn,
                  { opacity: uploading || !myPos ? 0.5 : 1 },
                ]}
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
                active.map((m) => (
                  <MascotCard
                    key={m.id}
                    mascot={m}
                    myPos={myPos}
                    userId={userId ?? ""}
                    prog={
                      progress[m.id] ?? {
                        revealed: 0,
                        metersSinceTile: 0,
                        totalWalked: 0,
                        lastAutoMs: 0,
                      }
                    }
                    captureTarget={captureTarget}
                    onCapture={captureMascot}
                  />
                ))
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
                            Survived {survivalStr(ms)} · Found by{" "}
                            {m.finder_name}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          ))}

        {/* ── SOLO ─────────────────────────────────────────────────────────── */}
        {tab === "solo" && (
          <>
            {/* Next-tile progress */}
            <View style={s.soloProgressCard}>
              <View style={s.soloProgressHeader}>
                <Text style={s.sectionLabel}>Next tile</Text>
                <Text style={s.soloProgressLabel}>
                  {(
                    (TILE_WALK_SOLO - soloMetersSince) /
                    MILES_TO_METERS
                  ).toFixed(2)}{" "}
                  mi to go
                </Text>
              </View>
              <View style={s.soloProgressTrack}>
                <View
                  style={[
                    s.soloProgressFill,
                    {
                      width: `${Math.min(100, (soloMetersSince / TILE_WALK_SOLO) * 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* 3×3 tile grid */}
            <View style={s.soloGrid}>
              {[0, 3, 6].map((rowStart) => (
                <View key={rowStart} style={s.soloRow}>
                  {[rowStart, rowStart + 1, rowStart + 2].map((i) => (
                    <SoloTile
                      key={TILE_IDS[i]}
                      index={i}
                      revealed={i < soloTiles}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Stats */}
            <View
              style={[
                s.card,
                { flexDirection: "row", padding: 0, overflow: "hidden" },
              ]}
            >
              <View style={s.soloStat}>
                <Text style={s.sectionLabel}>Walked today</Text>
                <Text style={s.soloStatValue}>
                  {(soloTotalWalked / MILES_TO_METERS).toFixed(2)}
                  <Text style={s.soloStatUnit}> mi</Text>
                </Text>
              </View>
              <View style={s.soloStatDivider} />
              <View style={s.soloStat}>
                <Text style={s.sectionLabel}>Tiles earned</Text>
                <Text style={s.soloStatValue}>
                  {soloTiles}
                  <Text style={s.soloStatUnit}>/{TOTAL_TILES}</Text>
                </Text>
              </View>
            </View>

            {soloTiles < TOTAL_TILES && (
              <View style={s.emptyState}>
                <Text style={[s.muted, { textAlign: "center" }]}>
                  Walk 1 mile to flip a tile. All 9 tiles unlocked = full board
                  cleared!
                </Text>
              </View>
            )}
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
  tileDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  tileDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  tileDotFilled: {
    backgroundColor: colors.primary,
  },
  tileDotThreshold: {
    backgroundColor: colors.border,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  captureBtn: {
    backgroundColor: "#16a34a",
  },
  tileFlipCovered: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: "rgba(28,25,23,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileFlipQuestion: {
    fontSize: 22,
    fontWeight: "900",
    color: "rgba(255,255,255,0.3)",
  },
  addressClue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.muted,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  addressClueIcon: { fontSize: 13 },
  addressClueText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    flex: 1,
  },
  inviteCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  groupHeader: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: colors.foreground,
  },
  codeChip: {
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  codeChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },
  leaveBtn: {
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.destructive,
  },
  textInput: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.muted,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  celebOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  celebCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 360,
  },
  celebTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: colors.foreground,
  },
  celebPhoto: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginVertical: 4,
  },
  celebHider: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  celebSurvival: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  celebBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#16a34a",
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  celebBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.2,
  },
  soloProgressCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  soloProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  soloProgressLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  soloProgressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.muted,
    overflow: "hidden",
  },
  soloProgressFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  soloGrid: { gap: 8 },
  soloRow: { flexDirection: "row", gap: 8 },
  soloTile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: colors.muted,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  soloTileCovered: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.mutedForeground,
  },
  soloStat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    gap: 4,
  },
  soloStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  soloStatValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  soloStatUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
});
