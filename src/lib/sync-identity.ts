import type { SupabaseClient } from "@supabase/supabase-js";
import { getIdentity, saveIdentity } from "./identity";

export async function syncIdentityFromSupabase(
  supabase: SupabaseClient,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const existing = getIdentity();
  if (existing && !existing.isGuest) return true;

  const { data: userData } = await supabase
    .from("tw_users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!userData) return false;

  // Each user's personal group uses their auth ID as the group ID.
  // First 8 hex chars of UUID → readable group code (4B+ combinations).
  const groupId = user.id;
  const derivedCode = user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

  // Create personal group if it doesn't exist yet (ignore duplicate errors).
  await supabase.from("tw_groups").insert({ id: groupId, code: derivedCode });

  // Fetch actual code in case the row already existed with a different code.
  const { data: group } = await supabase
    .from("tw_groups")
    .select("code")
    .eq("id", groupId)
    .maybeSingle();

  const groupCode = group?.code ?? derivedCode;

  saveIdentity({
    userId: user.id,
    displayName: userData.username,
    groupCode,
    groupId,
    isGuest: false,
  });

  return true;
}
