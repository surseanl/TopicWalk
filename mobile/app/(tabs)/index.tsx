import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { CalendarDays, Camera, Lock } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polygon } from "react-native-svg";
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
    const { data } = await supabase
      .from("tw_submissions")
      .select("*, tw_reactions(*), tw_ratings(*)")
      .eq("group_id", uid)
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
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled) return;
    await uploadPhoto(result.assets[0]);
  }

  async function pickFromGallery() {
    if (!selectedTopic || !userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled) return;
    await uploadPhoto(result.assets[0]);
  }

  async function uploadPhoto(asset: ImagePicker.ImagePickerAsset) {
    if (!selectedTopic || !userId) return;
    setUploading(true);
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}.${ext}`;
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      const { error } = await supabase.storage
        .from("game-photos")
        .upload(path, blob, { contentType: asset.mimeType ?? "image/jpeg" });
      if (!error) {
        await supabase.from("tw_submissions").insert({
          group_id: userId,
          user_id: userId,
          display_name: displayName,
          topic_category: selectedTopic.category,
          topic_label: selectedTopic.label,
          photo_path: path,
        });
        await fetchFeed(userId);
      }
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
            onPress={() => router.push("/(tabs)/home")}
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
              <View style={{ gap: 6 }}>
                <Text style={[s.topicCatLabel, { color: cat.badge }]}>
                  {selectedTopic.category}
                </Text>
                <Text style={s.topicLabel} numberOfLines={3}>
                  {selectedTopic.label}
                </Text>
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
  topicPlaceholderIcon: { marginBottom: 6 },
  topicCatLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2.5,
  },
  topicLabel: {
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
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
