import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "~/components/logout-button";
import { Button } from "~/components/ui/button";
import { createClient } from "~/lib/supabase/server";

export async function AuthNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username =
    (user?.user_metadata?.username as string | undefined) ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 max-w-5xl mx-auto">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/image-1786109910251.png"
            alt="TopicWalk"
            height={32}
            width={140}
            className="object-contain h-8 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/walk">Walk</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/seek">Hunt</Link>
          </Button>
          {user ? (
            <>
              {username && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Hi,{" "}
                  <span className="font-medium text-foreground">
                    {username}
                  </span>
                </span>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/auth?tab=login">Log In</Link>
              </Button>
              <Button size="sm" asChild className="font-semibold shadow-sm">
                <Link href="/auth?tab=signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
