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
import { type ReactElement, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, Polygon, Rect } from "react-native-svg";
import { StarDisplay, StarRatingWidget } from "../../components/Stars";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";
import { type Category, getTodayTopics } from "../../lib/topics";

// ── Category design system ────────────────────────────────────────────────────

const CAT = {
  Color: {
    iconBg: "#ffedd5",
    iconColor: "#f97316",
    wash: "#fff7ed",
    border: "#fed7aa",
    badge: "#c2410c",
    pill: "#ffedd5",
    pillText: "#c2410c",
  },
  Shape: {
    iconBg: "#e0f2fe",
    iconColor: "#0ea5e9",
    wash: "#f0f9ff",
    border: "#bae6fd",
    badge: "#0369a1",
    pill: "#e0f2fe",
    pillText: "#0369a1",
  },
  Theme: {
    iconBg: "#ede9fe",
    iconColor: "#8b5cf6",
    wash: "#faf5ff",
    border: "#ddd6fe",
    badge: "#6d28d9",
    pill: "#ede9fe",
    pillText: "#6d28d9",
  },
  Object: {
    iconBg: "#d1fae5",
    iconColor: "#10b981",
    wash: "#f0fdf4",
    border: "#a7f3d0",
    badge: "#047857",
    pill: "#d1fae5",
    pillText: "#047857",
  },
} as const;

const CATEGORY_EMOJI: Record<Category, string> = {
  Color: "🎨",
  Shape: "🔷",
  Theme: "✨",
  Object: "📍",
};

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮"];

const DAILY_PICK_KEY = "tw_daily_pick";
type DailyPick = { category: Category; label: string; date: string };

// ── SVG category icons ────────────────────────────────────────────────────────

function CategoryIcon({
  category,
  color,
  size = 32,
}: {
  category: Category;
  color: string;
  size?: number;
}) {
  if (category === "Color") {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Circle cx="16" cy="16" r="11" fill={color} />
      </Svg>
    );
  }
  if (category === "Shape") {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Polygon
          points="16,3 30,27 2,27"
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  }
  if (category === "Theme") {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32">
        <Path
          d="M16 2L18.2 13.8L30 16L18.2 18.2L16 30L13.8 18.2L2 16L13.8 13.8Z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M16 2C10.48 2 6 6.48 6 12C6 19.5 16 30 16 30C16 30 26 19.5 26 12C26 6.48 21.52 2 16 2Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.15}
      />
      <Circle cx="16" cy="12" r="3.5" fill={color} />
    </Svg>
  );
}

// ── Topic visual sample (shown on photo confirmation) ─────────────────────────

const OBJECT_EMOJI: Record<string, string> = {
  "A payphone or call box": "📞",
  "A bicycle locked to a post": "🚲",
  "Tree roots cracking pavement": "🌳",
  "A faded hopscotch grid": "🪀",
  "A convex traffic mirror": "🪞",
  "A street art sticker": "🎨",
  "A worn stone doorstep": "🪨",
  "A water meter cover": "💧",
  "Coins in a fountain": "🪙",
  "A newspaper box": "📰",
  "A construction sawhorse": "🚧",
  "A broken umbrella left behind": "☂️",
};

