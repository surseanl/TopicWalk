import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const url = Linking.useURL();

  // Handle deep links for OAuth redirect and email confirmation
  useEffect(() => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      // Hash-based tokens (implicit OAuth flow)
      const hashParams = new URLSearchParams(parsed.hash.replace("#", ""));
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      if (access_token && refresh_token) {
        void supabase.auth.setSession({ access_token, refresh_token });
        return;
      }
      // PKCE code (email confirmation flow)
      const code = parsed.searchParams.get("code");
      if (code) {
        void supabase.auth.exchangeCodeForSession(code);
      }
    } catch {
      // ignore malformed URLs
    }
  }, [url]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="archive" />
      </Stack>
    </>
  );
}
