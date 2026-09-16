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
  Image,
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
import {
  ACCESSORY_CATEGORIES,
  ACCESSORY_MAP,
  type AccessorySlots,
  encodeAccessory,
  parseAccessory,
} from "../../components/SnappyAccessories";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { validateUsername } from "../../lib/username-filter";

WebBrowser.maybeCompleteAuthSession();

const SNAPPY_COLORS = [
  "#22c55e",
  "#16a34a",
  "#3b82f6",
  "#60a5fa",
  "#f97316",
  "#f43f5e",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#ec4899",
  "#64748b",
  "#1e293b",
];

const SNAPPY_BG_COLORS = [
  "#dcfce7",
  "#dbeafe",
  "#ffedd5",
  "#ede9fe",
  "#fef9c3",
  "#fce7f3",
  "#cffafe",
  "#ffe4e6",
  "#f1f5f9",
  "#fafafa",
  "#fff7ed",
  "#f0fdf4",
];

const CAT_ICON: Record<string, string> = {
  hat: "🧢",
  glasses: "🕶️",
  outfit: "👕",
  bottom: "👖",
  shoes: "👟",
  bag: "🎒",
};

const SKINS: Array<
  { name: string; color: string; bg: string } & AccessorySlots
> = [
  {
    name: "Forest",
    color: "#22c55e",
    bg: "#dcfce7",
    hat: "hat_beanie",
    glasses: "",
    outfit: "outfit_hoodie",
    bottom: "bottom_jeans",
    shoes: "shoes_sneakers",
    bag: "",
  },
  {
    name: "Ocean",
    color: "#3b82f6",
    bg: "#dbeafe",
    hat: "",
    glasses: "glasses_sport",
    outfit: "outfit_tshirt",
    bottom: "bottom_swimtrunks",
    shoes: "shoes_slides",
    bag: "",
  },
  {
    name: "Flame",
    color: "#f97316",
    bg: "#ffedd5",
    hat: "hat_cowboy",
    glasses: "glasses_sunglasses",
    outfit: "outfit_flannel",
    bottom: "bottom_jeans",
    shoes: "shoes_boots",
    bag: "",
  },
  {
    name: "Galaxy",
    color: "#8b5cf6",
    bg: "#ede9fe",
    hat: "hat_snapback",
    glasses: "",
    outfit: "outfit_hoodie",
    bottom: "bottom_sweatpants",
    shoes: "shoes_sneakers",
    bag: "bag_laptop",
  },
  {
    name: "Preppy",
    color: "#eab308",
    bg: "#fef9c3",
    hat: "hat_baseball",
    glasses: "",
    outfit: "outfit_sweatervest",
    bottom: "bottom_jeans",
    shoes: "shoes_sneakers",
    bag: "bag_tote",
  },
  {
    name: "Bubblegum",
    color: "#ec4899",
    bg: "#fce7f3",
    hat: "",
    glasses: "glasses_heart",
    outfit: "outfit_sweater",
    bottom: "bottom_skirt",
    shoes: "shoes_sneakers",
    bag: "bag_tote",
  },
  {
    name: "Arctic",
    color: "#06b6d4",
    bg: "#cffafe",
    hat: "hat_headphones",
    glasses: "glasses_goggles",
    outfit: "outfit_jacket",
    bottom: "bottom_jeans",
    shoes: "shoes_snowboots",
    bag: "",
  },
  {
    name: "Cherry",
    color: "#f43f5e",
    bg: "#ffe4e6",
    hat: "hat_baseball",
    glasses: "glasses_sunglasses",
    outfit: "outfit_hoodie",
    bottom: "bottom_jeans",
    shoes: "shoes_sneakers",
    bag: "bag_backpack",
  },
];

