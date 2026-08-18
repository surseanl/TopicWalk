import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import {
  Check,
  QrCode,
  ScanLine,
  Share2,
  UserMinus,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, primaryTint } from "../../lib/theme";

type FriendUser = { id: string; username: string };
type RichFriendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  friend: FriendUser | undefined;
};

export default function FriendsScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("");
  const [myFriendCode, setMyFriendCode] = useState<string>("");
  const [friendships, setFriendships] = useState<RichFriendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [usernameInput, setUsernameInput] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [addingCode, setAddingCode] = useState(false);
  const scanned = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadUser();
      else {
        setUserId(null);
        setMyUsername("");
        setMyFriendCode("");
        setFriendships([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const query = usernameInput.trim().toLowerCase();
    if (query.length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      let q = supabase
        .from("tw_users")
        .select("id, username")
        .ilike("username", `${query}%`)
        .limit(8);
      if (userId) q = q.neq("id", userId);
      const { data } = await q;
      setSearchResults(data ?? []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [usernameInput, userId]);

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);
    const { data } = await supabase
      .from("tw_users")
      .select("username, friend_code")
      .eq("id", session.user.id)
      .maybeSingle();
    setMyUsername(data?.username ?? "");
    setMyFriendCode(data?.friend_code ?? "");
    await loadFriendships(session.user.id);
  }

  async function loadFriendships(uid: string) {
    const { data: rows } = await supabase
      .from("tw_friendships")
      .select("*")
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!rows?.length) {
      setFriendships([]);
      setLoading(false);
      return;
    }

    const otherIds = rows.map((f) =>
      f.requester_id === uid ? f.addressee_id : f.requester_id,
    );
    const { data: users } = await supabase
      .from("tw_users")
      .select("id, username")
      .in("id", otherIds);
    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    setFriendships(
      rows.map((f) => ({
        ...f,
        friend: userMap.get(
          f.requester_id === uid ? f.addressee_id : f.requester_id,
        ),
      })),
    );
    setLoading(false);
  }

  async function sendRequest(toUserId: string) {
    if (!userId) return;
    setActionPending(toUserId);
    await supabase.from("tw_friendships").insert({
      requester_id: userId,
      addressee_id: toUserId,
      status: "pending",
    });
    await loadFriendships(userId);
    setActionPending(null);
  }

  async function acceptRequest(id: string) {
    if (!userId) return;
    setActionPending(id);
    await supabase
      .from("tw_friendships")
      .update({ status: "accepted" })
      .eq("id", id);
    await loadFriendships(userId);
    setActionPending(null);
  }

  async function deleteRelation(id: string) {
    if (!userId) return;
    setActionPending(id);
    await supabase.from("tw_friendships").delete().eq("id", id);
    await loadFriendships(userId);
    setActionPending(null);
  }

  async function openScanner() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert("Camera needed", "Allow camera access to scan QR codes.");
        return;
      }
    }
    scanned.current = false;
    setShowScanner(true);
  }

  async function resolveAndAdd(user: FriendUser | null, notFoundMsg: string) {
    if (!user) {
      Alert.alert("Not found", notFoundMsg);
      return;
    }
    const existing = friendships.find((f) => {
      const other = f.requester_id === userId ? f.addressee_id : f.requester_id;
      return other === user.id;
    });
    if (existing?.status === "accepted") {
      Alert.alert(
        "Already friends!",
        `You and @${user.username} are already friends.`,
      );
      return;
    }
    if (existing?.status === "pending") {
      if (existing.requester_id === userId) {
        Alert.alert(
          "Request sent",
          `You already sent @${user.username} a friend request.`,
        );
      } else {
        Alert.alert(
          "Accept request?",
          `@${user.username} already sent you a request.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Accept", onPress: () => acceptRequest(existing.id) },
          ],
        );
      }
      return;
    }
    Alert.alert("Add friend?", `Send a friend request to @${user.username}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Add", onPress: () => sendRequest(user.id) },
    ]);
  }

  async function handleCodeAdd() {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    if (code === myFriendCode) {
      Alert.alert("That's your own code!");
      return;
    }
    setAddingCode(true);
    const { data: user } = await supabase
      .from("tw_users")
      .select("id, username")
      .eq("friend_code", code)
      .maybeSingle();
    await resolveAndAdd(user, `No account with code "${code}".`);
    setCodeInput("");
    setAddingCode(false);
  }

  async function handleScannedCode(data: string) {
    if (scanned.current) return;
    scanned.current = true;
    setShowScanner(false);
    const code = data.trim().toUpperCase();
    if (code === myFriendCode) {
      Alert.alert("That's your own code!");
      return;
    }
    const { data: user } = await supabase
      .from("tw_users")
      .select("id, username")
      .eq("friend_code", code)
      .maybeSingle();
    await resolveAndAdd(user, `No account with code "${code}".`);
  }

  async function shareCode() {
    try {
      await Share.share({
        message: `Add me on TopicWalk! My friend code is: ${myFriendCode}`,
      });
    } catch {}
  }

  async function copyCode() {
    await Clipboard.setStringAsync(myFriendCode);
    Alert.alert("Copied!", "Your friend code has been copied to clipboard.");
  }

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === userId,
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === userId,
  );

  if (!loading && !userId) {
    return (
      <SafeAreaView edges={["bottom"]} style={[s.safe, s.center]}>
        <Text style={s.pageTitle}>Sign in to add friends</Text>
        <Text style={[s.muted, s.textCenter, { marginBottom: 24 }]}>
          Connect with friends to see each other's walks and photos.
        </Text>
        <Text style={s.muted}>Go to Profile to sign in →</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      {/* My QR Code modal */}
      <Modal
        visible={showMyQR}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMyQR(false)}
      >
        <SafeAreaView style={s.modalSafe}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>My Friend Code</Text>
            <TouchableOpacity
              onPress={() => setShowMyQR(false)}
              style={s.closeBtn}
            >
              <X size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={s.qrContainer}>
            <View style={s.qrCard}>
              {myFriendCode ? (
                <QRCode
                  value={myFriendCode}
                  size={200}
                  color={colors.foreground}
                  backgroundColor={colors.card}
                />
              ) : (
                <ActivityIndicator color={colors.primary} />
              )}
            </View>
            <View style={s.codeBox}>
              <Text style={s.codeText}>{myFriendCode || "…"}</Text>
            </View>
            <Text style={s.qrUsername}>@{myUsername}</Text>
            <Text style={[s.muted, { textAlign: "center", marginTop: -8 }]}>
              Share your code or have a friend scan the QR
            </Text>
            <View style={s.qrActions}>
              <TouchableOpacity onPress={copyCode} style={s.qrActionBtn}>
                <Text style={s.qrActionText}>Copy code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={shareCode}
                style={[s.qrActionBtn, s.qrActionPrimary]}
              >
                <Share2 size={15} color="#fff" />
                <Text style={[s.qrActionText, { color: "#fff" }]}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* QR Scanner modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={s.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(result) => handleScannedCode(result.data)}
          />
          <View style={s.scannerOverlay}>
            <View style={s.scannerFrame} />
            <Text style={s.scannerHint}>Point at a friend's QR code</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowScanner(false)}
            style={s.scannerClose}
          >
            <X size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View style={s.titleRow}>
          <View>
            <Text style={s.pageTitle}>Friends</Text>
            <Text style={s.muted}>
              {accepted.length === 0
                ? "Add friends to see their walks"
                : `${accepted.length} friend${accepted.length === 1 ? "" : "s"}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowMyQR(true)}
            style={s.myCodeBtn}
          >
            <QrCode size={16} color={colors.primary} />
            <Text style={s.myCodeText}>My Code</Text>
          </TouchableOpacity>
        </View>

        {/* Username search */}
        <View style={{ gap: 0 }}>
          <View style={s.codeInputRow}>
            <TextInput
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder="Search by username…"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
              style={s.codeInputField}
            />
            {searching && (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
            )}
          </View>
          {(searchResults.length > 0 ||
            (!searching && usernameInput.trim().length > 0)) && (
            <View style={s.searchResults}>
              {searchResults.length === 0 && (
                <View style={s.searchRow}>
                  <Text style={s.muted}>No users found</Text>
                </View>
              )}
              {searchResults.map((u, i) => {
                const rel = friendships.find((f) => {
                  const other =
                    f.requester_id === userId ? f.addressee_id : f.requester_id;
                  return other === u.id;
                });
                const isAccepted = rel?.status === "accepted";
                const isPending = rel?.status === "pending";
                const isSent = isPending && rel?.requester_id === userId;
                return (
                  <View key={u.id} style={[s.searchRow, i > 0 && s.borderTop]}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>
                        {u.username[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[s.listName, { flex: 1 }]}>@{u.username}</Text>
                    {isAccepted ? (
                      <Text style={[s.muted, { fontSize: 13 }]}>Friends</Text>
                    ) : isSent ? (
                      <Text style={[s.muted, { fontSize: 13 }]}>Sent</Text>
                    ) : isPending ? (
                      <TouchableOpacity
                        onPress={() => rel && acceptRequest(rel.id)}
                        style={s.primaryBtn}
                      >
                        <Check size={13} color="#fff" />
                        <Text style={s.primaryBtnText}>Accept</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => sendRequest(u.id)}
                        disabled={actionPending === u.id}
                        style={[
                          s.primaryBtn,
                          { opacity: actionPending === u.id ? 0.6 : 1 },
                        ]}
                      >
                        <Text style={s.primaryBtnText}>Add</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Friend code entry */}
        <View style={s.codeInputRow}>
          <TextInput
            value={codeInput}
            onChangeText={(t) => setCodeInput(t.toUpperCase())}
            placeholder="Enter friend code…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={[s.codeInputField, s.codeInputMono]}
          />
          <TouchableOpacity
            onPress={handleCodeAdd}
            disabled={addingCode || !codeInput.trim()}
            style={[
              s.codeInputAdd,
              { opacity: addingCode || !codeInput.trim() ? 0.5 : 1 },
            ]}
          >
            {addingCode ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={s.codeInputAddText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Scan button */}
        <TouchableOpacity onPress={openScanner} style={s.scanBtnFull}>
          <ScanLine size={20} color={colors.primary} />
          <Text style={s.scanBtnText}>Scan Friend's QR Code</Text>
        </TouchableOpacity>

        {/* Incoming requests */}
        {incoming.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={s.sectionLabel}>Requests ({incoming.length})</Text>
            <View style={s.listCard}>
              {incoming.map((f, i) => (
                <View key={f.id} style={[s.listRow, i > 0 && s.borderTop]}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {(f.friend?.username ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.listName, { flex: 1 }]}>
                    {f.friend?.username ?? "Unknown"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => acceptRequest(f.id)}
                      disabled={actionPending === f.id}
                      style={[
                        s.primaryBtn,
                        { opacity: actionPending === f.id ? 0.6 : 1 },
                      ]}
                    >
                      <Check size={14} color="#fff" />
                      <Text style={s.primaryBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteRelation(f.id)}
                      style={s.outlineBtn}
                    >
                      <X size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sent */}
        {outgoing.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={s.sectionLabel}>Sent</Text>
            <View style={s.listCard}>
              {outgoing.map((f, i) => (
                <View key={f.id} style={[s.listRow, i > 0 && s.borderTop]}>
                  <View style={[s.avatar, { backgroundColor: colors.muted }]}>
                    <Text
                      style={[s.avatarText, { color: colors.mutedForeground }]}
                    >
                      {(f.friend?.username ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.listName, { flex: 1 }]}>
                    {f.friend?.username ?? "Unknown"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteRelation(f.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                      padding: 8,
                    }}
                  >
                    <X size={14} color={colors.mutedForeground} />
                    <Text style={s.muted}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Friends list */}
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : accepted.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text style={s.sectionLabel}>Your Friends</Text>
            <View style={s.listCard}>
              {accepted.map((f, i) => (
                <View key={f.id} style={[s.listRow, i > 0 && s.borderTop]}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {(f.friend?.username ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.listName, { flex: 1 }]}>
                    {f.friend?.username ?? "Unknown"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteRelation(f.id)}
                    style={{ padding: 4 }}
                  >
                    <UserMinus size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ) : incoming.length === 0 && outgoing.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={[s.listName, { marginBottom: 4 }]}>
              No friends yet
            </Text>
            <Text style={[s.muted, s.textCenter]}>
              Enter a friend code above, tap "My Code" to share yours, or scan a
              friend's QR code.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 18,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.foreground,
  },
  muted: { fontSize: 14, color: colors.mutedForeground },
  textCenter: { textAlign: "center" },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  myCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: primaryTint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 4,
  },
  myCodeText: { fontSize: 14, fontWeight: "700", color: colors.primary },

  searchResults: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    marginTop: -4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  codeInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  codeInputField: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  codeInputMono: { letterSpacing: 2, fontWeight: "700" },
  codeInputAdd: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  codeInputAddText: { fontSize: 15, fontWeight: "700", color: "#fff" },

  scanBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    height: 52,
  },
  scanBtnText: { fontSize: 15, fontWeight: "700", color: colors.primary },

  listCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: "hidden",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  borderTop: { borderTopWidth: 1, borderTopColor: colors.border },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "800", color: colors.primary },
  listName: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: colors.foreground,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  primaryBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  outlineBtnText: { fontSize: 14, fontWeight: "600", color: colors.foreground },

  emptyState: {
    backgroundColor: colors.muted,
    borderRadius: 16,
    padding: 36,
    alignItems: "center",
  },

  // ── My QR modal ────────────────────────────────────────────────────────────
  modalSafe: { flex: 1, backgroundColor: colors.background },
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
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  qrContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  qrCard: {
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  codeBox: {
    backgroundColor: primaryTint,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 6,
    color: colors.primary,
  },
  qrUsername: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: colors.mutedForeground,
  },
  qrActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  qrActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  qrActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qrActionText: { fontSize: 15, fontWeight: "700", color: colors.foreground },

  // ── Scanner ────────────────────────────────────────────────────────────────
  scannerContainer: { flex: 1, backgroundColor: "#000" },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  scannerFrame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  scannerHint: { color: "#fff", fontSize: 15, fontWeight: "600" },
  scannerClose: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
