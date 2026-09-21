import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SnappyAvatar } from "../../components/SnappyAvatar";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";
import { WALK_COLORS } from "../../lib/topics";

type DayPick = {
  date: string;
  colorIdx: number;
  albumId: string | null;
  photoCount: number;
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

function formatDateHeader() {
  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
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
  const [_uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [avatarBgId, setAvatarBgId] = useState<string | undefined>(undefined);
  const [avatarTint, setAvatarTint] = useState<string | undefined>(undefined);
  const [todayPick, setTodayPick] = useState<DayPick | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalWalks, setTotalWalks] = useState(0);
  const [soloDaily, setSoloDaily] = useState<{
    indices: [number, number];
    done: [boolean, boolean];
  } | null>(null);
  const [huntGroupId, setHuntGroupId] = useState<string | null | undefined>(
    undefined,
  );
  const [huntMemberCount, setHuntMemberCount] = useState(0);
  const [longestHidden, setLongestHidden] = useState<{
    id: string;
    hider_name: string;
    hidden_at: string;
  } | null>(null);
  useFocusEffect(
    // biome-ignore lint/correctness/useExhaustiveDependencies: stable functions, focus-only refresh
    useCallback(() => {
      void loadTodayPick();
      void loadSoloDaily();
    }, []),
  );

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
      loadSoloDaily(),
      loadStreak(id),
      loadHuntGroup(id),
    ]);
  }

  async function loadHuntGroup(uid: string) {
    const { data } = await supabase
      .from("tw_hunt_members")
      .select("group_id")
      .eq("user_id", uid)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const gid = data?.group_id ?? null;
    setHuntGroupId(gid);
    if (gid) {
      const { count } = await supabase
        .from("tw_hunt_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", gid);
      setHuntMemberCount(count ?? 0);
      if ((count ?? 0) > 1) await loadLongestHidden(gid, uid);
    }
  }

  async function loadLongestHidden(groupId: string, uid: string) {
    const { data } = await supabase
      .from("tw_mascots")
      .select("id, hider_name, hidden_at")
      .eq("hunt_group_id", groupId)
      .neq("hider_user_id", uid)
      .is("found_at", null)
      .order("hidden_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setLongestHidden(data ?? null);
  }

  async function loadProfile(id: string) {
    const { data } = await supabase
      .from("tw_users")
      .select("username, avatar_color, mascot_color")
      .eq("id", id)
      .maybeSingle();
    setUsername(data?.username ?? "");
    setAvatarBgId(data?.avatar_color ?? undefined);
    setAvatarTint(data?.mascot_color ?? undefined);
  }

  async function loadSoloDaily() {
    try {
      const raw = await AsyncStorage.getItem("tw_solo_object_v1");
      if (!raw) return;
      const p = JSON.parse(raw) as {
        date: string;
        indices: [number, number];
        done?: [boolean, boolean];
      };
      const todayStr = new Date().toISOString().split("T")[0] ?? "";
      if (p.date === todayStr) {
        setSoloDaily({ indices: p.indices, done: p.done ?? [false, false] });
      }
    } catch {}
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
    setTotalWalks(dates.length);
  }

  const todayColor = todayPick ? WALK_COLORS[todayPick.colorIdx] : null;

  return (
    <SafeAreaView edges={[]} style={s.safe}>
      <View style={s.content}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={{ gap: 4 }}>
              <Text style={s.greetingName}>
                <Text style={s.greetingHello}>{greeting()}, </Text>
                {username || "Explorer"}
              </Text>
              <Text style={s.greetingSmall}>{formatDateHeader()}</Text>
            </View>
            {streak > 0 && (
              <View style={s.streakBanner}>
                <Text style={s.streakFire}>🔥</Text>
                <Text style={s.streakCount}>{streak} day streak</Text>
              </View>
            )}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statValue}>{totalWalks}</Text>
                <Text style={s.statLabel}>walks</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statValue}>{todayPick?.photoCount ?? 0}</Text>
                <Text style={s.statLabel}>photos today</Text>
              </View>
            </View>
          </View>
          <View style={s.headerAvatarSlot}>
            <SnappyAvatar
              bgId={avatarBgId}
              size={90}
              mascotSize={68}
              tintColor={avatarTint}
            />
          </View>
        </View>

        {/* Today's color */}
        {todayColor ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.navigate("/" as never)}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: todayColor.hex }]} />
            <View
              style={[s.heroInner, { backgroundColor: `${todayColor.hex}22` }]}
            >
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>today's color</Text>
                <Text style={[s.heroColorName, { color: todayColor.hex }]}>
                  {todayColor.name}
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  {todayPick?.photoCount
                    ? `${todayPick.photoCount} ${todayPick.photoCount === 1 ? "photo" : "photos"} taken — keep going!`
                    : todayPick?.albumId
                      ? "Walk started — take your first photo!"
                      : `Go outside and snap anything ${todayColor.name.toLowerCase()}!`}
                </Text>
                <View style={[s.heroBtn, { backgroundColor: todayColor.hex }]}>
                  <Text style={s.heroBtnText}>
                    {todayPick?.albumId ? "Continue" : "Start Walk"}
                  </Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.navigate("/" as never)}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: colors.border }]} />
            <View style={[s.heroInner, { backgroundColor: colors.muted }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>today's color</Text>
                <Text
                  style={[s.heroColorName, { color: colors.mutedForeground }]}
                >
                  Spin to start
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  Find out which color to capture today
                </Text>
                <View
                  style={[
                    s.heroBtn,
                    { backgroundColor: colors.mutedForeground },
                  ]}
                >
                  <Text style={s.heroBtnText}>Spin Now</Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Solo hunt */}
        {soloDaily ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/camera")}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: "#D97706" }]} />
            <View style={[s.heroInner, { backgroundColor: "#FFF3DC" }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>solo hunt</Text>
                <Text style={[s.heroColorName, { color: "#D97706" }]}>
                  {soloDaily.done.every(Boolean)
                    ? "All done!"
                    : "2 topics to find"}
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  {soloDaily.done.every(Boolean)
                    ? "Both topics captured today"
                    : `${soloDaily.done.filter(Boolean).length}/2 captured — keep hunting!`}
                </Text>
                <View style={[s.heroBtn, { backgroundColor: "#D97706" }]}>
                  <Text style={s.heroBtnText}>
                    {soloDaily.done.every(Boolean) ? "View" : "Hunt Now"}
                  </Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/camera")}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: colors.border }]} />
            <View style={[s.heroInner, { backgroundColor: colors.muted }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>solo hunt</Text>
                <Text
                  style={[s.heroColorName, { color: colors.mutedForeground }]}
                >
                  2 topics to find
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  Spin to get your daily photo challenges
                </Text>
                <View
                  style={[
                    s.heroBtn,
                    { backgroundColor: colors.mutedForeground },
                  ]}
                >
                  <Text style={s.heroBtnText}>Spin Now</Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Mascot hunt — group-aware */}
        {!huntGroupId || huntMemberCount <= 1 ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/camera")}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: colors.border }]} />
            <View style={[s.heroInner, { backgroundColor: colors.muted }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>mascot hunt</Text>
                <Text
                  style={[s.heroColorName, { color: colors.mutedForeground }]}
                >
                  Play with friends
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  Join or create a group to hide and seek mascots
                </Text>
                <View
                  style={[
                    s.heroBtn,
                    { backgroundColor: colors.mutedForeground },
                  ]}
                >
                  <Text style={s.heroBtnText}>Join Group</Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : longestHidden ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/camera")}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: "#D97706" }]} />
            <View style={[s.heroInner, { backgroundColor: "#FFF3DC" }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>mascot hunt</Text>
                <Text style={[s.heroColorName, { color: "#D97706" }]}>
                  {longestHidden.hider_name}'s mascot
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  Hidden {relativeTime(longestHidden.hidden_at)} — can you find
                  it?
                </Text>
                <View style={[s.heroBtn, { backgroundColor: "#D97706" }]}>
                  <Text style={s.heroBtnText}>Find It</Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push("/(tabs)/camera")}
            style={s.heroCard}
          >
            <View style={[s.heroAccent, { backgroundColor: colors.primary }]} />
            <View style={[s.heroInner, { backgroundColor: primaryTint }]}>
              <View style={s.heroLabel}>
                <Text style={s.heroEyebrow}>mascot hunt</Text>
                <Text style={[s.heroColorName, { color: colors.primary }]}>
                  Hide your mascot
                </Text>
              </View>
              <View style={s.heroFooter}>
                <Text style={s.heroMeta}>
                  Your group is waiting for you to hide one
                </Text>
                <View style={[s.heroBtn, { backgroundColor: colors.primary }]}>
                  <Text style={s.heroBtnText}>Hide Now</Text>
                  <ChevronRight size={12} color="#fff" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 150,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  headerAvatarSlot: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  greetingSmall: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  greetingHello: {
    fontWeight: "300",
    color: colors.mutedForeground,
  },
  greetingName: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -1,
    color: colors.foreground,
  },
  // Streak
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: primaryTint,
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  streakFire: { fontSize: 13 },
  streakCount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

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
  heroInner: { flex: 1, padding: 16, gap: 10 },
  heroLabel: { gap: 2 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.mutedForeground,
  },
  heroColorName: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 1,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroMeta: { fontSize: 13, color: colors.mutedForeground, flexShrink: 1 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    minWidth: 90,
  },
  heroBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
