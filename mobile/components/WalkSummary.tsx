import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "../lib/theme";

type Pos = { lat: number; lng: number };

export type WalkTopic =
  | { type: "color"; colorName: string; colorHex: string }
  | {
      type: "solo";
      objects: Array<{
        img: number;
        label: string;
      }>;
    };

type Props = {
  visible: boolean;
  onClose: () => void;
  topic: WalkTopic;
  photoPaths: string[];
  path: Pos[];
  distanceMeters: number;
  durationSeconds: number;
};

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  return `${m}m ${sec}s`;
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m / 1000).toFixed(2)}km`;
}

function pathToPolyline(path: Pos[], w: number, h: number): string {
  if (path.length < 2) return "";
  const lats = path.map((p) => p.lat);
  const lngs = path.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 8;
  const scaleX = maxLng === minLng ? 1 : (w - pad * 2) / (maxLng - minLng);
  const scaleY = maxLat === minLat ? 1 : (h - pad * 2) / (maxLat - minLat);
  return path
    .map((p) => {
      const x = pad + (p.lng - minLng) * scaleX;
      const y = h - pad - (p.lat - minLat) * scaleY;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function WalkSummary({
  visible,
  onClose,
  topic,
  photoPaths,
  path,
  distanceMeters,
  durationSeconds,
}: Props) {
  const MAP_W = 280;
  const MAP_H = 160;
  const pts = pathToPolyline(path, MAP_W, MAP_H);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={s.root}>
        {/* Header */}
        <View style={s.header}>
          {topic.type === "color" ? (
            <View style={s.colorTopic}>
              <View style={[s.colorDot, { backgroundColor: topic.colorHex }]} />
              <Text style={s.topicTitle}>{topic.colorName}</Text>
            </View>
          ) : (
            <View style={s.soloTopic}>
              {topic.objects.map((obj) => (
                <View key={obj.label} style={s.soloObj}>
                  <Image
                    source={obj.img}
                    style={s.soloIconCircle}
                    resizeMode="contain"
                  />
                  <Text style={s.soloLabel}>{obj.label}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={s.walkDone}>Walk complete!</Text>
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statVal}>{formatDistance(distanceMeters)}</Text>
              <Text style={s.statLbl}>Distance</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{formatDuration(durationSeconds)}</Text>
              <Text style={s.statLbl}>Duration</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statBox}>
              <Text style={s.statVal}>{photoPaths.length}</Text>
              <Text style={s.statLbl}>Photos</Text>
            </View>
          </View>

          {/* Route map */}
          {path.length >= 2 && (
            <View style={s.mapCard}>
              <Text style={s.sectionLabel}>Route</Text>
              <Svg width={MAP_W} height={MAP_H} style={s.routeSvg}>
                <Polyline
                  points={pts}
                  fill="none"
                  stroke={colors.primary}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}

          {/* Photos */}
          {photoPaths.length > 0 && (
            <View style={s.photosSection}>
              <Text style={s.sectionLabel}>Photos taken</Text>
              <View style={s.photoGrid}>
                {photoPaths.map((p) => (
                  <View key={p} style={s.photoThumb}>
                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <Text style={{ fontSize: 32, textAlign: "center" }}>
                      📷
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 8,
  },
  colorTopic: { flexDirection: "row", alignItems: "center", gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  topicTitle: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  soloTopic: { flexDirection: "row", gap: 16 },
  soloObj: { alignItems: "center", gap: 6 },
  soloIconCircle: {
    width: 52,
    height: 52,
  },
  soloLabel: { fontSize: 12, fontWeight: "700", color: colors.mutedForeground },
  walkDone: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32, gap: 24 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statVal: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.foreground,
    letterSpacing: -0.3,
  },
  statLbl: { fontSize: 11, fontWeight: "600", color: colors.mutedForeground },
  mapCard: {
    backgroundColor: colors.muted,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    alignItems: "center",
  },
  sectionLabel: {
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  routeSvg: { borderRadius: 8 },
  photosSection: { gap: 10 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtn: {
    margin: 20,
    height: 54,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: { fontSize: 17, fontWeight: "800", color: "#fff" },
});
