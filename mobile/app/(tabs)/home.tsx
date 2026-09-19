import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Footprints,
  MapPin,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";
import { WALK_COLORS } from "../../lib/topics";

type DayPick = {
  date: string;
  colorIdx: number;
  albumId: string | null;
  photoCount: number;
};

type RecentAlbum = {
  id: string;
  color_name: string;
  color_hex: string;
  created_at: string;
  photo_count: number;
  thumbnail_url: string | null;
};

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const t = today();
  const y = yesterday();
  if (dates[0] !== t && dates[0] !== y) return 0;
  let streak = 0;
  let expected = dates[0];
  for (const d of dates) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
    } else {
      break;
    }
  }
  return streak;
}

const TAGLINES = [
  "Keep going — great things take time!",
  "Every walk counts. Let's go!",
  "The best time to walk is now.",
  "One color, one walk, one story.",
];

export default function HomeScreen() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [todayPick, setTodayPick] = useState<DayPick | null>(null);
  const [distanceM, setDistanceM] = useState(0);
  const [photos, setPhotos] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<RecentAlbum[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const mascotY = useRef(new Animated.Value(0)).current;
  const tagline = useRef(
    TAGLINES[Math.floor(Math.random() * TAGLINES.length)],
  ).current;

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotY, {
          toValue: -5,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(mascotY, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) void load(s.user.id);
    });
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) void load(session.user.id);
    })();
    return () => subscription.unsubscribe();
  }, []);

  async function load(id: string) {
    setUid(id);
    await Promise.all([
      loadProfile(id),
      loadTodayPick(),
      loadStats(id),
      loadRecent(id),
      loadStreak(id),
    ]);
    setRefreshing(false);
  }

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", id)
      .maybeSingle();
    setUsername(data?.username ?? "");
  }

  async function loadTodayPick() {
    try {
      const raw = await AsyncStorage.getItem("tw_color_v3");
      if (raw) {
        const p = JSON.parse(raw) as DayPick;
        setTodayPick(p.date === today() ? p : null);
      }
    } catch {}
  }

  async function loadStats(id: string) {
    const [distanceRes, photosRes] = await Promise.all([
      supabase.from("tw_albums").select("distance_meters").eq("user_id", id),
      supabase
        .from("tw_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", id),
    ]);
    const totalM = (distanceRes.data ?? []).reduce(
      (sum: number, a: { distance_meters: number | null }) =>
        sum + (a.distance_meters ?? 0),
      0,
    );
    setDistanceM(totalM);
    setPhotos(photosRes.count ?? 0);
  }

  async function loadStreak(id: string) {
    const { data } = await supabase
      .from("tw_albums")
      .select("created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    if (!data) return;
    const dates = [
      ...new Set(
        data.map((a: { created_at: string }) => a.created_at.slice(0, 10)),
      ),
    ] as string[];
    setStreak(computeStreak(dates));
  }

  async function loadRecent(id: string) {
    const { data } = await supabase
      .from("tw_albums")
      .select(
        "id, color_name, color_hex, created_at, tw_submissions(photo_path)",
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(4);
    setRecent(
      (data ?? []).map(
        (a: {
          id: string;
          color_name: string;
          color_hex: string;
          created_at: string;
          tw_submissions: { photo_path: string }[];
        }) => {
          const first = a.tw_submissions?.[0]?.photo_path ?? null;
          return {
            id: a.id,
            color_name: a.color_name,
            color_hex: a.color_hex,
            created_at: a.created_at,
            photo_count: a.tw_submissions?.length ?? 0,
            thumbnail_url: first
              ? supabase.storage.from("game-photos").getPublicUrl(first).data
                  .publicUrl
              : null,
          };
        },
      ),
    );
  }

  const todayColor = todayPick ? WALK_COLORS[todayPick.colorIdx] : null;
  const hasStats = distanceM > 0 || photos > 0 || streak > 0;

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (uid) {
                setRefreshing(true);
                void load(uid);
              }
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.greetingSmall}>{greeting()}</Text>
            <Text style={s.greetingName}>{username || "Explorer"}</Text>
            <Text style={s.tagline}>{tagline}</Text>
          </View>
          <View style={s.mascotWrap}>
            <Animated.Image
              source={require("../../assets/mascot.png")}
              style={[s.mascot, { transform: [{ translateY: mascotY }] }]}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Streak */}
        {streak > 0 && (
          <TouchableOpacity
            style={s.streakBanner}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/index" as never)}
          >
            <View style={s.streakIconWrap}>
              <Text style={s.streakFire}>🔥</Text>
            </View>
            <View style={s.streakText}>
              <Text style={s.streakCount}>{streak} day streak</Text>
              <Text style={s.streakSub}>Keep it going — walk today!</Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* Today's color */}
        {todayColor ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/index" as never)}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: todayColor.hex }]} />
            <View
              style={[s.heroInner, { backgroundColor: `${todayColor.hex}12` }]}
            >
              <Text style={s.heroEyebrow}>today's color</Text>
              <Text style={[s.heroColorName, { color: todayColor.hex }]}>
                {todayColor.name}
              </Text>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  {todayPick?.photoCount
                    ? `${todayPick.photoCount} ${todayPick.photoCount === 1 ? "photo" : "photos"} captured`
                    : todayPick?.albumId
                      ? "walk started"
                      : "ready to walk"}
                </Text>
                <View style={[s.heroBtn, { backgroundColor: todayColor.hex }]}>
                  <Camera size={13} color="#fff" />
                  <Text style={s.heroBtnText}>
                    {todayPick?.albumId ? "continue" : "start"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.spinCard}
            onPress={() => router.push("/(tabs)/index" as never)}
            activeOpacity={0.9}
          >
            <View style={s.spinLeft}>
              <Text style={s.spinEyebrow}>today's color</Text>
              <Text style={s.spinTitle}>Not revealed yet</Text>
              <Text style={s.spinSub}>Tap to spin the wheel</Text>
            </View>
            <Text style={s.spinGlyph}>🎡</Text>
          </TouchableOpacity>
        )}

        {/* Quick-start */}
        <View style={s.quickRow}>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => router.push("/(tabs)/index" as never)}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor: primaryTint }]}>
              <Footprints size={20} color={colors.primary} />
            </View>
            <View style={s.quickLabelRow}>
              <Text style={s.quickLabel}>Color Walk</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </View>
            <Text style={s.quickSub}>Photograph today's color</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.quickCard}
            onPress={() => router.push("/(tabs)/camera")}
            activeOpacity={0.85}
          >
            <View style={[s.quickIcon, { backgroundColor: primaryTint }]}>
              <MapPin size={20} color={colors.primary} />
            </View>
            <View style={s.quickLabelRow}>
              <Text style={s.quickLabel}>Hunt</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </View>
            <Text style={s.quickSub}>Find hidden objects nearby</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {hasStats && (
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Footprints
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>{(distanceM / 1609.34).toFixed(1)}</Text>
              <Text style={s.statLabel}>miles walked</Text>
            </View>
            <View style={s.statCard}>
              <Camera
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>{photos}</Text>
              <Text style={s.statLabel}>
                {photos === 1 ? "photo" : "photos"}
              </Text>
            </View>
            <View style={s.statCard}>
              <CalendarDays
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>{streak}</Text>
              <Text style={s.statLabel}>day streak</Text>
            </View>
          </View>
        )}

        {/* Recent activity */}
        {recent.length > 0 && (
          <View style={s.recentSection}>
            <TouchableOpacity
              style={s.recentHeader}
              activeOpacity={0.7}
              onPress={() => router.push("/(tabs)/index" as never)}
            >
              <Text style={s.recentHeading}>Recent activity</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            {recent.map((album, i) => (
              <TouchableOpacity
                key={album.id}
                style={[s.recentRow, i < recent.length - 1 && s.recentDivider]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/album/[id]",
                    params: {
                      id: album.id,
                      color: album.color_hex,
                      name: album.color_name,
                      paths: "[]",
                    },
                  })
                }
              >
                {album.thumbnail_url ? (
                  <Image
                    source={{ uri: album.thumbnail_url }}
                    style={s.thumb}
                  />
                ) : (
                  <View
                    style={[
                      s.thumbPlaceholder,
                      { backgroundColor: `${album.color_hex}33` },
                    ]}
                  >
                    <View
                      style={[s.thumbDot, { backgroundColor: album.color_hex }]}
                    />
                  </View>
                )}
                <View style={s.recentText}>
                  <Text style={s.recentName}>{album.color_name}</Text>
                  <Text style={s.recentMeta}>
                    {album.photo_count > 0 ? `Photo · ` : ""}
                    {relativeTime(album.created_at)}
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerText: { flex: 1, paddingTop: 4, paddingRight: 12 },
  greetingSmall: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: "500",
    marginBottom: 2,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    color: colors.foreground,
  },
  tagline: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  mascotWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mascot: { width: 60, height: 60 },

  // Streak
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  streakIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  streakFire: { fontSize: 20 },
  streakText: { flex: 1 },
  streakCount: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.3,
  },
  streakSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 1 },

  // Hero
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroAccent: { width: 5 },
  heroInner: { flex: 1, padding: 20, gap: 4 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  heroColorName: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 2,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  heroMeta: { fontSize: 13, color: colors.mutedForeground },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  // Spin card
  spinCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  spinLeft: { gap: 3 },
  spinEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  spinTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  spinSub: { fontSize: 13, color: colors.mutedForeground },
  spinGlyph: { fontSize: 44 },

  // Quick-start
  quickRow: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  quickSub: { fontSize: 12, color: colors.mutedForeground, lineHeight: 16 },

  // Stats
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Recent
  recentSection: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 10,
  },
  recentHeading: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  recentDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbDot: { width: 14, height: 14, borderRadius: 7 },
  recentText: { flex: 1, gap: 2 },
  recentName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  recentMeta: { fontSize: 12, color: colors.mutedForeground },
});
