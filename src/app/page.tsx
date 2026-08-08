"use client";

import { Camera, ChevronDown, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimateOnScroll } from "~/components/animate-on-scroll";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getIdentity, saveGuestIdentity, saveIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";

const FEATURES = [
  {
    icon: Camera,
    title: "Free Walk",
    tagline: "Daily challenge",
    color: "text-primary",
    iconBg: "bg-primary/12",
    border: "border-primary/20",
    description:
      "Get 4 daily photo topics — Color, Shape, Theme, and Object. Head outside, find something that fits, and snap a photo. A new set drops every day.",
  },
  {
    icon: MapPin,
    title: "Hide & Seek",
    tagline: "Real-world GPS game",
    color: "text-secondary",
    iconBg: "bg-secondary/12",
    border: "border-secondary/20",
    description:
      "Hide a digital mascot at your GPS location and photo-tag it. Friends hunt it down in real life. The longer it survives undiscovered, the better your score.",
  },
  {
    icon: Users,
    title: "Groups",
    tagline: "Play with friends",
    color: "text-foreground/60",
    iconBg: "bg-muted",
    border: "border-border",
    description:
      "Create a group and share the code with friends. Everyone joins the same walk, sees each other's photos in a shared feed, and reacts to the best finds.",
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"choose" | "join">("choose");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (id && !id.isGuest) router.replace("/home");
  }, []);

  async function createGroup() {
    if (!name.trim()) {
      setError("Enter your name first");
      return;
    }
    setLoading(true);
    setError(null);
    const groupCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error: err } = await supabase
      .from("tw_groups")
      .insert({ code: groupCode })
      .select()
      .single();
    if (err || !data) {
      setError("Failed to create group. Try again.");
      setLoading(false);
      return;
    }
    saveIdentity({
      userId: crypto.randomUUID(),
      displayName: name.trim(),
      groupCode: (data as { code: string }).code,
      groupId: (data as { id: string }).id,
    });
    router.push("/home");
  }

  async function joinGroup() {
    if (!name.trim()) {
      setError("Enter your name first");
      return;
    }
    if (!code.trim()) {
      setError("Enter a group code");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("tw_groups")
      .select()
      .eq("code", code.trim().toUpperCase())
      .single();
    if (err || !data) {
      setError("Group not found. Check the code.");
      setLoading(false);
      return;
    }
    saveIdentity({
      userId: crypto.randomUUID(),
      displayName: name.trim(),
      groupCode: (data as { code: string }).code,
      groupId: (data as { id: string }).id,
    });
    router.push("/home");
  }

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center px-5 pt-16 pb-20 min-h-[92dvh]">
        {/* Gradient blob background — kept left side so mascot blends on the right */}
        <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden>
          <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[260px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-secondary/9 blur-3xl" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-10 max-w-3xl w-full">
          {/* Left: logo + text + CTAs */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-6 flex-1">
            <div className="animate-logo">
              <Image
                src="/image-1786109910251.png"
                alt="TopicWalk"
                height={64}
                width={256}
                className="object-contain"
                priority
              />
            </div>

            <div className="space-y-3 animate-fade-in-up animation-delay-100">
              <h1 className="text-[2.1rem] font-extrabold leading-tight tracking-tight">
                Your daily photo adventure
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                Pick a topic, head outside, and capture what you find. Share
                with friends. Play games. Explore your neighbourhood like never
                before.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap justify-center md:justify-start animate-fade-in-up animation-delay-200">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold shadow-md hover:shadow-lg hover:-translate-y-px active:translate-y-0 active:scale-[0.98] transition-all duration-200"
                onClick={() =>
                  formRef.current?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base font-medium hover:bg-muted/60 hover:-translate-y-px active:translate-y-0 transition-all duration-200"
                onClick={() => {
                  saveGuestIdentity();
                  router.push("/walk");
                }}
              >
                Try Free Walk →
              </Button>
            </div>
          </div>

          {/* Right: mascot */}
          <div className="flex-shrink-0 animate-fade-in animation-delay-300 flex items-center justify-center">
            <Image
              src="/mascot.png"
              alt="TopicWalk mascot"
              height={280}
              width={280}
              className="object-contain animate-float-slow"
            />
          </div>
        </div>

        {/* Scroll hint */}
        <div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 opacity-35 animate-bounce"
          aria-hidden
        >
          <ChevronDown className="h-5 w-5" />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="px-5 py-16 max-w-lg mx-auto w-full">
        <AnimateOnScroll className="text-center mb-8">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            What&apos;s inside
          </p>
          <h2 className="text-2xl font-bold">
            Everything you need for a great walk
          </h2>
        </AnimateOnScroll>

        <div className="space-y-4">
          {FEATURES.map(
            (
              {
                icon: Icon,
                title,
                tagline,
                color,
                iconBg,
                border,
                description,
              },
              i,
            ) => (
              <AnimateOnScroll key={title} variant="scale-in" delay={i * 80}>
                <div
                  className={`flex gap-4 items-start rounded-2xl border ${border} bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-px`}
                >
                  <div
                    className={`p-3 rounded-xl ${iconBg} flex-shrink-0 mt-0.5`}
                  >
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-bold text-base">{title}</p>
                      <span className="text-xs text-muted-foreground">
                        {tagline}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ),
          )}
        </div>
      </section>

      {/* ── Get Started form ──────────────────────────────── */}
      <section ref={formRef} className="px-5 pb-16 max-w-lg mx-auto w-full">
        <AnimateOnScroll className="text-center mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Play with friends
          </p>
          <h2 className="text-2xl font-bold">Ready to start walking?</h2>
        </AnimateOnScroll>

        <AnimateOnScroll delay={100}>
          <div className="bg-card rounded-2xl border shadow-md p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">
                Your Name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Alice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createGroup()}
                maxLength={30}
                className="h-11 text-base"
              />
            </div>

            {mode === "choose" && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  className="h-12 text-base font-semibold shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={createGroup}
                  disabled={loading}
                >
                  {loading ? "Creating…" : "Create Group"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 text-base hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={() => setMode("join")}
                >
                  Join Group
                </Button>
              </div>
            )}

            {mode === "join" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="code">Group Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g. XK9F2A"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && joinGroup()}
                    maxLength={8}
                    className="uppercase tracking-widest font-mono text-lg h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    className="h-12 text-base font-semibold"
                    onClick={joinGroup}
                    disabled={loading}
                  >
                    {loading ? "Joining…" : "Join"}
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => {
                      setMode("choose");
                      setError(null);
                    }}
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 text-center">
                {error}
              </p>
            )}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={200} className="space-y-3 mt-4">
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground h-11 transition-colors"
            onClick={() => {
              saveGuestIdentity();
              router.push("/walk");
            }}
          >
            Try Free Walk without an account →
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Have a TopicWalk account?{" "}
            <Link
              href="/auth"
              className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
            >
              Log In
            </Link>
          </p>
        </AnimateOnScroll>
      </section>
    </div>
  );
}