function TopicSample({
  category,
  label,
  size = 52,
  strokeColor = "rgba(255,255,255,0.9)",
  borderColor = "rgba(255,255,255,0.45)",
}: {
  category: Category;
  label: string;
  size?: number;
  strokeColor?: string;
  borderColor?: string;
}) {
  if (category === "Color") {
    const match = label.match(/#[A-Fa-f0-9]{6}/);
    const hex = match ? match[0] : "#888888";
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: hex,
          borderWidth: 3,
          borderColor,
        }}
      />
    );
  }

  if (category === "Shape") {
    const c = strokeColor;
    const sw = 6;
    let inner: ReactElement | null = null;

    if (label === "A circle") {
      inner = (
        <Circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={c}
          strokeWidth={sw}
        />
      );
    } else if (label === "A triangle") {
      inner = (
        <Polygon
          points="50,8 92,85 8,85"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    } else if (label === "A grid of rectangles") {
      inner = (
        <>
          <Rect
            x="8"
            y="8"
            width="37"
            height="37"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            rx="4"
          />
          <Rect
            x="55"
            y="8"
            width="37"
            height="37"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            rx="4"
          />
          <Rect
            x="8"
            y="55"
            width="37"
            height="37"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            rx="4"
          />
          <Rect
            x="55"
            y="55"
            width="37"
            height="37"
            fill="none"
            stroke={c}
            strokeWidth={sw}
            rx="4"
          />
        </>
      );
    } else if (label === "A spiral") {
      inner = (
        <Path
          d="M 50,16 C 74,16 85,37 82,55 C 79,73 63,82 46,79 C 29,76 20,62 23,47 C 26,32 39,24 52,27 C 65,30 72,43 70,56 C 68,69 55,76 43,72"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );
    } else if (label === "An arch or arc") {
      inner = (
        <Path
          d="M 12,82 C 12,28 88,28 88,82"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );
    } else if (label === "Parallel lines") {
      inner = (
        <>
          <Line
            x1="12"
            y1="22"
            x2="88"
            y2="22"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Line
            x1="12"
            y1="40"
            x2="88"
            y2="40"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Line
            x1="12"
            y1="58"
            x2="88"
            y2="58"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Line
            x1="12"
            y1="76"
            x2="88"
            y2="76"
            stroke={c}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );
    } else if (label === "A diamond") {
      inner = (
        <Polygon
          points="50,8 92,50 50,92 8,50"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    } else if (label === "A starburst or star") {
      inner = (
        <Polygon
          points="50,8 61,35 90,37 67,56 75,84 50,68 25,84 33,56 10,37 39,35"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    } else if (label === "A wave or curve") {
      inner = (
        <Path
          d="M 5,50 C 20,20 35,20 50,50 C 65,80 80,80 95,50"
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );
    } else if (label === "Concentric rings") {
      inner = (
        <>
          <Circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={c}
            strokeWidth="4"
          />
          <Circle
            cx="50"
            cy="50"
            r="28"
            fill="none"
            stroke={c}
            strokeWidth="4"
          />
          <Circle
            cx="50"
            cy="50"
            r="14"
            fill="none"
            stroke={c}
            strokeWidth="4"
          />
        </>
      );
    } else {
      inner = (
        <Circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke={c}
          strokeWidth={sw}
        />
      );
    }

    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {inner}
      </Svg>
    );
  }

  if (category === "Object") {
    return (
      <Text
        style={{ fontSize: size * 0.72, lineHeight: size, textAlign: "center" }}
      >
        {OBJECT_EMOJI[label] ?? "📍"}
      </Text>
    );
  }

  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Reaction = { emoji: string; user_id: string };
type Rating = { user_id: string; score: number };
type Submission = {
  id: string;
  user_id: string;
  display_name: string;
  topic_category: string;
  topic_label: string;
  photo_path: string;
  submitted_at: string;
  tw_reactions: Reaction[];
  tw_ratings: Rating[];
};

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WalkScreen() {
  const router = useRouter();
  const topics = getTodayTopics();

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<{
    category: Category;
    label: string;
  } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [feed, setFeed] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [pendingAsset, setPendingAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // Animation values
  const mascotY = useRef(new Animated.Value(0)).current;
  const mascotX = useRef(new Animated.Value(0)).current;
  const mascotScale = useRef(new Animated.Value(1)).current;
  const mascotRotate = useRef(new Animated.Value(0)).current;
  const cardSpin = useRef(new Animated.Value(0)).current;

  const groupIdRef = useRef<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadSavedPick();
    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadUser();
      else {
        setUserId(null);
        setFeed([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadSavedPick() {
    try {
      const raw = await AsyncStorage.getItem(DAILY_PICK_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as DailyPick;
      const today = new Date().toISOString().split("T")[0];
      if (p.date === today) {
        setSelectedTopic({ category: p.category, label: p.label });
        setIsLocked(true);
        setCardVisible(true);
      }
    } catch {}
  }

  async function savePick(topic: { category: Category; label: string }) {
    const today = new Date().toISOString().split("T")[0];
    await AsyncStorage.setItem(
      DAILY_PICK_KEY,
      JSON.stringify({ ...topic, date: today }),
    );
  }

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    const uid = session.user.id;
    setUserId(uid);
    groupIdRef.current = uid;
    const { data } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", uid)
      .maybeSingle();
    setDisplayName(data?.username ?? "");
    await fetchFeed(uid);
  }

  async function fetchFeed(uid: string) {
    const today = new Date().toISOString().split("T")[0];

    // Collect accepted friend IDs (user appears as either requester or addressee)
    const { data: friendships } = await supabase
      .from("tw_friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === uid ? f.addressee_id : f.requester_id,
    );

    // Show own feed submissions + friends' feed submissions
    const groupIds = [uid, ...friendIds];

    const { data } = await supabase
      .from("tw_submissions")
      .select("*, tw_reactions(*), tw_ratings(*)")
      .in("group_id", groupIds)
      .gte("submitted_at", `${today}T00:00:00`)
      .order("submitted_at", { ascending: false });
    if (data) setFeed(data as Submission[]);
    setLoading(false);
    setRefreshing(false);
  }

  async function onRefresh() {
    if (!groupIdRef.current) return;
    setRefreshing(true);
    await fetchFeed(groupIdRef.current);
  }

  function animateMascotRoll() {
    mascotY.setValue(0);
    mascotX.setValue(0);
    mascotScale.setValue(1);
    mascotRotate.setValue(0);

    Animated.sequence([
      // Squish down
      Animated.parallel([
        Animated.timing(mascotScale, {
          toValue: 0.82,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mascotY, {
          toValue: 8,
          duration: 90,
          useNativeDriver: true,
        }),
      ]),
      // Launch up + lean forward + spin
      Animated.parallel([
        Animated.spring(mascotScale, {
          toValue: 1.15,
          friction: 3,
          tension: 250,
          useNativeDriver: true,
        }),
        Animated.timing(mascotY, {
          toValue: -22,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(mascotX, {
          toValue: 10,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(mascotRotate, {
          toValue: 0.08, // ~29°
          duration: 220,
          useNativeDriver: true,
        }),
      ]),
      // Fall back with bounce
      Animated.parallel([
        Animated.spring(mascotScale, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(mascotY, {
          toValue: 0,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.spring(mascotX, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(mascotRotate, {
          toValue: 0,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  function animateCardSpin() {
    cardSpin.setValue(0);
    Animated.timing(cardSpin, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function pickTopic(category: Category) {
    if (isLocked) return;
    const t = topics.find((t) => t.category === category);
    if (!t) return;
    setSelectedTopic(t);
    setCardVisible(true);
    animateMascotRoll();
    animateCardSpin();
  }

  async function lockTopic() {
    if (!selectedTopic) return;
    await savePick(selectedTopic);
    setIsLocked(true);
  }

  async function takePhoto() {
    if (!selectedTopic || !userId) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    setPendingAsset(result.assets[0]);
  }

  async function pickFromGallery() {
    if (!selectedTopic || !userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      base64: true,
    });
    if (result.canceled) return;
    setPendingAsset(result.assets[0]);
  }

  async function uploadPhoto(
    asset: ImagePicker.ImagePickerAsset,
    shareToFeed: boolean,
  ) {
    if (!selectedTopic || !userId || !asset.base64) return;
    setUploading(true);
    setPendingAsset(null);
    try {
      const ext = asset.mimeType?.split("/")[1] ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
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
      const { error: dbError } = await supabase.from("tw_submissions").insert({
        group_id: shareToFeed ? userId : null,
        user_id: userId,
        display_name: displayName,
        topic_category: selectedTopic.category,
        topic_label: selectedTopic.label,
        photo_path: path,
      });
      if (dbError) {
        Alert.alert("Save failed", dbError.message);
        return;
      }
      if (shareToFeed) await fetchFeed(userId);
    } finally {
      setUploading(false);
    }
  }

  async function react(submissionId: string, emoji: string) {
    if (!userId) return;
    const sub = feed.find((s) => s.id === submissionId);
    const mine = sub?.tw_reactions.find((r) => r.user_id === userId);
    if (mine?.emoji === emoji) {
      await supabase
        .from("tw_reactions")
        .delete()
        .eq("submission_id", submissionId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("tw_reactions")
        .upsert(
          { submission_id: submissionId, user_id: userId, emoji },
          { onConflict: "submission_id,user_id" },
        );
    }
    if (groupIdRef.current) void fetchFeed(groupIdRef.current);
  }

  async function rateSubmission(submissionId: string, score: number) {
    if (!userId) return;
    await supabase
      .from("tw_ratings")
      .upsert(
        { submission_id: submissionId, user_id: userId, score },
        { onConflict: "submission_id,user_id" },
      );
    if (groupIdRef.current) void fetchFeed(groupIdRef.current);
  }

  const cat = selectedTopic ? CAT[selectedTopic.category] : null;

  const mascotRotateDeg = mascotRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const cardRotateY = cardSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      {/* Photo confirmation modal */}
      <Modal
        visible={!!pendingAsset}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => pendingAsset && uploadPhoto(pendingAsset, false)}
      >
        <View style={s.confirmModal}>
          {pendingAsset && (
            <Image
              source={{ uri: pendingAsset.uri }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          )}
          <View style={s.confirmTop}>
            <TouchableOpacity
              onPress={() => pendingAsset && uploadPhoto(pendingAsset, false)}
              style={s.confirmBack}
            >
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.confirmBottom}>
            {selectedTopic && (
              <View style={s.confirmTopicRow}>
                <View style={s.confirmTopicSwatch}>
                  <TopicSample
                    category={selectedTopic.category}
                    label={selectedTopic.label}
                    size={50}
                  />
                </View>
                <View style={s.confirmTopicText}>
                  <Text style={s.confirmTopicCat}>
                    {selectedTopic.category}
                  </Text>
                  <Text style={s.confirmTopicLabel} numberOfLines={2}>
                    {selectedTopic.category === "Color"
                      ? selectedTopic.label.replace(/ #[A-Fa-f0-9]{6}$/, "")
                      : selectedTopic.label}
                  </Text>
                </View>
              </View>
            )}
            <Text style={s.confirmPrompt}>Save this photo?</Text>
            <TouchableOpacity
              onPress={() => pendingAsset && uploadPhoto(pendingAsset, true)}
              disabled={uploading}
              style={[s.confirmPrimaryBtn, { opacity: uploading ? 0.6 : 1 }]}
            >
              <Text style={s.confirmPrimaryBtnText}>
                {uploading ? "Saving…" : "Share to Feed"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pendingAsset && uploadPhoto(pendingAsset, false)}
              disabled={uploading}
              style={[s.confirmSecondaryBtn, { opacity: uploading ? 0.6 : 1 }]}
            >
              <Text style={s.confirmSecondaryBtnText}>
                Save to Archive Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPendingAsset(null)}
              style={s.confirmRetakeBtn}
            >
              <RotateCcw size={16} color="rgba(255,255,255,0.8)" />
              <Text style={s.confirmRetakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
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
          <View>
            <Text style={s.pageTitle}>Free Walk</Text>
            <Text style={s.pageSub}>Pick a topic · Take a photo</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/archive")}
            style={s.calBtn}
          >
            <CalendarDays size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Category grid */}
        <View style={s.grid}>
          {topics.map((t) => {
            const c = CAT[t.category];
            const isActive = selectedTopic?.category === t.category;
            const isDisabled = isLocked && !isActive;
            return (
              <TouchableOpacity
                key={t.category}
                onPress={() => pickTopic(t.category)}
                disabled={isDisabled}
                activeOpacity={0.75}
                style={[
                  s.catCard,
                  {
                    opacity: isDisabled ? 0.25 : 1,
                    borderColor: isActive ? c.border : colors.border,
                    backgroundColor: isActive ? c.wash : colors.card,
                  },
                ]}
              >
                <View style={[s.catIconWrap, { backgroundColor: c.iconBg }]}>
                  <CategoryIcon
                    category={t.category}
                    color={c.iconColor}
                    size={32}
                  />
                </View>
                <Text
                  style={[
                    s.catLabel,
                    { color: isActive ? c.badge : colors.mutedForeground },
                  ]}
                >
                  {t.category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mascot + topic card */}
        <View style={s.mascotRow}>
          {/* Animated mascot */}
          <Animated.View
            style={[
              s.mascotWrap,
              {
                opacity: selectedTopic ? 1 : 0.35,
                transform: [
                  { translateY: mascotY },
                  { translateX: mascotX },
                  { scale: mascotScale },
                  { rotate: mascotRotateDeg },
                ],
              },
            ]}
          >
            <Image
              source={require("../../assets/mascot.png")}
              style={s.mascotImg}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Topic card — spins on category pick */}
          <Animated.View
            style={[
              s.topicCard,
              cardVisible && cat
                ? { borderColor: cat.border, backgroundColor: cat.wash }
                : { borderColor: colors.border, backgroundColor: colors.card },
              { transform: [{ perspective: 900 }, { rotateY: cardRotateY }] },
            ]}
          >
            {selectedTopic && cat ? (
              <View style={s.topicCardInner}>
                <View style={s.topicCardVisual}>
                  <TopicSample
                    category={selectedTopic.category}
                    label={selectedTopic.label}
                    size={selectedTopic.category === "Object" ? 40 : 48}
                    strokeColor={cat.badge}
                    borderColor="transparent"
                  />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[s.topicCatLabel, { color: cat.badge }]}>
                    {selectedTopic.category}
                  </Text>
                  <Text style={s.topicLabel} numberOfLines={2}>
                    {selectedTopic.category === "Color"
                      ? selectedTopic.label.replace(/ #[A-Fa-f0-9]{6}$/, "")
                      : selectedTopic.label}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <View style={s.topicPlaceholderIcon}>
                  <Svg width={24} height={24} viewBox="0 0 32 32">
                    <Circle
                      cx="16"
                      cy="16"
                      r="10"
                      stroke={colors.mutedForeground}
                      strokeWidth="2.5"
                      fill="none"
                    />
                  </Svg>
                </View>
                <Text
                  style={[s.topicCatLabel, { color: colors.mutedForeground }]}
                >
                  Pick a category
                </Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* Lock notice */}
        {isLocked && (
          <View style={s.lockNotice}>
            <Lock size={12} color={colors.mutedForeground} />
            <Text style={s.lockNoticeText}>
              Today's pick — resets at midnight
            </Text>
          </View>
        )}

        {/* Lock button */}
        {selectedTopic && !isLocked && (
          <TouchableOpacity
            onPress={lockTopic}
            style={s.primaryBtn}
            activeOpacity={0.8}
          >
            <Lock color="#fff" size={18} />
            <Text style={s.primaryBtnText}>
              Lock in {selectedTopic.category}
            </Text>
          </TouchableOpacity>
        )}

        {/* Photo buttons */}
        {isLocked && selectedTopic && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={takePhoto}
              disabled={uploading}
              style={[s.primaryBtn, { opacity: uploading ? 0.6 : 1 }]}
              activeOpacity={0.8}
            >
              <Camera color="#fff" size={18} />
              <Text style={s.primaryBtnText}>
                {uploading ? "Uploading…" : "Take / Upload Photo"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickFromGallery}
              disabled={uploading}
              style={s.outlineBtn}
              activeOpacity={0.8}
            >
              <Text style={s.outlineBtnText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feed */}
        <Text style={s.sectionLabel}>Today's Feed</Text>

        {!userId ? (
          <View style={s.feedLocked}>
            <View style={s.feedLockedIcon}>
              <Lock size={20} color={colors.mutedForeground} />
            </View>
            <Text style={s.feedLockedTitle}>Community Feed</Text>
            <Text style={s.feedLockedSub}>
              Sign in to see what your friends photographed today and react to
              their finds.
            </Text>
          </View>
        ) : loading ? (
          <View style={s.emptyState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : feed.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.muted}>No submissions yet — be the first! 📸</Text>
          </View>
        ) : (
          feed.map((sub) => {
            const url = supabase.storage
              .from("game-photos")
              .getPublicUrl(sub.photo_path).data.publicUrl;
            const isOwn = sub.user_id === userId;
            const myRating = sub.tw_ratings.find((r) => r.user_id === userId);
            const subCat = sub.topic_category as Category;
            const subC = CAT[subCat];

            return (
              <View key={sub.id} style={s.feedCard}>
                <Image
                  source={{ uri: url }}
                  style={s.feedImage}
                  resizeMode="cover"
                />
                <View style={s.feedBody}>
                  <View style={s.feedRow}>
                    <Text style={s.feedName} numberOfLines={1}>
                      {sub.display_name}
                      <Text style={s.feedTopicLabel}> {sub.topic_label}</Text>
                    </Text>
                    <View style={[s.pill, { backgroundColor: subC.pill }]}>
                      <Text style={[s.pillText, { color: subC.pillText }]}>
                        {CATEGORY_EMOJI[subCat]} {subCat}
                      </Text>
                    </View>
                  </View>

                  <View style={s.feedRow}>
                    {isOwn ? (
                      <StarDisplay ratings={sub.tw_ratings} />
                    ) : (
                      <StarRatingWidget
                        submissionId={sub.id}
                        myScore={myRating ? Number(myRating.score) : null}
                        onRate={rateSubmission}
                      />
                    )}
                    {!isOwn && sub.tw_ratings.length > 0 && (
                      <StarDisplay ratings={sub.tw_ratings} />
                    )}
                  </View>

                  <View style={s.reactionsRow}>
                    {EMOJIS.map((emoji) => {
                      const count = sub.tw_reactions.filter(
                        (r) => r.emoji === emoji,
                      ).length;
                      const mine = sub.tw_reactions.some(
                        (r) => r.emoji === emoji && r.user_id === userId,
                      );
                      return (
                        <TouchableOpacity
                          key={emoji}
                          onPress={() => react(sub.id, emoji)}
                          activeOpacity={0.75}
                          style={[
                            s.reactionBtn,
                            {
                              borderColor: mine
                                ? colors.primary
                                : colors.border,
                              backgroundColor: mine ? primaryTint : colors.card,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 15 }}>{emoji}</Text>
                          {count > 0 && (
                            <Text style={s.reactionCount}>{count}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 22,
  },

  // ── Page header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  pageSub: {
    fontSize: 14,
    fontWeight: "400",
    fontStyle: "italic",
    color: colors.mutedForeground,
    letterSpacing: 0.1,
  },

  // ── Category grid ─────────────────────────────────────────────────────────
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  catCard: {
    width: "47%",
    borderRadius: 20,
    borderWidth: 2,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },

  // ── Mascot + topic card ───────────────────────────────────────────────────
  mascotRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  mascotWrap: { flexShrink: 0 },
  mascotImg: { width: 80, height: 80 },

  topicCard: {
    flex: 1,
    height: 152,
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: "center",
    overflow: "hidden",
    gap: 4,
  },
  topicCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  topicCardVisual: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topicPlaceholderIcon: { marginBottom: 6 },
  topicCatLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2.5,
  },
  topicLabel: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: colors.foreground,
    lineHeight: 27,
  },

  // ── Lock notice ───────────────────────────────────────────────────────────
  lockNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  lockNoticeText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.mutedForeground,
  },

  // ── Buttons ───────────────────────────────────────────────────────────────
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
  outlineBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },

  // ── Section label ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // ── Feed locked ───────────────────────────────────────────────────────────
  feedLocked: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  feedLockedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  feedLockedTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: colors.foreground,
  },
  feedLockedSub: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Feed ─────────────────────────────────────────────────────────────────
  emptyState: {
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
  },
  feedCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  feedImage: { width: "100%", aspectRatio: 1 },
  feedBody: { padding: 14, gap: 10 },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  feedName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: colors.foreground,
  },
  feedTopicLabel: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.mutedForeground,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },
  muted: { fontSize: 14, color: colors.mutedForeground },

  // ── Photo confirmation modal ──────────────────────────────────────────────
  confirmModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  confirmTop: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  confirmBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 48,
    paddingTop: 32,
    backgroundColor: "rgba(0,0,0,0.55)",
    gap: 12,
  },
  confirmTopicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingBottom: 6,
  },
  confirmTopicSwatch: {
    width: 54,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTopicText: {
    flex: 1,
    gap: 3,
  },
  confirmTopicCat: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.55)",
  },
  confirmTopicLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  confirmPrompt: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  confirmPrimaryBtn: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmPrimaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  confirmSecondaryBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmSecondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  confirmRetakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  confirmRetakeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },

  reactionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reactionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
  },
});
