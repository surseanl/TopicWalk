import { Crosshair, Footprints, House, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../lib/theme";

const HIDDEN = new Set(["friends"]);
const ICON_SIZE = 22;

function tabIcon(name: string, focused: boolean) {
  const color = focused ? colors.primary : "#9CA3AF";
  if (name === "home") return <House size={ICON_SIZE} color={color} />;
  if (name === "index") return <Footprints size={ICON_SIZE} color={color} />;
  if (name === "camera") return <Crosshair size={ICON_SIZE} color={color} />;
  return <User size={ICON_SIZE} color={color} />;
}

// biome-ignore lint/suspicious/noExplicitAny: expo-router/react-navigation type mismatch
export function BottomNav({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(
    // biome-ignore lint/suspicious/noExplicitAny: expo-router/react-navigation type mismatch
    (r: any) => !HIDDEN.has(r.name),
  );

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 12 }]}>
      <View style={s.bar}>
        {/* biome-ignore lint/suspicious/noExplicitAny: expo-router/react-navigation type mismatch */}
        {visibleRoutes.map((route: any) => {
          const globalIndex = state.routes.indexOf(route);
          const focused = state.index === globalIndex;
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={s.tab}
            >
              {tabIcon(route.name, focused)}
              <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    alignItems: "center",
    paddingTop: 8,
  },
  bar: {
    flexDirection: "row",
    gap: 4,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    paddingVertical: 4,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  labelActive: {
    color: colors.primary,
  },
});
