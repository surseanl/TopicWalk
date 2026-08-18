import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      <View style={s.content}>
        <Text style={s.title}>Home</Text>
        <Text style={s.muted}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
});
