import { useRouter } from "expo-router";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

type Photo = {
  id: string;
  label: string;
  sublabel: string;
  photoPath: string;
  table: "tw_submissions" | "tw_mascots";
};

export default function AdminScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: load only runs on mount
  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: subs }, { data: mascots }] = await Promise.all([
      supabase
        .from("tw_submissions")
        .select("id, display_name, topic_label, photo_path, submitted_at")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("tw_mascots")
        .select("id, hider_name, photo_path, hidden_at")
        .order("hidden_at", { ascending: false }),
    ]);

    const list: Photo[] = [
      ...(subs ?? []).map((s) => ({
        id: s.id,
        label: s.display_name ?? "Unknown",
        sublabel: s.topic_label ?? "",
        photoPath: s.photo_path,
        table: "tw_submissions" as const,
      })),
      ...(mascots ?? []).map((m) => ({
        id: m.id,
        label: m.hider_name ?? "Unknown",
        sublabel: "Mascot",
        photoPath: m.photo_path,
        table: "tw_mascots" as const,
      })),
    ];

    setPhotos(list);
    setLoading(false);
  }

  function confirmDelete(photo: Photo) {
    Alert.alert("Delete photo?", `By ${photo.label} — this cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deletePhoto(photo),
      },
    ]);
  }

  async function deletePhoto(photo: Photo) {
    setDeleting(photo.id);
    await supabase.from(photo.table).delete().eq("id", photo.id);
    await supabase.storage.from("game-photos").remove([photo.photoPath]);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setDeleting(null);
  }

  const url = (path: string) =>
    supabase.storage.from("game-photos").getPublicUrl(path).data.publicUrl;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.title}>Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : photos.length === 0 ? (
        <View style={s.centered}>
          <Text style={s.muted}>No photos yet.</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={s.card}>
              <Image
                source={{ uri: url(item.photoPath) }}
                style={s.thumb}
                resizeMode="cover"
              />
              <View style={s.cardBody}>
                <Text style={s.cardLabel} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={s.cardSub} numberOfLines={1}>
                  {item.sublabel}
                </Text>
                <TouchableOpacity
                  onPress={() => confirmDelete(item)}
                  disabled={deleting === item.id}
                  style={s.deleteBtn}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.destructive}
                    />
                  ) : (
                    <>
                      <Trash2 size={12} color={colors.destructive} />
                      <Text style={s.deleteBtnText}>Delete</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.4,
  },
  grid: { padding: 10, gap: 10 },
  card: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: "100%", aspectRatio: 1 },
  cardBody: { padding: 8, gap: 2 },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.foreground,
  },
  cardSub: { fontSize: 11, color: colors.mutedForeground },
  deleteBtn: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.destructive,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
});
