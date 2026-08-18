import type { Session } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

type Submission = {
  id: string;
  topic_category: string;
  topic_label: string;
  photo_path: string;
  submitted_at: string;
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CATEGORY_COLORS: Record<string, string> = {
  Color: "#f97316",
  Shape: "#0ea5e9",
  Theme: "#8b5cf6",
  Object: "#10b981",
};

const CATEGORY_WASH: Record<string, string> = {
  Color: "#fff7ed",
  Shape: "#f0f9ff",
  Theme: "#faf5ff",
  Object: "#f0fdf4",
};

function cellAccent(category: string, label: string): string {
  if (category === "Color") {
    const match = label.match(/#[A-Fa-f0-9]{6}/);
    if (match) return match[0];
  }
  return CATEGORY_COLORS[category] ?? "#6366f1";
}

const H_PAD = 16;
const CELL_GAP = 3;
const SCREEN_W = Dimensions.get("window").width;
const CELL_SIZE = Math.floor((SCREEN_W - H_PAD * 2 - CELL_GAP * 6) / 7);

export default function ArchiveScreen() {
  const router = useRouter();
  const now = new Date();
  const [session, setSession] = useState<Session | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) void fetchAll(session.user.id);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user) void fetchAll(session.user.id);
      else {
        setSubmissions([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchAll(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from("tw_submissions")
      .select("id, topic_category, topic_label, photo_path, submitted_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: true });
    if (data) setSubmissions(data as Submission[]);
    setLoading(false);
  }

  const byDate = new Map<string, Submission[]>();
  for (const s of submissions) {
    const d = new Date(s.submitted_at).toLocaleDateString("en-CA");
    const arr = byDate.get(d);
    if (arr) arr.push(s);
    else byDate.set(d, [s]);
  }

  const nowDate = new Date();
  const nowYear = nowDate.getFullYear();
  const nowMonth = nowDate.getMonth();
  const todayStr = nowDate.toLocaleDateString("en-CA");
  const atLimit = year > nowYear || (year === nowYear && month >= nowMonth);

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    setSelected(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (atLimit) return;
    setSelected(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const selectedSubs = selected ? (byDate.get(selected) ?? []) : [];
  const detailSub0 = selectedSubs[0];
  const detailAccent = detailSub0
    ? cellAccent(detailSub0.topic_category, detailSub0.topic_label)
    : colors.primary;
  const detailWash = detailSub0
    ? (CATEGORY_WASH[detailSub0.topic_category] ?? colors.muted)
    : colors.muted;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
      {/* Fullscreen photo lightbox */}
      <Modal
        visible={!!lightboxUrl}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxUrl(null)}
      >
        <View style={s.lightbox}>
          {lightboxUrl && (
            <Image
              source={{ uri: lightboxUrl }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            onPress={() => setLightboxUrl(null)}
            style={s.lightboxClose}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Header with back button */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Archive</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        {/* Sign-in banner for guests */}
        {!session?.user && !loading && (
          <View style={s.signInBanner}>
            <Text style={s.signInText}>
              Sign in to see your walk history — go to Profile →
            </Text>
          </View>
        )}

        {/* Month navigator */}
        <View style={s.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={s.navBtn}>
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.monthLabel}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity
            onPress={nextMonth}
            disabled={atLimit}
            style={[s.navBtn, atLimit && { opacity: 0.3 }]}
          >
            <ChevronRight size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <>
            {/* Day-of-week headers */}
            <View style={s.dayRow}>
              {DAY_LABELS.map((d, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static day labels
                <Text key={i} style={s.dayHeader}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Calendar grid */}
            <View style={s.grid}>
              {Array.from({ length: firstDow }, (_, i) => i).map((dow) => (
                <View
                  key={`sp-${dow}`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const subs = byDate.get(dateStr) ?? [];
                const hasEntry = subs.length > 0;
                const isSelected = selected === dateStr;
                const isToday = dateStr === todayStr;
                const firstSub = subs[0];
                const accent =
                  hasEntry && firstSub
                    ? cellAccent(firstSub.topic_category, firstSub.topic_label)
                    : null;
                const dotColor =
                  hasEntry && firstSub
                    ? (CATEGORY_COLORS[firstSub.topic_category] ?? "#6366f1")
                    : null;

                return (
                  <TouchableOpacity
                    key={dateStr}
                    activeOpacity={hasEntry ? 0.85 : 1}
                    onPress={() => {
                      if (!hasEntry) return;
                      setSelected(isSelected ? null : dateStr);
                    }}
                    style={[
                      s.cell,
                      { width: CELL_SIZE, height: CELL_SIZE },
                      isToday && !hasEntry && s.cellToday,
                      accent && {
                        borderWidth: isSelected ? 3 : 2.5,
                        borderColor: accent,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.cellNum,
                        isToday && {
                          color: colors.foreground,
                          fontWeight: "700",
                        },
                        hasEntry && {
                          color: colors.foreground,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {day}
                    </Text>
                    {dotColor && (
                      <View
                        style={[s.cellDot, { backgroundColor: dotColor }]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selected day detail */}
            {selected && selectedSubs.length > 0 && (
              <View style={s.detailCard}>
                <View
                  style={[s.detailStrip, { backgroundColor: detailAccent }]}
                />
                <View style={[s.detailHeader, { backgroundColor: detailWash }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.detailDate}>
                      {new Date(`${selected}T12:00:00`).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </Text>
                    {detailSub0 && (
                      <Text style={s.detailTopic} numberOfLines={1}>
                        <Text style={{ color: colors.mutedForeground }}>
                          {detailSub0.topic_category}:{" "}
                        </Text>
                        {detailSub0.topic_label}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelected(null)}
                    style={s.closeBtn}
                  >
                    <X size={15} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {selectedSubs.map((sub) => {
                  const url = supabase.storage
                    .from("game-photos")
                    .getPublicUrl(sub.photo_path).data.publicUrl;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      activeOpacity={0.9}
                      onPress={() => setLightboxUrl(url)}
                    >
                      <Image
                        source={{ uri: url }}
                        style={s.detailPhoto}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Empty state */}
            {submissions.length === 0 && session?.user && (
              <View style={s.emptyState}>
                <Text style={[s.muted, { textAlign: "center" }]}>
                  No entries yet — go on a Free Walk to start your archive!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: H_PAD,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 18,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  signInBanner: {
    backgroundColor: colors.muted,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signInText: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: "center",
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.muted,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  dayRow: {
    flexDirection: "row",
    gap: CELL_GAP,
    marginBottom: -8,
  },
  dayHeader: {
    width: CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CELL_GAP,
  },
  cell: {
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cellNum: {
    fontSize: 12,
    fontWeight: "500",
    color: `${colors.mutedForeground}99`,
  },
  cellDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  detailStrip: {
    height: 4,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  detailDate: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 3,
  },
  detailTopic: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  detailPhoto: {
    width: "100%",
    aspectRatio: 1,
  },
  emptyState: {
    backgroundColor: colors.muted,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
  },

  // ── Lightbox ──────────────────────────────────────────────────────────────
  lightbox: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
