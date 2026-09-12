import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

const W = Dimensions.get("window").width;
const GAP = 8;
const HPAD = 16;
const PHOTO_W = (W - HPAD * 2 - GAP) / 2;

function isLightColor(hex: string): boolean {
  if (!hex.startsWith("#") || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

export default function AlbumDetailScreen() {
  const { color, name, paths } = useLocalSearchParams<{
    color: string;
    name: string;
    paths: string;
  }>();
  const router = useRouter();

  const photoPaths = useMemo<string[]>(() => {
    try {
      return paths ? (JSON.parse(paths) as string[]) : [];
    } catch {
      return [];
    }
  }, [paths]);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const bg = color ?? "#6b7280";
  const light = isLightColor(bg);
  const fg = light ? "#111111" : "#ffffff";
  const fgMuted = light ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.6)";
  const overlayBg = light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)";

  return (
    <SafeAreaView style={[s.root, { backgroundColor: bg }]}>
      {/* Fullscreen photo lightbox */}
      <Modal
        visible={!!lightboxUrl}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxUrl(null)}
      >
        <StatusBar hidden />
        <View style={s.lightbox}>
          {lightboxUrl && (
            <Image
              source={{ uri: lightboxUrl }}
              style={[s.lightboxImg, { borderColor: bg }]}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            onPress={() => setLightboxUrl(null)}
            style={s.lightboxClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <ChevronLeft size={22} color={fg} />
        <Text style={[s.backText, { color: fg }]}>Back</Text>
      </TouchableOpacity>

      {/* Hero header */}
      <View style={s.hero}>
        <View style={[s.dotRing, { backgroundColor: overlayBg }]}>
          <View
            style={[
              s.dot,
              { backgroundColor: bg, borderColor: overlayBg, borderWidth: 2 },
            ]}
          />
        </View>
        <Text style={[s.heroName, { color: fg }]}>{name ?? "Album"}</Text>
        <Text style={[s.heroCount, { color: fgMuted }]}>
          {`${photoPaths.length} photo${photoPaths.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {/* Divider */}
      <View style={[s.divider, { backgroundColor: overlayBg }]} />

      {/* Content */}
      {photoPaths.length === 0 ? (
        <View style={s.empty}>
          <Text style={[s.emptyText, { color: fgMuted }]}>No photos yet</Text>
        </View>
      ) : (
        <FlatList
          data={photoPaths}
          numColumns={2}
          keyExtractor={(p) => p}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const url = supabase.storage.from("game-photos").getPublicUrl(item)
              .data.publicUrl;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setLightboxUrl(url)}
              >
                <Image source={{ uri: url }} style={s.photo} resizeMode="cover" />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: "500",
  },
  hero: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
    gap: 10,
  },
  dotRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  heroName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  heroCount: {
    fontSize: 14,
    fontWeight: "400",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  grid: {
    paddingHorizontal: HPAD,
    paddingBottom: 32,
    gap: GAP,
  },
  row: {
    gap: GAP,
  },
  photo: {
    width: PHOTO_W,
    height: PHOTO_W,
    borderRadius: 12,
  },

  // Lightbox
  lightbox: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxImg: {
    width: W,
    height: W,
    borderWidth: 6,
    borderRadius: 4,
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