const HAT_ASPECT: Record<string, number> = {
  hat_baseball: 0.68,
  hat_cowboy: 0.72,
  hat_beanie: 0.78,
  hat_bucket: 0.7,
  hat_frog: 0.85,
  hat_crown: 0.7,
  hat_santa: 0.85,
  hat_wizard: 0.92,
  hat_beret: 0.62,
  hat_bear: 0.85,
  hat_catears: 0.52,
  hat_trucker: 0.68,
  hat_jester: 0.92,
  hat_top: 0.95,
  hat_party: 1.0,
  hat_flower: 0.55,
  hat_chef: 0.85,
  hat_safari: 0.65,
  hat_witch: 1.02,
  hat_hard: 0.62,
  hat_snapback: 0.65,
  hat_straw: 0.7,
  hat_animal: 0.92,
  hat_headphones: 0.62,
};

function SnappyCharacter({
  color: _color,
  bg,
  hat,
  glasses,
  outfit,
  bottom,
  shoes,
  bag,
  size = 120,
}: {
  color: string;
  bg?: string;
  hat: string;
  glasses: string;
  outfit: string;
  bottom: string;
  shoes: string;
  bag: string;
  size?: number;
}) {
  const circleSize = Math.round(size * 1.15);
  const hatSvgW = Math.round(size * 0.88);
  const hatSvgH = hat ? Math.round(hatSvgW * (HAT_ASPECT[hat] ?? 0.75)) : 0;
  const hatOverhang = hat
    ? Math.max(0, hatSvgH - Math.round(circleSize * 0.18))
    : 0;
  const totalHeight = circleSize + hatOverhang;

  const HatComp = hat ? ACCESSORY_MAP[hat] : null;
  const GlassesComp = glasses ? ACCESSORY_MAP[glasses] : null;
  const OutfitComp = outfit ? ACCESSORY_MAP[outfit] : null;
  const BottomComp = bottom ? ACCESSORY_MAP[bottom] : null;
  const ShoesComp = shoes ? ACCESSORY_MAP[shoes] : null;
  const BagComp = bag ? ACCESSORY_MAP[bag] : null;

  // Top of the mascot image within the container
  // (hat overhang space + half of (circle - image) centering offset)
  const imgTop = hatOverhang + Math.round((circleSize - size) / 2);

  // Mascot anatomy fractions (from image top):
  //   camera top    ~0.15  hat brim lands here
  //   face center   ~0.38  glasses center goes here → SVG top ~0.28
  //   camera bottom ~0.66  outfit SVG starts ~0.50 so collar lands ~0.66
  //   leg top       ~0.66  pants waistband starts here (rendered in front of outfit)
  //   foot top      ~0.80  shoes start here
  const glassesW = Math.round(size * 0.78); // wide enough to span the full camera face
  const outfitW = Math.round(size * 0.8); // fills camera body width
  const bottomW = Math.round(size * 0.5); // covers both legs + gap
  const shoesW = Math.round(size * 0.5); // covers both feet
  const bagW = Math.round(size * 0.38);

  return (
    <View
      style={{
        width: circleSize,
        height: totalHeight,
        alignItems: "center",
        overflow: "visible",
      }}
    >
      {/* Background circle */}
      <View
        style={{
          position: "absolute",
          top: hatOverhang,
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: bg ?? "transparent",
        }}
      />
      {/* Mascot image */}
      <View
        style={{
          position: "absolute",
          top: imgTop,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("../../assets/mascot.png")}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
      {/* Outfit/shirt — rendered first (behind pants) so pants appear on top.
          collar (19% into TShirt SVG) lands at camera bottom (66%) */}
      {OutfitComp ? (
        <View
          style={{
            position: "absolute",
            top: imgTop + Math.round(size * 0.5),
            alignItems: "center",
          }}
        >
          <OutfitComp size={outfitW} uid={`${outfit}_main`} />
        </View>
      ) : null}
      {/* Pants/Bottom — rendered after outfit so they appear in front (layered over shirt hem) */}
      {BottomComp ? (
        <View
          style={{
            position: "absolute",
            top: imgTop + Math.round(size * 0.64),
            alignItems: "center",
          }}
        >
          <BottomComp size={bottomW} uid={`${bottom}_main`} />
        </View>
      ) : null}
      {/* Shoes — in front of pants */}
      {ShoesComp ? (
        <View
          style={{
            position: "absolute",
            top: imgTop + Math.round(size * 0.77),
            alignItems: "center",
          }}
        >
          <ShoesComp size={shoesW} uid={`${shoes}_main`} />
        </View>
      ) : null}
      {/* Glasses — center of SVG (45% in) lands at face center (38%) */}
      {GlassesComp ? (
        <View
          style={{
            position: "absolute",
            top: imgTop + Math.round(size * 0.28),
            alignItems: "center",
          }}
        >
          <GlassesComp size={glassesW} uid={`${glasses}_main`} />
        </View>
      ) : null}
      {/* Bag — hangs from right side of body */}
      {BagComp ? (
        <View
          style={{
            position: "absolute",
            right: -Math.round(bagW * 0.15),
            top: imgTop + Math.round(size * 0.42),
          }}
        >
          <BagComp size={bagW} uid={`${bag}_main`} />
        </View>
      ) : null}
      {/* Hat — sits above camera */}
      {HatComp ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            width: circleSize,
            alignItems: "center",
          }}
        >
          <HatComp size={hatSvgW} uid={`${hat}_main`} />
        </View>
      ) : null}
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [snappyBg, setSnappyBg] = useState(SNAPPY_BG_COLORS[0]);
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

  const [snappyColor, setSnappyColor] = useState(SNAPPY_COLORS[0]);
  const [snappyHat, setSnappyHat] = useState("");
  const [snappyGlasses, setSnappyGlasses] = useState("");
  const [snappyOutfit, setSnappyOutfit] = useState("");
  const [snappyBottom, setSnappyBottom] = useState("");
  const [snappyShoes, setSnappyShoes] = useState("");
  const [snappyBag, setSnappyBag] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [skinIdx, setSkinIdx] = useState(0);
  const [editBio, setEditBio] = useState("");
  const [editSnappyBg, setEditSnappyBg] = useState(SNAPPY_BG_COLORS[0]);
  const [editSnappyColor, setEditSnappyColor] = useState(SNAPPY_COLORS[0]);
  const [editSnappyHat, setEditSnappyHat] = useState("");
  const [editSnappyGlasses, setEditSnappyGlasses] = useState("");
  const [editSnappyOutfit, setEditSnappyOutfit] = useState("");
  const [editSnappyBottom, setEditSnappyBottom] = useState("");
  const [editSnappyShoes, setEditSnappyShoes] = useState("");
  const [editSnappyBag, setEditSnappyBag] = useState("");
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
    // Use select("*") so the query succeeds even before the snappy migration is applied
    const { data } = await supabase
      .from("tw_users")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (data?.username) {
      setUsername(data.username);
      setBio(data.bio ?? "");
      setSnappyBg(data.avatar_color ?? SNAPPY_BG_COLORS[0]);
      setSnappyColor(data.snappy_color ?? SNAPPY_COLORS[0]);
      const slots = parseAccessory(data.snappy_accessory ?? "");
      setSnappyHat(slots.hat);
      setSnappyGlasses(slots.glasses);
      setSnappyOutfit(slots.outfit);
      setSnappyBottom(slots.bottom);
      setSnappyShoes(slots.shoes);
      setSnappyBag(slots.bag);
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
        avatar_color: editSnappyBg,
        snappy_color: editSnappyColor,
        snappy_accessory: encodeAccessory({
          hat: editSnappyHat,
          glasses: editSnappyGlasses,
          outfit: editSnappyOutfit,
          bottom: editSnappyBottom,
          shoes: editSnappyShoes,
          bag: editSnappyBag,
        }),
      })
      .eq("id", session.user.id);
    setBio(editBio.trim());
    setSnappyBg(editSnappyBg);
    setSnappyColor(editSnappyColor);
    setSnappyHat(editSnappyHat);
    setSnappyGlasses(editSnappyGlasses);
    setSnappyOutfit(editSnappyOutfit);
    setSnappyBottom(editSnappyBottom);
    setSnappyShoes(editSnappyShoes);
    setSnappyBag(editSnappyBag);
    setShowEdit(false);
    setEditSaving(false);
  }

  function openEdit() {
    setEditBio(bio);
    setEditSnappyBg(snappyBg);
    setEditSnappyColor(snappyColor);
    setEditSnappyHat(snappyHat);
    setEditSnappyGlasses(snappyGlasses);
    setEditSnappyOutfit(snappyOutfit);
    setEditSnappyBottom(snappyBottom);
    setEditSnappyShoes(snappyShoes);
    setEditSnappyBag(snappyBag);
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
            { backgroundColor: SNAPPY_BG_COLORS[0], marginBottom: 20 },
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
    return (
      <SafeAreaView edges={["bottom"]} style={s.safe}>
        {/* Edit Profile modal */}
        <Modal
          visible={showEdit}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowEdit(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <SafeAreaView
              edges={["top", "bottom"]}
              style={{ flex: 1, backgroundColor: "#dbeafe" }}
            >
              {/* Header */}
              <View style={ac.header}>
                <TouchableOpacity
                  onPress={() => setShowEdit(false)}
                  style={ac.headerBtn}
                >
                  <Text style={ac.headerBtnCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={ac.headerTitle}>✏️ Edit Snappy</Text>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={editSaving}
                  style={[ac.headerBtn, editSaving && { opacity: 0.5 }]}
                >
                  <Text style={ac.headerBtnSave}>
                    {editSaving ? "Saving…" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Character preview */}
                <View style={ac.previewSection}>
                  <View style={ac.previewCard}>
                    <SnappyCharacter
                      color={editSnappyColor}
                      bg={editSnappyBg}
                      hat={editSnappyHat}
                      glasses={editSnappyGlasses}
                      outfit={editSnappyOutfit}
                      bottom={editSnappyBottom}
                      shoes={editSnappyShoes}
                      bag={editSnappyBag}
                      size={160}
                    />
                  </View>
                  <View style={ac.lookNav}>
                    <TouchableOpacity
                      style={ac.lookArrow}
                      onPress={() => {
                        const ni =
                          skinIdx <= 0 ? SKINS.length - 1 : skinIdx - 1;
                        setSkinIdx(ni);
                        const sk = SKINS[ni];
                        setEditSnappyBg(sk.bg);
                        setEditSnappyHat(sk.hat);
                        setEditSnappyGlasses(sk.glasses);
                        setEditSnappyOutfit(sk.outfit);
                        setEditSnappyBottom(sk.bottom);
                        setEditSnappyShoes(sk.shoes);
                        setEditSnappyBag(sk.bag);
                      }}
                    >
                      <Text style={ac.lookArrowText}>◀</Text>
                    </TouchableOpacity>
                    <Text style={ac.lookLabel}>CURRENT LOOK</Text>
                    <TouchableOpacity
                      style={ac.lookArrow}
                      onPress={() => {
                        const ni = (skinIdx + 1) % SKINS.length;
                        setSkinIdx(ni);
                        const sk = SKINS[ni];
                        setEditSnappyBg(sk.bg);
                        setEditSnappyHat(sk.hat);
                        setEditSnappyGlasses(sk.glasses);
                        setEditSnappyOutfit(sk.outfit);
                        setEditSnappyBottom(sk.bottom);
                        setEditSnappyShoes(sk.shoes);
                        setEditSnappyBag(sk.bag);
                      }}
                    >
                      <Text style={ac.lookArrowText}>▶</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick actions */}
                <View style={ac.panel}>
                  <Text style={ac.panelLabel}>QUICK ACTIONS</Text>
                  <View style={ac.quickGrid}>
                    <TouchableOpacity
                      style={ac.quickBtn}
                      onPress={() => {
                        const bySlot = Object.fromEntries(
                          ACCESSORY_CATEGORIES.map((c) => [c.slot, c.items]),
                        );
                        const pick = (
                          items: (typeof bySlot)[keyof typeof bySlot],
                        ) => items[Math.floor(Math.random() * items.length)].id;
                        setEditSnappyHat(pick(bySlot.hat));
                        setEditSnappyGlasses(pick(bySlot.glasses));
                        setEditSnappyOutfit(pick(bySlot.outfit));
                        setEditSnappyBottom(pick(bySlot.bottom));
                        setEditSnappyShoes(pick(bySlot.shoes));
                        setEditSnappyBag(pick(bySlot.bag));
                        setEditSnappyBg(
                          SNAPPY_BG_COLORS[
                            Math.floor(Math.random() * SNAPPY_BG_COLORS.length)
                          ],
                        );
                      }}
                    >
                      <Text style={ac.quickIcon}>🎲</Text>
                      <Text style={ac.quickText}>Random Outfit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={ac.quickBtn}
                      onPress={() => {
                        setEditSnappyHat("");
                        setEditSnappyGlasses("");
                        setEditSnappyOutfit("");
                        setEditSnappyBottom("");
                        setEditSnappyShoes("");
                        setEditSnappyBag("");
                      }}
                    >
                      <Text style={ac.quickIcon}>🗑️</Text>
                      <Text style={ac.quickText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Background color */}
                <View style={ac.panel}>
                  <Text style={ac.panelLabel}>BACKGROUND</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 10,
                        paddingVertical: 2,
                      }}
                    >
                      {SNAPPY_BG_COLORS.map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => setEditSnappyBg(c)}
                          style={[
                            ac.bgSwatch,
                            { backgroundColor: c },
                            editSnappyBg === c && ac.bgSwatchActive,
                          ]}
                        />
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Accessory category rows */}
                {ACCESSORY_CATEGORIES.map((cat) => {
                  const currentVal =
                    cat.slot === "hat"
                      ? editSnappyHat
                      : cat.slot === "glasses"
                        ? editSnappyGlasses
                        : cat.slot === "bottom"
                          ? editSnappyBottom
                          : cat.slot === "shoes"
                            ? editSnappyShoes
                            : cat.slot === "bag"
                              ? editSnappyBag
                              : editSnappyOutfit;
                  const setter =
                    cat.slot === "hat"
                      ? setEditSnappyHat
                      : cat.slot === "glasses"
                        ? setEditSnappyGlasses
                        : cat.slot === "bottom"
                          ? setEditSnappyBottom
                          : cat.slot === "shoes"
                            ? setEditSnappyShoes
                            : cat.slot === "bag"
                              ? setEditSnappyBag
                              : setEditSnappyOutfit;
                  const icon = CAT_ICON[cat.slot] ?? "•";
                  return (
                    <View key={cat.slot} style={ac.catPanel}>
                      <View style={ac.catHeader}>
                        <Text style={ac.catIcon}>{icon}</Text>
                        <Text style={ac.catLabel}>
                          {cat.label.toUpperCase()}
                        </Text>
                        {currentVal ? (
                          <TouchableOpacity
                            onPress={() => setter("")}
                            style={{ marginLeft: "auto" }}
                          >
                            <Text style={ac.catClear}>✕ Remove</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={ac.itemRow}
                      >
                        {cat.items.map((item) => {
                          const Comp = item.Component;
                          const sel = currentVal === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => setter(sel ? "" : item.id)}
                              style={[ac.itemCard, sel && ac.itemCardSel]}
                            >
                              <View style={ac.itemInner}>
                                <Comp size={62} uid={`${item.id}_pck`} />
                              </View>
                              <Text style={ac.itemName} numberOfLines={1}>
                                {item.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  );
                })}

                {/* Bio */}
                <View style={ac.panel}>
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

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
          {/* Hero */}
          <View style={s.hero}>
            <TouchableOpacity onPress={openEdit} activeOpacity={0.85}>
              <SnappyCharacter
                color={snappyColor}
                bg={snappyBg}
                hat={snappyHat}
                glasses={snappyGlasses}
                outfit={snappyOutfit}
                bottom={snappyBottom}
                shoes={snappyShoes}
                bag={snappyBag}
                size={180}
              />
            </TouchableOpacity>
            <Text style={s.heroUsername}>@{username}</Text>
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
              style={[
                s.menuRow,
                { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[s.menuIcon, { backgroundColor: "#ede9fe" }]}>
                <Users size={16} color="#7c3aed" />
              </View>
              <Text style={[s.menuLabel, { flex: 1 }]}>Friends</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openEdit} style={s.menuRow}>
              <View style={[s.menuIcon, { backgroundColor: "#dcfce7" }]}>
                <Pencil size={16} color="#16a34a" />
              </View>
              <Text style={[s.menuLabel, { flex: 1 }]}>
                Edit Profile & Mascot
              </Text>
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
        {/* Brand header */}
        <View style={s.authBrand}>
          <SnappyCharacter
            color={SNAPPY_COLORS[0]}
            hat=""
            glasses=""
            outfit=""
            bottom=""
            shoes=""
            bag=""
            size={72}
          />
          <Text style={s.authBrandTitle}>TopicWalk</Text>
          <Text style={s.authBrandSub}>Walk. Discover. Hunt.</Text>
        </View>

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
    paddingTop: 24,
    paddingBottom: 48,
    gap: 14,
  },
  authBrand: {
    alignItems: "center",
    gap: 4,
    paddingBottom: 12,
  },
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
    gap: 8,
    paddingTop: 16,
    paddingBottom: 20,
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

  // ── Snappy edit modal ──────────────────────────────────────────────────────
  skinCard: {
    alignItems: "center",
    gap: 6,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    minWidth: 80,
  },
  skinCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  skinName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: 0.2,
  },
  slotHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotClearBtn: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.destructive,
  },
  accessoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  accessoryCard: {
    width: 78,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  accessoryCardActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
    backgroundColor: `${colors.primary}12`,
  },
  accessoryPreview: {
    width: 60,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  accessoryName: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.mutedForeground,
    textAlign: "center",
  },
});

// ── Accessories editor styles ──────────────────────────────────────────────────
const ac = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#bfdbfe",
  },
  headerBtn: { minWidth: 64, padding: 4 },
  headerBtnCancel: { fontSize: 16, color: colors.mutedForeground },
  headerBtnSave: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    textAlign: "right",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1d4ed8",
    letterSpacing: -0.3,
  },

  previewSection: {
    backgroundColor: "#dbeafe",
    alignItems: "center",
    paddingVertical: 24,
    gap: 14,
  },
  previewCard: {
    backgroundColor: "white",
    borderRadius: 28,
    padding: 20,
    shadowColor: "#1d4ed8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
    alignItems: "center",
  },

  lookNav: { flexDirection: "row", alignItems: "center", gap: 20 },
  lookArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lookArrowText: { fontSize: 14, color: "#1d4ed8", fontWeight: "800" },
  lookLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
    letterSpacing: 1.5,
  },

  panel: {
    backgroundColor: "white",
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1d4ed8",
    letterSpacing: 1.5,
  },

  quickGrid: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  quickIcon: { fontSize: 20 },
  quickText: { fontSize: 13, fontWeight: "700", color: "#1d4ed8" },

  bgSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#bfdbfe",
  },
  bgSwatchActive: { borderWidth: 3, borderColor: "#2563eb" },

  catPanel: {
    backgroundColor: "white",
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  catIcon: { fontSize: 18 },
  catLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
    letterSpacing: 1,
  },
  catClear: { fontSize: 12, fontWeight: "600", color: "#ef4444" },

  itemRow: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  itemCard: {
    width: 84,
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8faff",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  itemCardSel: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  itemInner: {
    width: 68,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  itemName: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748b",
    textAlign: "center",
  },
});
