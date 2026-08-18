import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  Pencil,
  Shield,
  Users,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { validateUsername } from "../../lib/username-filter";

WebBrowser.maybeCompleteAuthSession();

const AVATAR_COLORS = [
  "#6366f1",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
];

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
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

  const [needsUsername, setNeedsUsername] = useState(false);
  const [setupInput, setSetupInput] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSubmitting, setSetupSubmitting] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [editSaving, setEditSaving] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("tw_users")
      .select("username, bio, avatar_color")
      .eq("id", uid)
      .maybeSingle();
    if (data?.username) {
      setUsername(data.username);
      setBio(data.bio ?? "");
      setAvatarColor(data.avatar_color ?? AVATAR_COLORS[0]);
      setNeedsUsername(false);
    } else {
      setNeedsUsername(true);
    }
    setLoading(false);
  }

  async function handleSetupUsername(uid: string, email: string) {
    const name = setupInput.trim().toLowerCase();
    const check = validateUsername(name);
    if (!check.ok) {
      setSetupError(check.reason);
      return;
    }
    setSetupSubmitting(true);
    setSetupError(null);
    const { data: existing } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", name)
      .maybeSingle();
    if (existing) {
      setSetupError("Username already taken.");
      setSetupSubmitting(false);
      return;
    }
    const friendCode = uid.replace(/-/g, "").slice(0, 6).toUpperCase();
    const { error: insertError } = await supabase.from("tw_users").insert({
      id: uid,
      username: name,
      email,
      friend_code: friendCode,
    });
    if (insertError) {
      setSetupError("Something went wrong. Try a different username.");
      setSetupSubmitting(false);
      return;
    }
    setUsername(name);
    setNeedsUsername(false);
    setSetupSubmitting(false);
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
    if (error) {
      setError(
        error.message?.includes("not confirmed")
          ? "Email not confirmed. Check your inbox for the confirmation link."
          : "Incorrect email or password.",
      );
    }
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
    const redirectUri = makeRedirectUri({
      scheme: "topicwalk",
      path: "auth/callback",
    });
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailVal,
      password: passwordInput,
      options: { data: { username: name }, emailRedirectTo: redirectUri },
    });
    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Sign up failed.");
      setSubmitting(false);
      return;
    }
    const friendCode = data.user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
    await supabase.from("tw_users").insert({
      id: data.user.id,
      username: name,
      email: emailVal,
      friend_code: friendCode,
    });
    setUsername(name);
    setNeedsUsername(false);
    if (!data.session) setConfirmEmail(emailVal);
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
        const parsed = new URL(result.url);
        const hashParams = new URLSearchParams(parsed.hash.replace("#", ""));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
        }
        const code = parsed.searchParams.get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code);
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

  async function handleSaveProfile() {
    if (!session?.user) return;
    setEditSaving(true);
    await supabase
      .from("tw_users")
      .update({
        bio: editBio.trim(),
        avatar_color: editColor,
      })
      .eq("id", session.user.id);
    setBio(editBio.trim());
    setAvatarColor(editColor);
    setShowEdit(false);
    setEditSaving(false);
  }

  function openEdit() {
    setEditBio(bio);
    setEditColor(avatarColor);
    setShowEdit(true);
  }

  if (loading) return <SafeAreaView edges={["bottom"]} style={s.safe} />;

  // ── Username setup (Google OAuth first login) ──────────────────────────────
  if (session?.user && needsUsername) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.centered]}>
        <View
          style={[
            s.bigAvatar,
            { backgroundColor: AVATAR_COLORS[0], marginBottom: 20 },
          ]}
        >
          <Text style={s.bigAvatarText}>?</Text>
        </View>
        <Text style={s.setupTitle}>Choose your username</Text>
        <Text style={[s.muted, { textAlign: "center", marginBottom: 28 }]}>
          This is how friends find you. It must be unique.
        </Text>
        <View style={{ width: "100%", gap: 12 }}>
          <TextInput
            value={setupInput}
            onChangeText={(t) => {
              setSetupInput(t.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              setSetupError(null);
            }}
            placeholder="letters, numbers, underscores"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            style={s.input}
          />
          {setupError && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{setupError}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() =>
              handleSetupUsername(session.user.id, session.user.email ?? "")
            }
            disabled={setupSubmitting || setupInput.trim().length < 3}
            style={[
              s.primaryBtn,
              {
                opacity:
                  setupSubmitting || setupInput.trim().length < 3 ? 0.5 : 1,
              },
            ]}
          >
            <Text style={s.primaryBtnText}>
              {setupSubmitting ? "Checking…" : "Claim username"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => supabase.auth.signOut()}
            style={s.ghostBtn}
          >
            <Text style={s.ghostBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Logged-in profile ──────────────────────────────────────────────────────
  if (session?.user) {
    const initial = (username || "?")[0].toUpperCase();
    return (
      <SafeAreaView edges={["bottom"]} style={s.safe}>
        {/* Edit Profile modal */}
        <Modal
          visible={showEdit}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEdit(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <SafeAreaView style={[s.safe, { flex: 1 }]}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => setShowEdit(false)}
                  style={s.closeBtn}
                >
                  <Text style={s.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={{ padding: 20, gap: 24 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* Avatar preview */}
                <View style={{ alignItems: "center", gap: 12 }}>
                  <View style={[s.bigAvatar, { backgroundColor: editColor }]}>
                    <Text style={s.bigAvatarText}>{initial}</Text>
                  </View>
                </View>

                {/* Color picker */}
                <View style={{ gap: 10 }}>
                  <Text style={s.fieldLabel}>Avatar color</Text>
                  <View style={s.colorRow}>
                    {AVATAR_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setEditColor(c)}
                        style={[
                          s.colorSwatch,
                          { backgroundColor: c },
                          editColor === c && s.colorSwatchSelected,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* Bio */}
                <View style={{ gap: 10 }}>
                  <View style={s.fieldLabelRow}>
                    <Text style={s.fieldLabel}>Bio</Text>
                    <Text style={s.charCount}>{editBio.length}/100</Text>
                  </View>
                  <TextInput
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder="Tell friends something about yourself…"
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    maxLength={100}
                    style={s.bioInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={editSaving}
                  style={[s.primaryBtn, { opacity: editSaving ? 0.6 : 1 }]}
                >
                  <Text style={s.primaryBtnText}>
                    {editSaving ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
          {/* Hero */}
          <View style={s.hero}>
            <TouchableOpacity onPress={openEdit} activeOpacity={0.85}>
              <View style={[s.bigAvatar, { backgroundColor: avatarColor }]}>
                <Text style={s.bigAvatarText}>{initial}</Text>
              </View>
            </TouchableOpacity>
            <Text style={s.heroUsername}>@{username}</Text>
            <Text style={s.muted}>{session.user.email}</Text>
            {bio ? (
              <Text style={s.heroBio}>{bio}</Text>
            ) : (
              <TouchableOpacity onPress={openEdit}>
                <Text style={[s.muted, { fontStyle: "italic" }]}>
                  Add a bio…
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={openEdit} style={s.editBtn}>
              <Pencil size={13} color={colors.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Menu */}
          <View style={s.menuCard}>
            {session.user.email === "sean.s.lee09@gmail.com" && (
              <TouchableOpacity
                onPress={() => router.push("/admin")}
                style={[
                  s.menuRow,
                  { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[s.menuIcon, { backgroundColor: "#fef3c7" }]}>
                  <Shield size={16} color="#d97706" />
                </View>
                <Text style={[s.menuLabel, { flex: 1 }]}>Admin</Text>
                <ChevronRight size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/friends")}
              style={s.menuRow}
            >
              <View style={[s.menuIcon, { backgroundColor: "#ede9fe" }]}>
                <Users size={16} color="#7c3aed" />
              </View>
              <Text style={[s.menuLabel, { flex: 1 }]}>Friends</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
            <LogOut size={16} color={colors.destructive} />
            <Text style={s.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Check email ────────────────────────────────────────────────────────────
  if (confirmEmail) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.centered]}>
        <Text style={{ fontSize: 44, marginBottom: 16 }}>📬</Text>
        <Text style={s.setupTitle}>Check your email</Text>
        <Text style={[s.muted, { textAlign: "center", marginBottom: 28 }]}>
          We sent a link to {confirmEmail}. Tap it to activate your account,
          then sign in below.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setTab("login");
            setConfirmEmail(null);
            setError(null);
          }}
          style={s.primaryBtn}
        >
          <Text style={s.primaryBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.authContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tab switcher */}
        <View style={s.tabRow}>
          <TouchableOpacity
            onPress={() => {
              setTab("login");
              setError(null);
            }}
            style={[s.tabBtn, tab === "login" && s.tabBtnActive]}
          >
            <Text style={[s.tabText, tab === "login" && s.tabTextActive]}>
              Sign in
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setTab("signup");
              setError(null);
            }}
            style={[s.tabBtn, tab === "signup" && s.tabBtnActive]}
          >
            <Text style={[s.tabText, tab === "signup" && s.tabTextActive]}>
              Create account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Google */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={submitting}
          style={s.googleBtn}
        >
          <Text style={s.googleG}>G</Text>
          <Text style={s.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>

        <View style={s.dividerRow}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        {/* Fields */}
        {tab === "signup" && (
          <TextInput
            value={usernameInput}
            onChangeText={setUsernameInput}
            placeholder="Username"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            style={s.input}
          />
        )}
        <TextInput
          value={emailInput}
          onChangeText={setEmailInput}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={s.input}
        />
        <View style={s.passwordRow}>
          <TextInput
            value={passwordInput}
            onChangeText={setPasswordInput}
            placeholder={
              tab === "signup" ? "Password (8+ characters)" : "Password"
            }
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPassword}
            style={[s.input, { flex: 1, borderWidth: 0, height: "100%" }]}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={{ paddingRight: 4 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.mutedForeground} />
            ) : (
              <Eye size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={tab === "login" ? handleLogin : handleSignUp}
          disabled={submitting}
          style={[s.primaryBtn, { opacity: submitting ? 0.6 : 1 }]}
        >
          <Text style={s.primaryBtnText}>
            {submitting
              ? "Please wait…"
              : tab === "login"
                ? "Sign in"
                : "Create account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
    gap: 14,
  },
  authContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
    gap: 14,
  },

  muted: { fontSize: 14, color: colors.mutedForeground },

  // ── Auth tabs ──────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.muted,
    borderRadius: 14,
    padding: 4,
    marginBottom: 4,
  },
  tabBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  tabTextActive: { color: colors.foreground },

  // ── Auth form ──────────────────────────────────────────────────────────────
  googleBtn: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  googleG: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.foreground,
    width: 24,
    textAlign: "center",
  },
  googleBtnText: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  dividerText: { fontSize: 12, color: colors.mutedForeground },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  passwordRow: {
    height: 52,
    borderRadius: 16,
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
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  ghostBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: { fontSize: 14, color: colors.mutedForeground },

  // ── Username setup ─────────────────────────────────────────────────────────
  setupTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.foreground,
    marginBottom: 8,
    textAlign: "center",
  },

  // ── Logged-in hero ─────────────────────────────────────────────────────────
  hero: {
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
  },
  bigAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bigAvatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -1,
  },
  heroUsername: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.foreground,
  },
  heroBio: {
    fontSize: 14,
    color: colors.foreground,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  editBtnText: { fontSize: 13, fontWeight: "600", color: colors.primary },

  // ── Menu ───────────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: "hidden",
  },
  menuRow: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: colors.destructive },

  // ── Edit modal ─────────────────────────────────────────────────────────────
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  closeBtn: { padding: 4 },
  closeBtnText: { fontSize: 16, color: colors.primary },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCount: { fontSize: 12, color: colors.mutedForeground },
  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: colors.foreground,
  },
  bioInput: {
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    color: colors.foreground,
    textAlignVertical: "top",
  },
});
