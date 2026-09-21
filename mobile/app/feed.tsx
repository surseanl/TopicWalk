import { useRouter } from "expo-router";
import { ChevronLeft, LayoutGrid, Rows } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { todayUTC } from "@/lib/date";
import { SnappyAvatar } from "../components/SnappyAvatar";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { WALK_COLORS } from "../lib/topics";

const { width: SW, height: SH } = Dimensions.get("window");
const PHOTO_W = SW - 32;
const PHOTO_H = Math.round(SH * 0.58);

// ── Types ─────────────────────────────────────────────────────────────────────

type WalkEntry = {
  userId: string;
  username: string;
  colorName: string;
  photos: string[];
  avatarBg?: string;
  mascotColor?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function colorHex(name: string): string {
  return WALK_COLORS.find((c) => c.name === name)?.hex ?? "#f97316";
}

function isLight(name: string): boolean {
  return ["White", "Tan", "Silver", "Yellow", "Gold"].includes(name);
}

const todayStr = todayUTC;

function dateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<WalkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoIndices, setPhotoIndices] = useState<Map<string, number>>(
    new Map(),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once
  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    const me = session.user.id;
    setUserId(me);

    const { data: friendRows } = await supabase
      .from("tw_friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
      .eq("status", "accepted");

    const friendIds: string[] = (friendRows ?? []).map((f) =>
      f.requester_id === me ? f.addressee_id : f.requester_id,
    );
    const allIds = [me, ...friendIds];

    const today = todayStr();
    const { data: subs } = await supabase
      .from("tw_submissions")
      .select("user_id, topic_label, photo_path, submitted_at")
      .eq("topic_category", "Color")
      .gte("submitted_at", `${today}T00:00:00Z`)
      .lte("submitted_at", `${today}T23:59:59Z`)
      .in("user_id", allIds)
      .order("submitted_at", { ascending: true });

    if (!subs?.length) {
      setLoading(false);
      return;
    }

    const { data: users } = await supabase
      .from("tw_users")
      .select("id, username, avatar_color, mascot_color")
      .in("id", allIds);
    const usernameMap = new Map<string, string>(
      (users ?? []).map((u) => [u.id, u.username]),
    );
    const avatarBgMap = new Map<string, string>(
      (users ?? []).map((u) => [u.id, u.avatar_color ?? ""]),
    );
    const mascotColorMap = new Map<string, string>(
      (users ?? []).map((u) => [u.id, u.mascot_color ?? ""]),
    );

    const byUser = new Map<string, WalkEntry>();
    for (const sub of subs) {
      const existing = byUser.get(sub.user_id);
      const photoUrl = supabase.storage
        .from("game-photos")
        .getPublicUrl(sub.photo_path).data.publicUrl;
      if (existing) {
        existing.colorName = sub.topic_label;
        existing.photos.push(photoUrl);
      } else {
        byUser.set(sub.user_id, {
          userId: sub.user_id,
          username: usernameMap.get(sub.user_id) ?? "unknown",
          colorName: sub.topic_label,
          photos: [photoUrl],
          avatarBg: avatarBgMap.get(sub.user_id),
          mascotColor: mascotColorMap.get(sub.user_id),
        });
      }
    }

    const ordered: WalkEntry[] = [];
    const myEntry = byUser.get(me);
    if (myEntry) ordered.push(myEntry);
    for (const fid of friendIds) {
      const e = byUser.get(fid);
      if (e) ordered.push(e);
    }
    setEntries(ordered);
    setLoading(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={s.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={s.loadingScreen}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backBtn, { top: insets.top + 12 }]}
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎨</Text>
        <Text style={s.emptyTitle}>No walks yet today</Text>
        <Text style={s.emptySub}>
          Spin the wheel and start your color walk — your friends' photos will
          show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Back button — floats over everything */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={[s.backBtn, { top: insets.top + 12 }]}
      >
        <ChevronLeft size={22} color="#fff" />
      </TouchableOpacity>

      {/* Vertical reel — one walk per page */}
      <FlatList
        data={entries}
        keyExtractor={(e) => e.userId}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        renderItem={({ item: entry }) => (
          <ReelSlide
            entry={entry}
            userId={userId}
            insets={insets}
            photoIndex={photoIndices.get(entry.userId) ?? 0}
            onPhotoIndex={(i) =>
              setPhotoIndices((m) => new Map(m).set(entry.userId, i))
            }
          />
        )}
      />
    </View>
  );
}

