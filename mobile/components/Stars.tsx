import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "../lib/theme";

const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarSvg({
  color = "#fbbf24",
  size = 16,
}: {
  color?: string;
  size?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={STAR_PATH} fill={color} />
    </Svg>
  );
}

type Rating = { user_id: string; score: number };

export function StarDisplay({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) {
    return <Text style={s.muted}>No ratings yet</Text>;
  }
  const avg =
    ratings.reduce((sum, r) => sum + Number(r.score), 0) / ratings.length;
  const rounded = Math.round(avg * 2) / 2;

  return (
    <View style={s.row}>
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill: 0 | 0.5 | 1 =
            rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <View key={i} style={{ width: 16, height: 16 }}>
              <View style={{ position: "absolute" }}>
                <StarSvg color="#d4d4d4" size={16} />
              </View>
              {fill > 0 && (
                <View
                  style={{
                    position: "absolute",
                    overflow: "hidden",
                    width: fill === 0.5 ? 8 : 16,
                  }}
                >
                  <StarSvg color="#fbbf24" size={16} />
                </View>
              )}
            </View>
          );
        })}
      </View>
      <Text style={s.muted}>
        {avg.toFixed(1)} ({ratings.length})
      </Text>
    </View>
  );
}

export function StarRatingWidget({
  submissionId,
  myScore,
  onRate,
}: {
  submissionId: string;
  myScore: number | null;
  onRate: (id: string, score: number) => void;
}) {
  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill =
          (myScore ?? 0) >= i ? 1 : (myScore ?? 0) >= i - 0.5 ? 0.5 : 0;
        return (
          <View key={i} style={{ flexDirection: "row" }}>
            <TouchableOpacity
              onPress={() => onRate(submissionId, i - 0.5)}
              style={{ width: 12, height: 24 }}
            >
              <View
                style={{ position: "absolute", overflow: "hidden", width: 12 }}
              >
                <StarSvg
                  color={fill >= 0.5 ? "#fbbf24" : "#d4d4d4"}
                  size={24}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRate(submissionId, i)}
              style={{ width: 12, height: 24 }}
            >
              <View
                style={{
                  position: "absolute",
                  left: -12,
                  overflow: "hidden",
                  width: 24,
                }}
              >
                <View
                  style={{
                    overflow: "hidden",
                    width: fill >= 1 ? 24 : fill >= 0.5 ? 12 : 24,
                  }}
                >
                  <StarSvg
                    color={fill >= 1 ? "#fbbf24" : "#d4d4d4"}
                    size={24}
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
      {myScore !== null && (
        <Text style={[s.muted, { marginLeft: 4 }]}>
          {myScore % 1 === 0 ? myScore.toFixed(0) : myScore.toFixed(1)}★
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  starsRow: { flexDirection: "row", gap: 2 },
  muted: { fontSize: 12, color: colors.mutedForeground },
});
