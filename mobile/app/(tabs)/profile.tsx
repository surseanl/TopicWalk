import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  CalendarDays,
  Camera,
  ChevronRight,
  Eye,
  EyeOff,
  Footprints,
  Pencil,
  Settings,
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
import { todayLocal, yesterdayLocal } from "@/lib/date";
import { ColorPicker } from "../../components/ColorPicker";
import { SnappyAvatar } from "../../components/SnappyAvatar";
import { SNAPPY_BACKGROUNDS } from "../../components/SnappyBgs";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { validateUsername } from "../../lib/username-filter";

WebBrowser.maybeCompleteAuthSession();

const todayStr = todayLocal;
const yesterdayStr = yesterdayLocal;

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  if (dates[0] !== todayStr() && dates[0] !== yesterdayStr()) return 0;
  let streak = 0;
  let expected = dates[0];
  for (const d of dates) {
    if (d === expected) {
      streak++;
      const prev = new Date(expected);
      prev.setDate(prev.getDate() - 1);
      expected = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
    } else {
      break;
    }
  }
  return streak;
}

const DEFAULT_MASCOT_COLOR = "#5CA3FF";

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [snappyBg, setSnappyBg] = useState(SNAPPY_BACKGROUNDS[0].id);
  const [snappyColor, setSnappyColor] = useState(DEFAULT_MASCOT_COLOR);
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
  const [editSnappyBg, setEditSnappyBg] = useState(SNAPPY_BACKGROUNDS[0].id);
  const [editSnappyColor, setEditSnappyColor] = useState(DEFAULT_MASCOT_COLOR);
  const [editSaving, setEditSaving] = useState(false);

  const [statDistanceM, setStatDistanceM] = useState(0);
  const [statPhotos, setStatPhotos] = useState(0);
  const [statStreak, setStatStreak] = useState(0);

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
      .select("username, bio, avatar_color, mascot_color")
      .eq("id", uid)
      .maybeSingle();
    if (data?.username) {
      setUsername(data.username);
      setBio(data.bio ?? "");
      setSnappyBg(data.avatar_color ?? SNAPPY_BACKGROUNDS[0].id);
      setSnappyColor(data.mascot_color ?? DEFAULT_MASCOT_COLOR);
      setNeedsUsername(false);
      void loadStats(uid);
    } else {
      setNeedsUsername(true);
    }
    setLoading(false);
  }

  async function loadStats(uid: string) {
    const [distanceRes, photosRes, streakRes] = await Promise.all([
      supabase.from("tw_albums").select("distance_meters").eq("user_id", uid),
      supabase
        .from("tw_submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid),
      supabase
        .from("tw_albums")
        .select("created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
    ]);
    const totalM = (distanceRes.data ?? []).reduce(
      (sum: number, a: { distance_meters: number | null }) =>
        sum + (a.distance_meters ?? 0),
      0,
    );
    setStatDistanceM(totalM);
    setStatPhotos(photosRes.count ?? 0);
    const dates = [
      ...new Set(
        (streakRes.data ?? []).map((a: { created_at: string }) =>
          a.created_at.slice(0, 10),
        ),
      ),
    ] as string[];
    setStatStreak(computeStreak(dates));
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
    if (data.session) {
      // Session exists (no email confirmation) — create user row now
      const { error: insertError } = await supabase.from("tw_users").insert({
        id: data.user.id,
        username: name,
        email: emailVal,
        friend_code: friendCode,
      });
      if (insertError) {
        setError("Account created but profile setup failed. Please try again.");
        setSubmitting(false);
        return;
      }
      setUsername(name);
      setNeedsUsername(false);
    } else {
      // Email confirmation required — row will be created after confirmation via username picker
      setConfirmEmail(emailVal);
    }
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

  async function _handleSignOut() {
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
        avatar_color: editSnappyBg,
        mascot_color: editSnappyColor,
      })
      .eq("id", session.user.id);
    setBio(editBio.trim());
    setSnappyBg(editSnappyBg);
    setSnappyColor(editSnappyColor);
    setShowEdit(false);
    setEditSaving(false);
  }

  function openEdit() {
    setEditBio(bio);
    setEditSnappyBg(snappyBg);
    setEditSnappyColor(snappyColor);
    setShowEdit(true);
  }

  if (loading) return <SafeAreaView edges={["bottom"]} style={s.safe} />;

  // ── Username setup ────────────────────────────────────────────────────────
  if (session?.user && needsUsername) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={[s.safe, s.centered]}>
        <SnappyAvatar bgId={SNAPPY_BACKGROUNDS[2].id} size={88} />
        <Text style={[s.setupTitle, { marginTop: 20 }]}>
          Choose your username
        </Text>
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

  // ── Logged-in ─────────────────────────────────────────────────────────────
  if (session?.user) {
    const isAdmin = session.user.app_metadata?.role === "admin";
    return (
      <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
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
            <SafeAreaView
              edges={["top", "bottom"]}
              style={{ flex: 1, backgroundColor: colors.background }}
            >
              <View style={s.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowEdit(false)}
                  style={s.closeBtn}
                >
                  <Text style={s.closeBtnText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={s.modalTitle}>Edit Profile</Text>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={editSaving}
                  style={[s.closeBtn, editSaving && { opacity: 0.5 }]}
                >
                  <Text style={[s.closeBtnText, { fontWeight: "700" }]}>
                    {editSaving ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 20, gap: 24 }}
              >
                <View style={{ alignItems: "center", paddingVertical: 8 }}>
                  <SnappyAvatar
                    bgId={editSnappyBg}
                    size={120}
                    tintColor={editSnappyColor}
                  />
                </View>
                <View style={{ gap: 10 }}>
                  <Text style={s.fieldLabel}>Mascot Color</Text>
                  <ColorPicker
                    value={editSnappyColor}
                    onChange={setEditSnappyColor}
                  />
                </View>
                <View style={{ gap: 10 }}>
                  <Text style={s.fieldLabel}>Background</Text>
                  <View style={s.bgGrid}>
                    {SNAPPY_BACKGROUNDS.map((bg) => (
                      <TouchableOpacity
                        key={bg.id}
                        onPress={() => setEditSnappyBg(bg.id)}
                        style={[
                          s.bgThumb,
                          editSnappyBg === bg.id && s.bgThumbSelected,
                        ]}
                      >
                        <View style={s.bgThumbInner}>{bg.render(64)}</View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ gap: 8 }}>
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
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Modal>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity
              style={s.topIconBtn}
              onPress={() =>
                Alert.alert("Sign out", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign out",
                    style: "destructive",
                    onPress: () => supabase.auth.signOut(),
                  },
                ])
              }
            >
              <Settings size={20} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openEdit} style={s.editPillBtn}>
              <Text style={s.editPillText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={s.avatarSection}>
            <View style={s.avatarWrap}>
              <TouchableOpacity onPress={openEdit} activeOpacity={0.85}>
                <SnappyAvatar
                  bgId={snappyBg}
                  size={100}
                  mascotSize={76}
                  tintColor={snappyColor}
                />
              </TouchableOpacity>
              <View style={s.onlineDot} />
            </View>
            <Text style={s.profileUsername}>@{username}</Text>
            {bio ? (
              <Text style={s.profileBio}>{bio}</Text>
            ) : (
              <TouchableOpacity onPress={openEdit}>
                <Text style={s.bioPlaceholder}>Add a bio…</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Footprints
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>
                {(statDistanceM / 1609.34).toFixed(1)}
              </Text>
              <Text style={s.statLabel}>miles walked</Text>
            </View>
            <View style={s.statCard}>
              <Camera
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>{statPhotos}</Text>
              <Text style={s.statLabel}>
                {statPhotos === 1 ? "photo" : "photos"}
              </Text>
            </View>
            <View style={s.statCard}>
              <CalendarDays
                size={22}
                color={colors.mutedForeground}
                strokeWidth={1.5}
              />
              <Text style={s.statNum}>{statStreak}</Text>
              <Text style={s.statLabel}>day streak</Text>
            </View>
          </View>

          {/* Menu */}
          <View style={s.menuCard}>
            {isAdmin && (
              <>
                <TouchableOpacity
                  onPress={() => router.push("/admin")}
                  style={s.menuRow}
                >
                  <View style={[s.menuIcon, { backgroundColor: "#fef3c7" }]}>
                    <Shield size={16} color="#d97706" />
                  </View>
                  <Text style={[s.menuLabel, { flex: 1 }]}>Admin</Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                <View style={s.menuDivider} />
              </>
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
            <View style={s.menuDivider} />
            <TouchableOpacity onPress={openEdit} style={s.menuRow}>
              <View style={[s.menuIcon, { backgroundColor: "#dcfce7" }]}>
                <Pencil size={16} color="#16a34a" />
              </View>
              <Text style={[s.menuLabel, { flex: 1 }]}>Edit Profile</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View style={s.menuDivider} />
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Sign out", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Sign out",
                    style: "destructive",
                    onPress: () => supabase.auth.signOut(),
                  },
                ])
              }
              style={s.menuRow}
            >
              <View style={[s.menuIcon, { backgroundColor: colors.muted }]}>
                <Settings size={16} color={colors.mutedForeground} />
              </View>
              <Text style={[s.menuLabel, { flex: 1 }]}>Settings</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Confirm email ─────────────────────────────────────────────────────────
  if (confirmEmail) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={[s.safe, s.centered]}>
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

  // ── Auth ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={["top", "bottom"]} style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.authContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.authBrand}>
          <SnappyAvatar bgId={SNAPPY_BACKGROUNDS[0].id} size={72} />
          <Text style={s.authBrandTitle}>TopicWalk</Text>
          <Text style={s.authBrandSub}>Walk. Discover. Hunt.</Text>
        </View>

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
    paddingTop: 16,
    paddingBottom: 48,
    gap: 24,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  editPillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  editPillText: { fontSize: 14, fontWeight: "600", color: colors.foreground },

  // Avatar section
  avatarSection: { alignItems: "center", gap: 6 },
  avatarWrap: { position: "relative" },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  profileUsername: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: colors.foreground,
    marginTop: 4,
  },
  profileBio: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  bioPlaceholder: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontStyle: "italic",
  },

  // Stats row
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  authContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 14,
  },
  authBrand: { alignItems: "center", gap: 4, paddingBottom: 12 },
  authBrandTitle: {
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.6,
    color: colors.foreground,
    marginTop: 4,
  },
  authBrandSub: {
    fontSize: 14,
    color: colors.mutedForeground,
    fontWeight: "500",
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
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
  ghostBtn: { height: 44, alignItems: "center", justifyContent: "center" },
  ghostBtnText: { fontSize: 14, color: colors.mutedForeground },
  setupTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.foreground,
    marginBottom: 8,
    textAlign: "center",
  },
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
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 60,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontWeight: "600", color: colors.foreground },
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
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSwatchSelected: { borderWidth: 3, borderColor: colors.foreground },
  bgGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bgThumb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  bgThumbSelected: { borderColor: colors.foreground },
  bgThumbInner: { width: 64, height: 64, borderRadius: 32, overflow: "hidden" },
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
