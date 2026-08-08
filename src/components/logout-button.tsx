"use client";

import { useRouter } from "next/navigation";
import { createClient } from "~/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
    >
      Log Out
    </button>
  );
}
