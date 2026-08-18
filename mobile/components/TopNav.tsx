import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export function TopNav() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      {/* Logo */}
      <Image
        source={require("../assets/logo.png")}
        style={s.logo}
        resizeMode="contain"
      />

      {/* Auth actions */}
      <View style={s.actions}>
        {loggedIn ? (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={s.outlineBtn}
          >
            <Text style={s.outlineBtnText}>Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/profile")}
              style={s.outlineBtn}
            >
              <Text style={s.outlineBtnText}>Sign in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/profile",
                  params: { tab: "signup" },
                })
              }
              style={s.primaryBtn}
            >
              <Text style={s.primaryBtnText}>Sign up</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    height: 36,
    width: 156,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  outlineBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineBtnText: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  primaryBtn: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  primaryBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
});
