import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  Lock,
  RotateCcw,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line } from "react-native-svg";
import { CoachMark, type CoachStep } from "../../components/CoachMark";
import { StarDisplay, StarRatingWidget } from "../../components/Stars";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";
import { WALK_COLORS, type WalkColor } from "../../lib/topics";

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮"];
const DAILY_KEY = "tw_color_v3";
const SLICE_DEG = 360 / WALK_COLORS.length;

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function dotPos(cx: number, cy: number, r: number, deg: number) {
  // 0° = 12 o'clock, clockwise
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type DayPick = {
  date: string;
  colorIdx: number;
  albumId: string | null;
  photoCount: number;
};

type AlbumPhoto = { photo_path: string };
type AlbumReaction = { emoji: string; user_id: string };
type AlbumRating = { user_id: string; score: number };
type Album = {
  id: string;
  user_id: string;
  display_name: string;
  color_name: string;
  color_hex: string;
  created_at: string;
  tw_submissions: AlbumPhoto[];
  tw_album_reactions: AlbumReaction[];
  tw_album_ratings: AlbumRating[];
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WalkScreen() {
  const router = useRouter();
  const { width: sw } = useWindowDimensions();

  const WHEEL = Math.min(sw - 32, 300);
  const WR = Math.floor(WHEEL / 2) - 5;
  const WC = Math.floor(WHEEL / 2);

  const [uid, setUid] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [colorIdx, setColorIdx] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [albumCreated, setAlbumCreated] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [pendingAsset, setPendingAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feed, setFeed] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showWalkTour, setShowWalkTour] = useState(false);
  const wheelRef = useRef<View>(null);
  const spinBtnRef = useRef<View>(null);

  const mascotY = useRef(new Animated.Value(0)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const mascotRotate = useRef(new Animated.Value(0)).current;
  const wheelRot = useRef(new Animated.Value(0)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealTranslate = useRef(new Animated.Value(16)).current;

  const uidRef = useRef<string | null>(null);
  const currentDateRef = useRef<string>("");

  function checkMidnightReset() {
    const d = today();
    if (currentDateRef.current && currentDateRef.current !== d) {
      // Day has changed — clear the pick so the wheel resets
      currentDateRef.current = d;
      setColorIdx(null);
      setRevealed(false);
      setIsLocked(false);
      setAlbumId(null);
      setAlbumCreated(false);
      setPhotoCount(0);
      wheelRot.setValue(0);
      revealOpacity.setValue(0);
      revealTranslate.setValue(16);
      void AsyncStorage.removeItem(DAILY_KEY);
      if (uidRef.current) void fetchFeed(uidRef.current);
    } else {
      currentDateRef.current = d;
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
    void restorePick();
    void initUser();
    currentDateRef.current = today();

    const appStateSub = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (next === "active") checkMidnightReset();
      },
    );
    const midnightInterval = setInterval(checkMidnightReset, 60_000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) void initUser();
      else {
        setUid(null);
        setFeed([]);
        setLoading(false);
      }
    });
    void AsyncStorage.getItem("tw_tour_walk_v1").then((v) => {
      if (!v) setShowWalkTour(true);
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      clearInterval(midnightInterval);
    };
  }, []);

  async function restorePick() {
    try {
      const raw = await AsyncStorage.getItem(DAILY_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as DayPick;
      if (p.date !== today()) return;
      setColorIdx(p.colorIdx);
      setRevealed(true);
      if (p.albumId) {
        setAlbumId(p.albumId);
        setPhotoCount(p.photoCount);
        setIsLocked(true);
      }
      // Snap wheel to landed position (no animation)
      wheelRot.setValue(landingDeg(p.colorIdx) % 360);
      revealOpacity.setValue(1);
      revealTranslate.setValue(0);
    } catch {}
  }

  async function savePick(idx: number, aId: string | null, count: number) {
    await AsyncStorage.setItem(
      DAILY_KEY,
      JSON.stringify({
        date: today(),
        colorIdx: idx,
        albumId: aId,
        photoCount: count,
      }),
    );
  }

  function today() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function landingDeg(idx: number) {
    // Dot i sits at angle i*SLICE_DEG in the wheel frame (0° = top).
    // After a clockwise rotation of θ, the pointer (fixed at top) sees the
    // dot that was at (360 − θ) mod 360.  To see dot i: θ = 360 − i*SLICE_DEG.
    // Add 7 full extra rotations for a satisfying long spin.
    return 7 * 360 + (360 - idx * SLICE_DEG);
  }

  async function initUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const id = session.user.id;
    setUid(id);
    uidRef.current = id;
    const { data } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", id)
      .maybeSingle();
    setDisplayName(data?.username ?? "");
    await fetchFeed(id);
  }

  async function fetchFeed(id: string) {
    const { data: fs } = await supabase
      .from("tw_friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${id},addressee_id.eq.${id}`);
    const friendIds = (fs ?? []).map((f) =>
      f.requester_id === id ? f.addressee_id : f.requester_id,
    );

    const sel =
      "*, tw_submissions(photo_path), tw_album_reactions(*), tw_album_ratings(*)";
    // Rolling 24-hour window: photos disappear from feed exactly 24h after posting
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Own albums — always visible regardless of share status
    const { data: ownData, error: ownErr } = await supabase
      .from("tw_albums")
      .select(sel)
      .eq("user_id", id)
      .gte("created_at", since)
      .order("created_at", { ascending: false });
    if (ownErr) console.warn("fetchFeed own:", ownErr.message);

    // Friends' shared albums (group_id = their uuid)
    let friendData: Album[] = [];
    if (friendIds.length > 0) {
      const { data: fd, error: friendErr } = await supabase
        .from("tw_albums")
        .select(sel)
        .in("group_id", friendIds)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (friendErr) console.warn("fetchFeed friends:", friendErr.message);
      if (fd) friendData = fd as Album[];
    }

    // Merge and de-duplicate (own albums may overlap if shared to feed)
    const seen = new Set<string>();
    const all: Album[] = [];
    for (const a of [...(ownData ?? []), ...friendData]) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        all.push(a as Album);
      }
    }
    all.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setFeed(all);
    setLoading(false);
    setRefreshing(false);
  }

  async function onRefresh() {
    if (!uidRef.current) return;
    setRefreshing(true);
    await fetchFeed(uidRef.current);
  }

  // ── Animations ──────────────────────────────────────────────────────────────

  function mascotPush() {
    mascotRotate.setValue(0);
    mascotScale.setValue(1);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(mascotRotate, {
          toValue: -0.18,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mascotScale, {
          toValue: 1.15,
          duration: 160,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(mascotRotate, {
          toValue: 0,
          friction: 4,
          tension: 180,
          useNativeDriver: true,
        }),
        Animated.spring(mascotScale, {
          toValue: 1,
          friction: 4,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function mascotCelebrate() {
    mascotY.setValue(0);
    mascotScale.setValue(1);
    Animated.sequence([
      Animated.timing(mascotY, {
        toValue: -30,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(mascotY, {
        toValue: 4,
        duration: 120,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(mascotY, {
        toValue: 0,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }

  function showReveal() {
    revealOpacity.setValue(0);
    revealTranslate.setValue(20);
    Animated.parallel([
      Animated.timing(revealOpacity, {
        toValue: 1,
        duration: 340,
        useNativeDriver: true,
      }),
      Animated.spring(revealTranslate, {
        toValue: 0,
        friction: 6,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ── Spin ─────────────────────────────────────────────────────────────────────

  function spin() {
    if (isSpinning || revealed) return;
    const idx = Math.floor(Math.random() * WALK_COLORS.length);
    mascotPush();
    setTimeout(() => {
      setIsSpinning(true);
      Animated.timing(wheelRot, {
        toValue: landingDeg(idx),
        duration: 3800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setColorIdx(idx);
        setRevealed(true);
        void savePick(idx, null, 0);
        showReveal();
        mascotCelebrate();
      });
    }, 80);
  }

  async function startWalk() {
    if (colorIdx === null) return;
    const aId = uuid();
    setAlbumId(aId);
    setIsLocked(true);
    setAlbumCreated(false);
    setPhotoCount(0);
    await savePick(colorIdx, aId, 0);
  }

  async function ensureAlbum(aId: string, color: WalkColor): Promise<boolean> {
    if (albumCreated) return true;
    if (!uid) return false;
    const { error } = await supabase.from("tw_albums").insert({
      id: aId,
      user_id: uid,
      display_name: displayName,
      color_name: color.name,
      color_hex: color.hex,
      group_id: null,
    });
    if (error && error.code !== "23505") {
      Alert.alert("Error", error.message);
      return false;
    }
    setAlbumCreated(true);
    return true;
  }

  async function takePhoto() {
    if (!isLocked || !uid) return;
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return;
    const r = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (!r.canceled) setPendingAsset(r.assets[0]);
  }

  async function uploadPhoto(
    asset: ImagePicker.ImagePickerAsset,
    share: boolean,
  ) {
    if (!albumId || !uid || !asset.base64 || colorIdx === null) return;
    const color = WALK_COLORS[colorIdx];
    setUploading(true);
    setPendingAsset(null);
    try {
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const bin = atob(asset.base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

      const { error: se } = await supabase.storage
        .from("game-photos")
        .upload(path, bytes, { contentType: asset.mimeType ?? "image/jpeg" });
      if (se) {
        Alert.alert("Upload failed", se.message);
        return;
      }

      if (!(await ensureAlbum(albumId, color))) return;
      if (share) {
        await supabase
          .from("tw_albums")
          .update({ group_id: uid })
          .eq("id", albumId);
      }
      const { error: de } = await supabase.from("tw_submissions").insert({
        album_id: albumId,
        user_id: uid,
        display_name: displayName,
        topic_category: "Color",
        topic_label: color.name,
        photo_path: path,
        group_id: null,
      });
      if (de) {
        Alert.alert("Save failed", de.message);
        return;
      }

      const n = photoCount + 1;
      setPhotoCount(n);
      await savePick(colorIdx, albumId, n);
      if (uidRef.current) await fetchFeed(uidRef.current);
    } finally {
      setUploading(false);
    }
  }

  async function reactToAlbum(aId: string, emoji: string) {
    if (!uid) return;
    const album = feed.find((a) => a.id === aId);
    const mine = album?.tw_album_reactions.find((r) => r.user_id === uid);
    if (mine?.emoji === emoji) {
      await supabase
        .from("tw_album_reactions")
        .delete()
        .eq("album_id", aId)
        .eq("user_id", uid);
    } else {
      await supabase
        .from("tw_album_reactions")
        .upsert(
          { album_id: aId, user_id: uid, emoji },
          { onConflict: "album_id,user_id" },
        );
    }
    if (uidRef.current) void fetchFeed(uidRef.current);
  }

  async function rateAlbum(aId: string, score: number) {
    if (!uid) return;
    await supabase
      .from("tw_album_ratings")
      .upsert(
        { album_id: aId, user_id: uid, score },
        { onConflict: "album_id,user_id" },
      );
    if (uidRef.current) void fetchFeed(uidRef.current);
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const color = colorIdx !== null ? WALK_COLORS[colorIdx] : null;

  const wheelDeg = wheelRot.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
    extrapolate: "extend",
  });

  const mascotDeg = mascotRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-360deg", "360deg"],
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  const walkTourSteps: CoachStep[] = [
    {
      ref: wheelRef,
      title: "Your color wheel",
      body: "A new color is revealed here every day. No two days are the same!",
    },
    {
      ref: spinBtnRef,
      title: "Tap Spin!",
      body: "Hit Spin to reveal today's color, then head outside and photograph things that match.",
    },
  ];

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      {showWalkTour && (
        <CoachMark
          steps={walkTourSteps}
          onDone={() => {
            setShowWalkTour(false);
            void AsyncStorage.setItem("tw_tour_walk_v1", "1");
          }}
        />
      )}
      {/* Photo confirm modal */}
      <Modal
        visible={!!pendingAsset}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => pendingAsset && uploadPhoto(pendingAsset, false)}
      >
        <View style={s.modal}>
          {pendingAsset && (
            <Image
              source={{ uri: pendingAsset.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            style={s.modalBack}
            onPress={() => setPendingAsset(null)}
          >
            <ChevronLeft size={20} color="#fff" />
          </TouchableOpacity>
          <View style={s.modalBottom}>
            {color && (
              <View style={s.modalColorRow}>
                <View style={[s.modalSwatch, { backgroundColor: color.hex }]} />
                <Text style={s.modalColorName}>{color.name}</Text>
              </View>
            )}
            <Text style={s.modalPrompt}>Save to your walk?</Text>
            <TouchableOpacity
              onPress={() => pendingAsset && uploadPhoto(pendingAsset, true)}
              disabled={uploading}
              style={[s.modalBtn, { opacity: uploading ? 0.6 : 1 }]}
            >
              <Text style={s.modalBtnText}>
                {uploading ? "Saving…" : "Add to Album"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pendingAsset && uploadPhoto(pendingAsset, false)}
              disabled={uploading}
              style={[s.modalSecBtn, { opacity: uploading ? 0.6 : 1 }]}
            >
              <Text style={s.modalSecBtnText}>Save Privately</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPendingAsset(null)}
              style={s.retakeRow}
            >
              <RotateCcw size={14} color="rgba(255,255,255,0.7)" />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Color Walk</Text>
          <TouchableOpacity
            onPress={() => router.push("/archive")}
            style={s.iconBtn}
          >
            <CalendarDays size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Wheel */}
        <View ref={wheelRef} style={s.wheelSection}>
          {/* Pointer */}
          <View style={s.pointerRow}>
            <View style={s.pointer} />
          </View>

          {/* Spinning wheel */}
          <Animated.View
            style={[s.wheelWrap, { transform: [{ rotate: wheelDeg }] }]}
          >
            <Svg width={WHEEL} height={WHEEL} viewBox={`0 0 ${WHEEL} ${WHEEL}`}>
              {/* Background */}
              <Circle cx={WC} cy={WC} r={WR} fill="#F7F7F7" />

              {/* Dividers between color dots (drawn first, dots go on top) */}
              {WALK_COLORS.map((_, i) => {
                const mid = i * SLICE_DEG + SLICE_DEG / 2;
                const p1 = dotPos(WC, WC, WR * 0.28, mid);
                const p2 = dotPos(WC, WC, WR * 0.97, mid);
                return (
                  <Line
                    key={`div-${mid}`}
                    x1={p1.x.toFixed(1)}
                    y1={p1.y.toFixed(1)}
                    x2={p2.x.toFixed(1)}
                    y2={p2.y.toFixed(1)}
                    stroke="#D0D0D0"
                    strokeWidth={1.5}
                  />
                );
              })}

              {/* Colored dots */}
              {WALK_COLORS.map((c, i) => {
                const p = dotPos(WC, WC, WR * 0.65, i * SLICE_DEG);
                return (
                  <Circle
                    key={c.name}
                    cx={p.x.toFixed(1)}
                    cy={p.y.toFixed(1)}
                    r={WR * 0.165}
                    fill={c.hex}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  />
                );
              })}

              {/* Outer border */}
              <Circle
                cx={WC}
                cy={WC}
                r={WR}
                fill="none"
                stroke="#C8C8C8"
                strokeWidth={2}
              />

              {/* Center hub */}
              <Circle
                cx={WC}
                cy={WC}
                r={WR * 0.2}
                fill="#FFFFFF"
                stroke="#D0D0D0"
                strokeWidth={1.5}
              />
              <Circle cx={WC} cy={WC} r={WR * 0.065} fill="#C8C8C8" />
            </Svg>
          </Animated.View>
        </View>

        {/* Revealed color */}
        <Animated.View
          style={[
            s.revealRow,
            {
              opacity: revealOpacity,
              transform: [{ translateY: revealTranslate }],
            },
          ]}
        >
          {color && (
            <>
              <View style={[s.revealDot, { backgroundColor: color.hex }]} />
              <Text style={s.revealName}>{color.name}</Text>
              {isLocked && <Lock size={13} color={colors.mutedForeground} />}
            </>
          )}
        </Animated.View>

        {/* Actions */}
        <View style={s.actionRow}>
          {/* Mascot */}
          <Animated.Image
            source={require("../../assets/mascot.png")}
            style={[
              s.mascot,
              {
                transform: [
                  { translateY: mascotY },
                  { scale: mascotScale },
                  { rotate: mascotDeg },
                ],
              },
            ]}
            resizeMode="contain"
          />

          {/* Button */}
          {!revealed && !isSpinning && (
            <TouchableOpacity
              ref={spinBtnRef}
              onPress={spin}
              style={s.btn}
              activeOpacity={0.85}
            >
              <Text style={s.btnText}>Spin</Text>
            </TouchableOpacity>
          )}

          {isSpinning && (
            <View style={[s.btn, s.btnMuted]}>
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}

          {revealed && !isLocked && (
            <TouchableOpacity
              onPress={startWalk}
              style={[s.btn, color ? { backgroundColor: color.hex } : {}]}
              activeOpacity={0.85}
            >
              <Camera size={17} color="#fff" />
              <Text style={s.btnText}>Start Walk</Text>
            </TouchableOpacity>
          )}

          {isLocked && (
            <TouchableOpacity
              onPress={takePhoto}
              disabled={uploading}
              style={[s.btn, { opacity: uploading ? 0.55 : 1 }]}
              activeOpacity={0.85}
            >
              <Camera size={16} color="#fff" />
              <Text style={s.btnText}>
                {uploading ? "Uploading…" : "Take Photo"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo count */}
        {isLocked && photoCount > 0 && (
          <Text style={s.photoCount}>
            {photoCount} {photoCount === 1 ? "photo" : "photos"} taken
          </Text>
        )}

        {/* Feed label */}
        <Text style={s.feedLabel}>Today</Text>

        {/* Feed */}
        {!uid ? (
          <View style={s.emptyCard}>
            <Lock size={18} color={colors.mutedForeground} />
            <Text style={s.emptyTitle}>Sign in to see the feed</Text>
            <Text style={s.emptySub}>Go to Profile to get started.</Text>
          </View>
        ) : loading ? (
          <View style={s.emptyCard}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : feed.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptySub}>No albums yet — be the first 📸</Text>
          </View>
        ) : (
          feed.map((album) => {
            const CW = sw - 32;
            const isOwn = album.user_id === uid;
            const myRating = album.tw_album_ratings.find(
              (r) => r.user_id === uid,
            );
            const photos = album.tw_submissions;

            return (
              <TouchableOpacity
                key={album.id}
                style={s.card}
                activeOpacity={0.92}
                onPress={() =>
                  router.push({
                    pathname: "/album/[id]",
                    params: {
                      id: album.id,
                      color: album.color_hex,
                      name: album.color_name,
                      paths: JSON.stringify(
                        album.tw_submissions.map((p) => p.photo_path),
                      ),
                    },
                  })
                }
              >
                {photos.length > 0 && (
                  <View>
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={{ width: CW, height: CW * 0.75 }}
                    >
                      {photos.map((p, i) => {
                        const url = supabase.storage
                          .from("game-photos")
                          .getPublicUrl(p.photo_path).data.publicUrl;
                        return (
                          <Image
                            // biome-ignore lint/suspicious/noArrayIndexKey: stable
                            key={i}
                            source={{ uri: url }}
                            style={{ width: CW, height: CW * 0.75 }}
                            resizeMode="cover"
                          />
                        );
                      })}
                    </ScrollView>
                    {photos.length > 1 && (
                      <View style={s.photoBadge}>
                        <Text style={s.photoBadgeText}>📷 {photos.length}</Text>
                      </View>
                    )}
                    <View
                      style={[
                        s.colorStrip,
                        { backgroundColor: album.color_hex },
                      ]}
                    />
                  </View>
                )}

                <View style={s.cardBody}>
                  <View style={s.cardRow}>
                    <Text style={s.cardName} numberOfLines={1}>
                      {album.display_name}
                    </Text>
                    <View
                      style={[
                        s.chip,
                        { backgroundColor: `${album.color_hex}22` },
                      ]}
                    >
                      <View
                        style={[
                          s.chipDot,
                          { backgroundColor: album.color_hex },
                        ]}
                      />
                      <Text style={[s.chipText, { color: album.color_hex }]}>
                        {album.color_name}
                      </Text>
                    </View>
                  </View>

                  <View style={s.cardRow}>
                    {isOwn ? (
                      <StarDisplay ratings={album.tw_album_ratings} />
                    ) : (
                      <StarRatingWidget
                        submissionId={album.id}
                        myScore={myRating ? Number(myRating.score) : null}
                        onRate={rateAlbum}
                      />
                    )}
                    {!isOwn && album.tw_album_ratings.length > 0 && (
                      <StarDisplay ratings={album.tw_album_ratings} />
                    )}
                  </View>

                  <View style={s.reactRow}>
                    {EMOJIS.map((emoji) => {
                      const count = album.tw_album_reactions.filter(
                        (r) => r.emoji === emoji,
                      ).length;
                      const mine = album.tw_album_reactions.some(
                        (r) => r.emoji === emoji && r.user_id === uid,
                      );
                      return (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => reactToAlbum(album.id, emoji)}
                          style={[s.react, mine && s.reactActive]}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 14 }}>{emoji}</Text>
                          {count > 0 && (
                            <Text style={s.reactCount}>{count}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 56,
    gap: 22,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.foreground,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },

  // Wheel
  wheelSection: { alignItems: "center" },
  pointerRow: { alignItems: "center", marginBottom: 2, zIndex: 2 },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.foreground,
  },
  wheelWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  // Reveal
  revealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 36,
  },
  revealDot: { width: 20, height: 20, borderRadius: 10 },
  revealName: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.foreground,
  },

  // Actions
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mascot: { width: 56, height: 56, flexShrink: 0 },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  btnFlex: { flex: 1 },
  btnMuted: { opacity: 0.5 },
  btnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  outBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  outBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  photoRow: { flex: 1, flexDirection: "row", gap: 8 },

  // Photo count
  photoCount: {
    textAlign: "center",
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
  },

  // Feed
  feedLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  emptySub: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: "center",
  },

  // Feed card
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorStrip: { height: 3 },
  photoBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  photoBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  cardBody: { padding: 14, gap: 10 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 11, fontWeight: "700" },
  reactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  react: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.muted,
  },
  reactActive: { backgroundColor: primaryTint },
  reactCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
  },

  // Photo confirm modal
  modal: { flex: 1, backgroundColor: "#000" },
  modalBack: {
    position: "absolute",
    top: 52,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    backgroundColor: "rgba(0,0,0,0.6)",
    gap: 12,
  },
  modalColorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  modalSwatch: { width: 32, height: 32, borderRadius: 16 },
  modalColorName: { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalPrompt: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
  },
  modalBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  modalSecBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
  retakeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  retakeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },
});
