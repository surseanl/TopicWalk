import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ChevronRight, Eye, EyeOff, LogOut, Users } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";
import { validateUsername } from "../../lib/username-filter";

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<"login" | "signup">(
    tabParam === "signup" ? "signup" : "login",
  );
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadUsername(session.user.id);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadUsername(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadUsername(uid: string) {
    const { data } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", uid)
      .maybeSingle();
    setUsername(data?.username ?? "");
    setLoading(false);
  }

  async function handleLogin() {
    const emailVal = emailInput.trim().toLowerCase();
    if (!emailVal.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (!passwordInput) {
      setError("Enter your password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: emailVal,
      password: passwordInput,
    });
    if (error) setError("Invalid email or password.");
    setSubmitting(false);
  }

  async function handleSignUp() {
    const name = usernameInput.trim().toLowerCase();
    const emailVal = emailInput.trim().toLowerCase();
    const check = validateUsername(name);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    if (!emailVal.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    if (passwordInput.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const { data: existing } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", name)
      .maybeSingle();
    if (existing) {
      setError("Username already taken.");
      setSubmitting(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailVal,
      password: passwordInput,
      options: { data: { username: name } },
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Sign up failed.");
      setSubmitting(false);
      return;
    }
    await supabase
      .from("tw_users")
      .insert({ id: data.user.id, username: name, email: emailVal });
    setConfirmEmail(emailVal);
    setSubmitting(false);
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setError(null);
    const redirectUri = makeRedirectUri({
      scheme: "topicwalk",
      path: "auth/callback",
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUri, skipBrowserRedirect: true },
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    if (data.url) {
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri,
      );
      if (result.type === "success") {
        const params = new URL(result.url).hash.replace("#", "?");
        const sp = new URLSearchParams(params);
        const access_token = sp.get("access_token");
        const refresh_token = sp.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
    }
    setSubmitting(false);
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  }

  if (loading) return <SafeAreaView edges={["bottom"]} style={s.safe} />;

  if (session?.user) {
    return (
      <SafeAreaView edges={["bottom"]} style={s.safe}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
          <Text style={s.pageTitle}>Profile</Text>
          <View style={s.profileCard}>
            <View style={s.profileAvatar}>
              <Text style={s.profileAvatarText}>
                {(username || session.user.email || "?")[0].toUpperCase()}
              </Text>
            </View>
            <Text style={[s.h2, { textAlign: "center" }]}>@{username}</Text>
            <Text style={[s.muted, { textAlign: "center" }]}>
              {session.user.email}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/friends")}
            style={s.menuRow}
          >
            <View style={s.menuIcon}>
              <Users size={18} color={colors.secondary} />
            </View>
            <Text style={[s.outlineBtnText, { flex: 1 }]}>Friends</Text>
            <ChevronRight size={16} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignOut} style={s.outlineBtn}>
            <LogOut size={18} color={colors.destructive} />
            <Text style={[s.outlineBtnText, { color: colors.destructive }]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (confirmEmail) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.centeredPage]}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>📬</Text>
        <Text style={[s.h2, { marginBottom: 8 }]}>Check your email</Text>
        <Text style={[s.muted, { textAlign: "center", marginBottom: 24 }]}>
          We sent a confirmation link to {confirmEmail}. Tap it to activate your
          account, then log in here.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setTab("login");
            setConfirmEmail(null);
            setError(null);
          }}
          style={s.outlineBtn}
        >
          <Text style={s.outlineBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.pageTitle}>
          {tab === "login" ? "Sign in" : "Create account"}
        </Text>

        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={submitting}
          style={s.googleBtn}
        >
          <Text style={{ fontSize: 18 }}>G</Text>
          <Text style={s.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {tab === "signup" && (
          <View style={{ gap: 6 }}>
            <Text style={s.label}>Username</Text>
            <TextInput
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="letters, numbers, underscores"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              style={s.input}
            />
          </View>
        )}

        <View style={{ gap: 6 }}>
          <Text style={s.label}>Email</Text>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={s.input}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={s.label}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder={tab === "signup" ? "at least 8 characters" : ""}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry={!showPassword}
              style={[s.input, { borderWidth: 0, flex: 1, height: "100%" }]}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <EyeOff size={18} color={colors.mutedForeground} />
              ) : (
                <Eye size={18} color={colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={tab === "login" ? handleLogin : handleSignUp}
          disabled={submitting}
          style={[s.submitBtn, { opacity: submitting ? 0.6 : 1 }]}
        >
          <Text style={s.submitBtnText}>
            {submitting
              ? "Please wait…"
              : tab === "login"
                ? "Sign in"
                : "Create account"}
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={s.muted}>
            {tab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <Text
              style={{
                fontWeight: "600",
                color: colors.primary,
                textDecorationLine: "underline",
              }}
              onPress={() => {
                setTab(tab === "login" ? "signup" : "login");
                setError(null);
              }}
            >
              {tab === "login" ? "Sign up" : "Sign in"}
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centeredPage: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 20,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  h2: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  label: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  profileCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 24,
    gap: 10,
    alignItems: "center",
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.5,
  },
  menuRow: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineBtnText: { fontSize: 15, fontWeight: "700", color: colors.foreground },
  googleBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.mutedForeground,
  },
  input: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  passwordRow: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: { fontSize: 14, color: colors.destructive },
  submitBtn: {
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: "#fff",
  },
});
