"use client";

import { ArrowLeft, Check, Search, UserMinus, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Identity } from "~/lib/identity";
import { getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { syncIdentityFromSupabase } from "~/lib/sync-identity";
import { cn } from "~/lib/utils";

type FriendUser = { id: string; username: string };
type RichFriendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  friend: FriendUser | undefined;
};

export default function FriendsPage() {
  const supabase = createClient();

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [friendships, setFriendships] = useState<RichFriendship[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once
  useEffect(() => {
    async function init() {
      let id = getIdentity();
      if (!id || id.isGuest) {
        await syncIdentityFromSupabase(supabase);
        id = getIdentity();
      }
      if (!id || id.isGuest) {
        setLoading(false);
        return;
      }
      setIdentity(id);
      await loadFriendships(id.userId);
    }
    void init();
  }, []);

  async function loadFriendships(userId: string) {
    setLoading(true);
    const { data: rows } = await supabase
      .from("tw_friendships")
      .select("*")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!rows || rows.length === 0) {
      setFriendships([]);
      setLoading(false);
      return;
    }

    const otherIds = rows.map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id,
    );

    const { data: users } = await supabase
      .from("tw_users")
      .select("id, username")
      .in("id", otherIds);

    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const rich: RichFriendship[] = rows.map((f) => ({
      ...f,
      friend: userMap.get(
        f.requester_id === userId ? f.addressee_id : f.requester_id,
      ),
    }));

    setFriendships(rich);
    setLoading(false);
  }

  // Debounced username search — inlined to avoid stale-closure dep issues
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    if (!identity) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("tw_users")
        .select("id, username")
        .ilike("username", `%${q}%`)
        .neq("id", identity.userId)
        .limit(8);
      if (!cancelled) {
        setSearchResults(data ?? []);
        setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, identity, supabase]);

  async function sendRequest(toUserId: string) {
    if (!identity) return;
    setActionPending(toUserId);
    await supabase.from("tw_friendships").insert({
      requester_id: identity.userId,
      addressee_id: toUserId,
      status: "pending",
    });
    await loadFriendships(identity.userId);
    setActionPending(null);
  }

  async function acceptRequest(friendshipId: string) {
    if (!identity) return;
    setActionPending(friendshipId);
    await supabase
      .from("tw_friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    await loadFriendships(identity.userId);
    setActionPending(null);
  }

  async function declineRequest(friendshipId: string) {
    if (!identity) return;
    setActionPending(friendshipId);
    await supabase.from("tw_friendships").delete().eq("id", friendshipId);
    await loadFriendships(identity.userId);
    setActionPending(null);
  }

  async function removeFriend(friendshipId: string) {
    if (!identity) return;
    setActionPending(friendshipId);
    await supabase.from("tw_friendships").delete().eq("id", friendshipId);
    await loadFriendships(identity.userId);
    setActionPending(null);
  }

  // Derive sections
  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter(
    (f) => f.status === "pending" && f.addressee_id === identity?.userId,
  );
  const outgoing = friendships.filter(
    (f) => f.status === "pending" && f.requester_id === identity?.userId,
  );

  // Build a set of user IDs that already have a relationship so search can show status
  const relationshipMap = new Map(
    friendships.map((f) => {
      const otherId =
        f.requester_id === identity?.userId ? f.addressee_id : f.requester_id;
      return [otherId, f];
    }),
  );

  if (!loading && (!identity || identity.isGuest)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Friends</h1>
        </div>
        <div className="rounded-xl border bg-card p-8 text-center space-y-4">
          <p className="text-2xl">👥</p>
          <p className="font-semibold">Sign in to add friends</p>
          <p className="text-sm text-muted-foreground">
            Connect with friends to see each other&apos;s walks and photos.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/auth?tab=signup">
              <Button>Sign Up</Button>
            </Link>
            <Link href="/auth?tab=login">
              <Button variant="outline">Log In</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/60 transition-colors active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Friends</h1>
          <p className="text-xs text-muted-foreground">
            {accepted.length === 0
              ? "Add friends by username"
              : `${accepted.length} friend${accepted.length === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by username…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search results */}
        {(searching || searchResults.length > 0) && (
          <div className="rounded-xl border bg-card divide-y divide-border shadow-sm overflow-hidden">
            {searching && (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                Searching…
              </div>
            )}
            {!searching &&
              searchResults.length === 0 &&
              searchQuery.trim().length >= 2 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            {searchResults.map((user) => {
              const rel = relationshipMap.get(user.id);
              const isFriend = rel?.status === "accepted";
              const isPending = rel?.status === "pending";
              const iAmRequester = rel?.requester_id === identity?.userId;

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {user.username[0].toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm font-medium">{user.username}</p>
                  {isFriend ? (
                    <span className="text-xs text-muted-foreground">
                      Friends
                    </span>
                  ) : isPending && iAmRequester ? (
                    <span className="text-xs text-muted-foreground">
                      Requested
                    </span>
                  ) : isPending && !iAmRequester ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acceptRequest(rel.id)}
                      disabled={actionPending === rel.id}
                    >
                      Accept
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => sendRequest(user.id)}
                      disabled={actionPending === user.id}
                      className="gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Friend Requests ({incoming.length})
          </h2>
          <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
            {incoming.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {(f.friend?.username ?? "?")[0].toUpperCase()}
                </div>
                <p className="flex-1 text-sm font-medium">
                  {f.friend?.username ?? "Unknown"}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => acceptRequest(f.id)}
                    disabled={actionPending === f.id}
                    className={cn(
                      "gap-1 h-8 px-2.5",
                      actionPending === f.id && "opacity-50",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => declineRequest(f.id)}
                    disabled={actionPending === f.id}
                    className="h-8 px-2.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Sent Requests
          </h2>
          <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
            {outgoing.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                  {(f.friend?.username ?? "?")[0].toUpperCase()}
                </div>
                <p className="flex-1 text-sm font-medium">
                  {f.friend?.username ?? "Unknown"}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => declineRequest(f.id)}
                  disabled={actionPending === f.id}
                  className="h-8 px-2.5 text-muted-foreground hover:text-destructive gap-1 text-xs"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div className="space-y-2">
        {accepted.length > 0 && (
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Your Friends
          </h2>
        )}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-xl border bg-card px-4 py-3 flex items-center gap-3 animate-pulse"
              >
                <div className="w-8 h-8 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded flex-1" />
              </div>
            ))}
          </div>
        ) : accepted.length === 0 &&
          incoming.length === 0 &&
          outgoing.length === 0 ? (
          <div className="rounded-xl bg-muted/50 p-8 text-center space-y-2">
            <p className="text-2xl">🤝</p>
            <p className="text-sm font-medium">No friends yet</p>
            <p className="text-xs text-muted-foreground">
              Search for a username above to send a friend request.
            </p>
          </div>
        ) : (
          accepted.length > 0 && (
            <div className="rounded-xl border bg-card divide-y divide-border overflow-hidden">
              {accepted.map((f) => (
                <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {(f.friend?.username ?? "?")[0].toUpperCase()}
                  </div>
                  <p className="flex-1 text-sm font-medium">
                    {f.friend?.username ?? "Unknown"}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFriend(f.id)}
                    disabled={actionPending === f.id}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    title="Remove friend"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
