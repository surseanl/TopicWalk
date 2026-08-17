import { Check, Search, UserMinus, UserPlus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [friendships, setFriendships] = useState<RichFriendship[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    void loadUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadUser();
      } else {
        setUserId(null);
        setFriendships([]);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runSearch captured in closure
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => void runSearch(q), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, userId]);

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }
    setUserId(session.user.id);
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

  async function runSearch(q: string) {
    if (!userId) return;
    const { data } = await supabase
      .from("tw_users")
      .select("id, username")
      .ilike("username", `%${q}%`)
      .neq("id", userId)
      .limit(8);
    setSearchResults(data ?? []);
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

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === userId,
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === userId,
  );
  const relationshipMap = new Map(
    friendships.map((f) => {
      const otherId =
        f.requester_id === userId ? f.addressee_id : f.requester_id;
      return [otherId, f];
    }),
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        <View>
          <Text style={s.pageTitle}>Friends</Text>
          <Text style={s.muted}>
            {accepted.length === 0
              ? "Search by username to add friends"
              : `${accepted.length} friend${accepted.length === 1 ? "" : "s"}`}
          </Text>
        </View>

        {/* Search bar */}
        <View style={s.searchBar}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by username…"
            placeholderTextColor={colors.mutedForeground}
            style={s.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search results */}
        {searchResults.length > 0 && (
          <View style={s.listCard}>
            {searchResults.map((user, i) => {
              const rel = relationshipMap.get(user.id);
              const isFriend = rel?.status === "accepted";
              const isPending = rel?.status === "pending";
              const iAmRequester = rel?.requester_id === userId;
              return (
                <View key={user.id} style={[s.listRow, i > 0 && s.borderTop]}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>
                      {user.username[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[s.listName, { flex: 1 }]}>{user.username}</Text>
                  {isFriend ? (
                    <Text style={s.muted}>Friends</Text>
                  ) : isPending && iAmRequester ? (
                    <Text style={s.muted}>Requested</Text>
                  ) : isPending && !iAmRequester ? (
                    <TouchableOpacity
                      onPress={() => rel && acceptRequest(rel.id)}
                      style={s.outlineBtn}
                    >
                      <Text style={s.outlineBtnText}>Accept</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => sendRequest(user.id)}
                      disabled={actionPending === user.id}
                      style={[
                        s.primaryBtn,
                        { opacity: actionPending === user.id ? 0.6 : 1 },
                      ]}
                    >
                      <UserPlus size={14} color="#fff" />
                      <Text style={s.primaryBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

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
        ) : incoming.length === 0 &&
          outgoing.length === 0 &&
          searchQuery.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={[s.listName, { marginBottom: 4 }]}>
              No friends yet
            </Text>
            <Text style={[s.muted, s.textCenter]}>
              Search for a username above to send a friend request.
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.foreground,
  },
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
});
