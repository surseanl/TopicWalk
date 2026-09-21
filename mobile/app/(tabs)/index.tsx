import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Settings2,
  Users2,
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
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { WALK_COLORS, type WalkColor } from "../../lib/topics";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAILY_KEY = "tw_color_v3";
const WHEEL_COLORS_KEY = "tw_wheel_colors_v1";

const DEFAULT_ACTIVE = new Set([
  "Red",
  "Orange",
  "Yellow",
  "Green",
  "Blue",
  "Purple",
  "Pink",
  "Brown",
  "Gray",
  "Black",
]);

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

  const [showWalkTour, setShowWalkTour] = useState(false);
  const [activeColorNames, setActiveColorNames] = useState<Set<string>>(
    new Set(DEFAULT_ACTIVE),
  );
  const [showCustomize, setShowCustomize] = useState(false);
  const [pendingSwap, setPendingSwap] = useState<string | null>(null);

  const activeColors = WALK_COLORS.filter((c) => activeColorNames.has(c.name));
  const sliceDeg = activeColors.length > 0 ? 360 / activeColors.length : 36;

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
    } else {
      currentDateRef.current = d;
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
    async function loadAndRestore() {
      let active = WALK_COLORS;
      try {
        const stored = await AsyncStorage.getItem(WHEEL_COLORS_KEY);
        if (stored) {
          const names: string[] = JSON.parse(stored);
          const filtered = WALK_COLORS.filter((c) => names.includes(c.name));
          if (filtered.length === 10) {
            active = filtered;
            setActiveColorNames(new Set(filtered.map((c) => c.name)));
          }
        }
      } catch {}
      await restorePick(active);
    }
    void loadAndRestore();
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

  async function restorePick(active: WalkColor[]) {
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
      const storedColor = WALK_COLORS[p.colorIdx];
      const activeIdx = active.findIndex((c) => c.name === storedColor?.name);
      if (activeIdx >= 0) {
        const sd = 360 / active.length;
        wheelRot.setValue((7 * 360 + (360 - activeIdx * sd)) % 360);
      }
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

  function landingDeg(activeIdx: number) {
    return 7 * 360 + (360 - activeIdx * sliceDeg);
  }

  async function initUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
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
    const activeIdx = Math.floor(Math.random() * activeColors.length);
    const pickedColor = activeColors[activeIdx];
    const globalIdx = WALK_COLORS.findIndex((c) => c.name === pickedColor.name);
    mascotPush();
    setTimeout(() => {
      setIsSpinning(true);
      Animated.timing(wheelRot, {
        toValue: landingDeg(activeIdx),
        duration: 3800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start(() => {
        setIsSpinning(false);
        setColorIdx(globalIdx);
        setRevealed(true);
        void savePick(globalIdx, null, 0);
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

  async function handleColorTap(name: string) {
    if (revealed) return;
    const isActive = activeColorNames.has(name);

    if (isActive) {
      // Mark/unmark this color for swap-out
      setPendingSwap(pendingSwap === name ? null : name);
    } else {
      // Inactive tapped — only do something if one is pending swap-out
      if (!pendingSwap) return;
      const next = new Set(activeColorNames);
      next.delete(pendingSwap);
      next.add(name);
      setPendingSwap(null);
      setActiveColorNames(next);
      await AsyncStorage.setItem(WHEEL_COLORS_KEY, JSON.stringify([...next]));
    }
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
        group_id: share ? uid : null,
      });
      if (de) {
        Alert.alert("Save failed", de.message);
        return;
      }

      const n = photoCount + 1;
      setPhotoCount(n);
      await savePick(colorIdx, albumId, n);
    } finally {
      setUploading(false);
    }
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

      {/* Customize wheel modal */}
      <Modal
        visible={showCustomize}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setShowCustomize(false);
          setPendingSwap(null);
        }}
      >
        <View style={s.customizeOverlay}>
          <View style={s.customizeSheet}>
            <View style={s.customizeHeader}>
              <Text style={s.customizeTitle}>Customize Wheel</Text>
              <Text style={s.customizeSub}>
                {pendingSwap
                  ? "Now tap a color to swap it in"
                  : "Tap an active color to swap it out"}
              </Text>
            </View>
            <ScrollView
              style={s.colorGridScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={s.colorGrid}>
                {WALK_COLORS.map((c) => {
                  const active = activeColorNames.has(c.name);
                  const isPending = pendingSwap === c.name;
                  const isLight =
                    c.name === "White" ||
                    c.name === "Tan" ||
                    c.name === "Silver";
                  const dimInactive = !active && !pendingSwap;
                  return (
                    <TouchableOpacity
                      key={c.name}
                      style={s.colorGridItem}
                      onPress={() => handleColorTap(c.name)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          s.colorGridCircle,
                          { backgroundColor: c.hex },
                          isLight && s.colorGridCircleBorder,
                          isPending && s.colorGridCirclePending,
                          dimInactive && s.colorGridCircleOff,
                        ]}
                      >
                        {isPending ? (
                          <Text style={s.colorGridSwapIcon}>↕</Text>
                        ) : active ? (
                          <Check
                            size={18}
                            color={isLight ? "#555" : "#fff"}
                            strokeWidth={3}
                          />
                        ) : null}
                      </View>
                      <Text
                        style={[
                          s.colorGridLabel,
                          dimInactive && { opacity: 0.4 },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            {revealed && (
              <Text style={s.customizeNote}>
                Changes apply on your next spin
              </Text>
            )}
            <TouchableOpacity
              style={s.customizeDone}
              onPress={() => {
                setShowCustomize(false);
                setPendingSwap(null);
              }}
            >
              <Text style={s.customizeDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={s.content}>
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>Color Walk</Text>
            <Text style={s.subtitle}>Spin the wheel, snap a color photo.</Text>
          </View>
          <View style={{ gap: 6 }}>
            <TouchableOpacity
              onPress={() => router.push("/feed")}
              style={s.headerPill}
            >
              <Users2 size={14} color={colors.foreground} />
              <Text style={s.headerPillText}>Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/archive")}
              style={s.headerPill}
            >
              <CalendarDays size={14} color={colors.foreground} />
              <Text style={s.headerPillText}>Past Walks</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wheel + customize — fills remaining space */}
        <View style={s.wheelGroup}>
          <View ref={wheelRef} style={s.wheelSection}>
            {/* Pointer */}
            <View style={s.pointerRow}>
              <View style={s.pointer} />
            </View>

            {/* Spinning wheel */}
            <Animated.View
              style={[s.wheelWrap, { transform: [{ rotate: wheelDeg }] }]}
            >
              <Svg
                width={WHEEL}
                height={WHEEL}
                viewBox={`0 0 ${WHEEL} ${WHEEL}`}
              >
                {/* Background */}
                <Circle cx={WC} cy={WC} r={WR} fill="#F7F7F7" />

                {/* Dividers between color dots (drawn first, dots go on top) */}
                {activeColors.map((_, i) => {
                  const mid = i * sliceDeg + sliceDeg / 2;
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
                {activeColors.map((c, i) => {
                  const p = dotPos(WC, WC, WR * 0.65, i * sliceDeg);
                  return (
                    <Circle
                      key={c.name}
                      cx={p.x.toFixed(1)}
                      cy={p.y.toFixed(1)}
                      r={WR * 0.165}
                      fill={c.hex}
                      stroke={
                        c.name === "White" ||
                        c.name === "Tan" ||
                        c.name === "Silver"
                          ? "#C8C8C8"
                          : "#FFFFFF"
                      }
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

          {/* Customize colors */}
          <TouchableOpacity
            style={[s.customizeBtn, revealed && { opacity: 0.35 }]}
            onPress={() => setShowCustomize(true)}
            activeOpacity={0.7}
          >
            <Settings2 size={14} color={colors.mutedForeground} />
            <Text style={s.customizeBtnText}>
              {revealed ? "Customize wheel" : "Customize your colors"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom card — reveal + action + count */}
        <View style={s.bottomCard}>
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
                <View
                  style={[
                    s.revealDot,
                    { backgroundColor: color.hex },
                    color.name === "White" && s.revealDotBorder,
                  ]}
                />
                <Text style={s.revealName}>{color.name}</Text>
              </>
            )}
          </Animated.View>

          {/* Actions */}
          <View style={s.actionRow}>
            {/* Mascot */}
            <Animated.View
              style={{
                transform: [
                  { translateY: mascotY },
                  { scale: mascotScale },
                  { rotate: mascotDeg },
                ],
              }}
            >
              <Image
                source={require("../../assets/mascot.png")}
                style={[s.mascot, { tintColor: color?.hex ?? undefined }]}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Button */}
            {!revealed && !isSpinning && (
              <TouchableOpacity
                ref={spinBtnRef}
                onPress={spin}
                style={s.btn}
                activeOpacity={0.85}
              >
                <Text style={s.btnText}>Spin</Text>
                <ChevronRight size={20} color="#fff" />
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
                <View style={s.btnLeft}>
                  <Camera size={20} color="#fff" />
                  <Text style={s.btnText}>Start Walk</Text>
                </View>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {isLocked && (
              <TouchableOpacity
                onPress={takePhoto}
                disabled={uploading}
                style={[
                  s.btn,
                  color ? { backgroundColor: color.hex } : {},
                  { opacity: uploading ? 0.55 : 1 },
                ]}
                activeOpacity={0.85}
              >
                <View style={s.btnLeft}>
                  <Camera size={20} color="#fff" />
                  <Text style={s.btnText}>
                    {uploading ? "Uploading…" : "Take Photo"}
                  </Text>
                </View>
                <ChevronRight size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {/* Photo count */}
          {isLocked && photoCount > 0 && (
            <View style={s.photoCountRow}>
              <Camera size={14} color={colors.mutedForeground} />
              <Text style={s.photoCount}>
                {photoCount} {photoCount === 1 ? "photo" : "photos"} taken
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.mutedForeground,
    lineHeight: 20,
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.muted,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
  },

  // Customize button (below wheel)
  customizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  customizeBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.mutedForeground,
  },

  // Customize modal
  customizeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  customizeSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 44,
    gap: 24,
  },
  customizeHeader: { gap: 4 },
  customizeTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  customizeSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.mutedForeground,
  },
  colorGridScroll: { maxHeight: 340 },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  colorGridItem: {
    width: "17%",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
  },
  colorGridCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  colorGridCircleBorder: { borderWidth: 1.5, borderColor: "#C8C8C8" },
  colorGridCircleOff: { opacity: 0.2 },
  colorGridCirclePending: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  colorGridSwapIcon: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "800",
  },
  colorGridLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  customizeNote: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: "center",
    fontStyle: "italic",
  },
  customizeDone: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  customizeDoneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  // Wheel
  wheelGroup: { flex: 1, gap: 0 },
  wheelSection: { flex: 1, alignItems: "center", justifyContent: "center" },
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

  // Bottom card
  bottomCard: {
    backgroundColor: colors.muted,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 14,
  },

  // Reveal
  revealRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 28,
  },
  revealDot: { width: 22, height: 22, borderRadius: 11 },
  revealDotBorder: { borderWidth: 1.5, borderColor: "#C8C8C8" },
  revealName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.foreground,
  },

  // Actions
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  mascot: { width: 52, height: 52, flexShrink: 0 },
  btn: {
    flex: 1,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  btnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnFlex: { flex: 1 },
  btnMuted: { opacity: 0.5 },
  btnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  outBtn: {
    flex: 1,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  outBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  photoRow: { flex: 1, flexDirection: "row", gap: 8 },

  // Photo count
  photoCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoCount: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
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
