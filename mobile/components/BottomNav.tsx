import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Crosshair, Footprints, House, User } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../lib/theme";

const HIDDEN = new Set(["friends"]);
const ICON_SIZE = 22;

function tabIcon(name: string, focused: boolean) {
  const color = focused ? colors.primary : "#78716c";
  if (name === "home") return <House size={ICON_SIZE} color={color} />;
  if (name === "index") return <Footprints size={ICON_SIZE} color={color} />;
  if (name === "camera") return <Crosshair size={ICON_SIZE} color={color} />;
  return <User size={ICON_SIZE} color={color} />;
}

export function BottomNav({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r) => !HIDDEN.has(r.name));

  return (
    <View style={[s.container, { paddingBottom: insets.bottom || 12 }]}>
      <View style={s.bar}>
        {visibleRoutes.map((route) => {
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
    backgroundColor: "#ffffff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e7e5e4",
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
    color: "#78716c",
  },
  labelActive: {
    color: colors.primary,
  },
});
