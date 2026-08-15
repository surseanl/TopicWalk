"use client";

import { Camera, Copy, LogOut, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import type { Identity } from "~/lib/identity";
import { clearIdentity, getIdentity } from "~/lib/identity";

export default function HomePage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [copied, setCopied] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (!id) {
      router.replace("/");
      return;
    }
    if (id.isGuest) {
      router.replace("/walk");
      return;
    }
    setIdentity(id);
  }, []);

  function copyCode() {
    if (!identity) return;
    navigator.clipboard.writeText(identity.groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function leave() {
    clearIdentity();
    router.push("/");
  }

  if (!identity) return null;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-sm">
        <Image
          src="/image-1786109910251.png"
          alt="TopicWalk"
          height={36}
          width={155}
          className="object-contain"
          priority
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={leave}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          Leave
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 gap-4 max-w-lg mx-auto w-full">
        {/* Group code card */}
        <div className="animate-scale-in w-full rounded-2xl bg-gradient-to-br from-primary/8 via-background to-secondary/5 border border-primary/15 shadow-sm p-5 text-center space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Your Group
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-3xl font-bold tracking-widest text-primary">
              {identity.groupCode}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 active:scale-90"
              aria-label="Copy group code"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
          {copied ? (
            <p className="text-xs text-primary font-semibold animate-fade-in">
              Copied!
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Share this code so friends can join
            </p>
          )}
          <div className="h-px bg-border/50 my-1" />
          <p className="text-sm font-semibold text-foreground">
            Welcome back, {identity.displayName}
          </p>
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 gap-3 w-full">
          <Link href="/walk" className="block">
            <div className="animate-fade-in-up animation-delay-100 group rounded-2xl border-2 border-primary/20 bg-primary/5 p-5 transition-all duration-200 hover:bg-primary/10 hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-primary/25">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Free Walk</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Capture today&apos;s topics. See your group&apos;s feed.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/seek" className="block">
            <div className="animate-fade-in-up animation-delay-200 group rounded-2xl border-2 border-secondary/20 bg-secondary/5 p-5 transition-all duration-200 hover:bg-secondary/10 hover:border-secondary/35 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-secondary/15 flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-secondary/25">
                  <MapPin className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">
                    Mascot Hunt
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Hide the mascot. Unlock tiles by walking. Capture first!
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
