import Link from "next/link";
import { LogoutButton } from "~/components/logout-button";
import { createClient } from "~/lib/supabase/server";

export async function AuthNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username =
    (user?.user_metadata?.username as string | undefined) ?? null;

  return (
    <div className="border-b border-border/40 bg-background px-4 py-1.5 flex items-center justify-end gap-3 text-sm">
      {username ? (
        <>
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">{username}</span>
          </span>
          <span className="text-border">·</span>
          <LogoutButton />
        </>
      ) : (
        <>
          <Link
            href="/auth"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/auth"
            className="font-medium hover:text-primary transition-colors"
          >
            Sign Up
          </Link>
        </>
      )}
    </div>
  );
}