// ── Reel Slide ────────────────────────────────────────────────────────────────

function ReelSlide({
  entry,
  userId,
  insets,
  photoIndex,
  onPhotoIndex,
}: {
  entry: WalkEntry;
  userId: string | null;
  insets: { top: number; bottom: number };
  photoIndex: number;
  onPhotoIndex: (i: number) => void;
}) {
  const hex = colorHex(entry.colorName);
  const light = isLight(entry.colorName);
  const fg = light ? "rgba(0,0,0,0.85)" : "#fff";
  const fgMuted = light ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.55)";
  const displayName = entry.userId === userId ? "You" : entry.username;
  const [viewMode, setViewMode] = useState<"swipe" | "grid">("swipe");

  return (
    <View style={{ width: SW, height: SH, backgroundColor: hex }}>
      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 56 }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[s.colorLabel, { color: fg }]}>{entry.colorName}</Text>
          <Text style={[s.dateLabel, { color: fgMuted }]}>{dateLabel()}</Text>
        </View>
        <View style={s.userRow}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[s.username, { color: fg }]}>{displayName}</Text>
            <Text style={[s.photoCount, { color: fgMuted }]}>
              {entry.photos.length}{" "}
              {entry.photos.length === 1 ? "photo" : "photos"}
            </Text>
          </View>
          <SnappyAvatar
            bgId={entry.avatarBg}
            tintColor={entry.mascotColor}
            size={40}
          />
        </View>
      </View>

      {/* ── Photo card ── */}
      <View style={s.photoCard}>
        {viewMode === "swipe" ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / PHOTO_W);
              onPhotoIndex(idx);
            }}
            style={{ borderRadius: 28 }}
          >
            {entry.photos.map((url, i) => (
              <Image
                // biome-ignore lint/suspicious/noArrayIndexKey: stable photo order
                key={i}
                source={{ uri: url }}
                style={s.photo}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={s.gridWrap}>
            {entry.photos.map((url, i) => (
              <Image
                // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                key={i}
                source={{ uri: url }}
                style={s.gridThumb}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>

      {/* ── Below photo: dots + toggle ── */}
      <View style={s.belowPhoto}>
        {entry.photos.length > 1 && viewMode === "swipe" && (
          <View style={s.dots}>
            {entry.photos.map((_, i) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                key={i}
                style={[
                  s.dot,
                  { backgroundColor: fgMuted },
                  i === photoIndex && [s.dotActive, { backgroundColor: fg }],
                ]}
              />
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[
            s.togglePill,
            {
              backgroundColor: light
                ? "rgba(0,0,0,0.1)"
                : "rgba(255,255,255,0.18)",
              borderColor: light ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.3)",
            },
          ]}
          onPress={() => setViewMode((m) => (m === "swipe" ? "grid" : "swipe"))}
          activeOpacity={0.75}
        >
          {viewMode === "swipe" ? (
            <LayoutGrid size={18} color={fg} />
          ) : (
            <Rows size={18} color={fg} />
          )}
          <Text style={[s.toggleLabel, { color: fg }]}>
            {viewMode === "swipe" ? "Grid" : "Swipe"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 21,
  },

  // Back button
  backBtn: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorLabel: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  // Photo card
  photoCard: {
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: "hidden",
    height: PHOTO_H,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  photo: {
    width: PHOTO_W,
    height: PHOTO_H,
  },
  gridWrap: {
    width: PHOTO_W,
    height: PHOTO_H,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  gridThumb: {
    width: (PHOTO_W - 4) / 2,
    height: (PHOTO_W - 4) / 2,
  },

  // Below photo
  belowPhoto: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: "center",
    gap: 12,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  photoCount: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  togglePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
