import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, Footprints, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
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

export default function HomeScreen() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [todayPick, setTodayPick] = useState<DayPick | null>(null);
  const [streak, setStreak] = useState(0);
  const [recent, setRecent] = useState<RecentAlbum[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: mount only
  useEffect(() => {
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
          <Text style={s.greetingSmall}>{greeting()}</Text>
          <Text style={s.greetingName}>{username || "Explorer"}</Text>
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
              style={[s.heroInner, { backgroundColor: `${todayColor.hex}22` }]}
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
              <Footprints size={26} color={colors.primary} />
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
              <MapPin size={26} color={colors.primary} />
            </View>
            <View style={s.quickLabelRow}>
              <Text style={s.quickLabel}>Hunt</Text>
              <ChevronRight size={14} color={colors.mutedForeground} />
            </View>
            <Text style={s.quickSub}>Find hidden objects nearby</Text>
          </TouchableOpacity>
        </View>

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
  header: { paddingTop: 4 },
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
  heroAccent: { width: 6 },
  heroInner: { flex: 1, padding: 24, gap: 4 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  heroColorName: {
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.5,
    marginTop: 4,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  heroMeta: { fontSize: 13, color: colors.mutedForeground },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  heroBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // Spin card
  spinCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.muted,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  spinLeft: { gap: 4 },
  spinEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  spinTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  spinSub: { fontSize: 13, color: colors.mutedForeground },
  spinGlyph: { fontSize: 52 },

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
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  quickSub: { fontSize: 12, color: colors.mutedForeground, lineHeight: 16 },

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
