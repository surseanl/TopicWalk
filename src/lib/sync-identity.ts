import type { SupabaseClient } from "@supabase/supabase-js";
import { getIdentity, saveIdentity } from "./identity";

export async function syncIdentityFromSupabase(
  supabase: SupabaseClient,
): Promise<boolean> {
  // getSession reads from cookies without a network call — correct for client components.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const user = session.user;

  const existing = getIdentity();
  if (existing && !existing.isGuest) return true;

  let { data: userData } = await supabase
    .from("tw_users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  // Row missing — user signed up before the callback upsert was in place.
  // Create it now from auth metadata so they aren't permanently locked out.
  if (!userData) {
    const metaUsername =
      (user.user_metadata?.username as string | undefined) ?? "";
    let username = metaUsername || `user_${user.id.slice(0, 8)}`;

    const { data: conflict } = await supabase
      .from("tw_users")
      .select("id")
      .eq("username", username)
      .neq("id", user.id)
      .maybeSingle();

    if (conflict) username = `${username}_${user.id.slice(0, 4)}`;

    await supabase
      .from("tw_users")
      .upsert(
        { id: user.id, username, email: user.email ?? "" },
        { onConflict: "id", ignoreDuplicates: true },
      );

    const { data: refreshed } = await supabase
      .from("tw_users")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    userData = refreshed;
  }

  if (!userData) return false;

  const groupId = user.id;
  const derivedCode = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  await supabase.from("tw_groups").insert({ id: groupId, code: derivedCode });

  const { data: group } = await supabase
    .from("tw_groups")
    .select("code")
    .eq("id", groupId)
    .maybeSingle();

  saveIdentity({
    userId: user.id,
    displayName: userData.username,
    groupCode: group?.code ?? derivedCode,
    groupId,
    isGuest: false,
  });

  return true;
}
