import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Determine username: email/password users store it in metadata during signup;
      // OAuth users derive it from their email address.
      let username = (user.user_metadata?.username as string | undefined) ?? "";

      if (!username) {
        username = (user.email ?? "")
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "")
          .slice(0, 28);
        if (!username) username = `user_${user.id.slice(0, 8)}`;
      }

      // Resolve conflicts with a different user's username.
      const { data: conflict } = await supabase
        .from("tw_users")
        .select("id")
        .eq("username", username)
        .neq("id", user.id)
        .maybeSingle();

      if (conflict) {
        username = `${username}_${user.id.slice(0, 4)}`;
      }

      // Upsert so this is idempotent across email confirmation clicks and OAuth logins.
      await supabase
        .from("tw_users")
        .upsert(
          { id: user.id, username, email: user.email ?? "" },
          { onConflict: "id", ignoreDuplicates: true },
        );

      // Store username in auth metadata so the navbar can read it without a DB call.
      if (!user.user_metadata?.username) {
        await supabase.auth.updateUser({ data: { username } });
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
