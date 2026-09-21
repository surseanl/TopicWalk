"use client";

import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimateOnScroll } from "~/components/animate-on-scroll";
import { Button } from "~/components/ui/button";
import { getIdentity, saveGuestIdentity } from "~/lib/identity";
import { cn } from "~/lib/utils";

// ── Phone cursor animation ───────────────────────────────────────────

type CursorFrame = { x: number; y: number; t: number; click?: boolean };

// y values are expressed as % of the 448px phone content area (phone height 512 - 32 notch - 32 bar)
const CURSOR_SEQUENCES: Record<string, CursorFrame[][]> = {
  "free-walk-locked": [
    // Locked state — tap "Lock in topic" button (~72% from top)
    [
      { x: 50, y: 40, t: 0 },
      { x: 50, y: 72, t: 700 },
      { x: 50, y: 72, t: 1100, click: true },
      { x: 55, y: 50, t: 2000 },
    ],
  ],
  "free-walk": [
    // Step 0 — Pick a topic: tap Color card (Goldenrod card already shows below)
    [
      { x: 50, y: 40, t: 0 },
      { x: 27, y: 29, t: 700 },
      { x: 27, y: 29, t: 1100, click: true },
      { x: 55, y: 50, t: 2000 },
    ],
    // Step 1 — Lock in: tap "Take / Upload Photo" button (~324px from top = 72%)
    [
      { x: 72, y: 18, t: 0 },
      { x: 50, y: 72, t: 800 },
      { x: 50, y: 72, t: 1200, click: true },
      { x: 62, y: 45, t: 2100 },
    ],
    // Step 2 — AI scores: tap "Share to feed →" button (~85% from top)
    [
      { x: 28, y: 35, t: 0 },
      { x: 50, y: 83, t: 800 },
      { x: 50, y: 83, t: 1200, click: true },
      { x: 65, y: 55, t: 2100 },
    ],
    // Step 3 — Feed: tap 🔥 reaction on the "You" post (~82%)
    [
      { x: 50, y: 12, t: 0 },
      { x: 65, y: 82, t: 900 },
      { x: 65, y: 82, t: 1300, click: true },
      { x: 50, y: 55, t: 2200 },
    ],
  ],
  "mascot-hunt": [
    // Step 0 — Radius: tap "5 miles" button (~62%)
    [
      { x: 50, y: 15, t: 0 },
      { x: 50, y: 62, t: 800 },
      { x: 50, y: 62, t: 1200, click: true },
      { x: 62, y: 40, t: 2100 },
    ],
    // Step 1 — Hide: tap "Take Photo Here" button (~72%)
    [
      { x: 30, y: 35, t: 0 },
      { x: 50, y: 72, t: 800 },
      { x: 50, y: 72, t: 1200, click: true },
      { x: 65, y: 50, t: 2100 },
    ],
    // Step 2 — Tiles: tap a covered tile (top-left of the 3x3 grid, ~35%)
    [
      { x: 72, y: 18, t: 0 },
      { x: 22, y: 35, t: 900 },
      { x: 22, y: 35, t: 1300, click: true },
      { x: 65, y: 50, t: 2200 },
    ],
    // Step 3 — Capture: tap "Capture!" button (~86%)
    [
      { x: 50, y: 15, t: 0 },
      { x: 50, y: 86, t: 900 },
      { x: 50, y: 86, t: 1300, click: true },
      { x: 66, y: 55, t: 2200 },
    ],
  ],
};

function PhoneCursor({ stepIndex, mode }: { stepIndex: number; mode: string }) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timers: ReturnType<typeof setTimeout>[] = [];

    const sequence = CURSOR_SEQUENCES[mode]?.[stepIndex];
    if (!sequence?.length) return;

    function run() {
      if (cancelled) return;
      timers.forEach(clearTimeout);
      timers = [];

      setPos({ x: sequence[0].x, y: sequence[0].y });
      setClicking(false);

      for (let i = 1; i < sequence.length; i++) {
        const frame = sequence[i];
        const t = setTimeout(() => {
          if (cancelled) return;
          setPos({ x: frame.x, y: frame.y });
          if (frame.click) {
            setClicking(true);
            const ct = setTimeout(() => {
              if (!cancelled) setClicking(false);
            }, 380);
            timers.push(ct);
          }
        }, frame.t);
        timers.push(t);
      }

      const last = sequence[sequence.length - 1];
      const loop = setTimeout(run, last.t + 1400);
      timers.push(loop);
    }

    const init = setTimeout(run, 500);
    timers.push(init);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [stepIndex, mode]);

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        left: `${pos.x}%`,
        top: `${(pos.y / 100) * 448}px`,
        transition:
          "left 0.5s cubic-bezier(0.34, 1.2, 0.64, 1), top 0.5s cubic-bezier(0.34, 1.2, 0.64, 1)",
      }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2 w-8 h-8">
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-gray-900/55 border-[2.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-150",
            clicking ? "scale-75" : "scale-100",
          )}
        />
        {clicking && (
          <div className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping" />
        )}
        {clicking && (
          <div className="absolute left-1/2 -top-7 animate-click-pop pointer-events-none">
            <span className="text-[10px] font-bold text-white bg-gray-900/80 px-2 py-0.5 rounded-full shadow whitespace-nowrap">
              click!
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const whyMarkerRef = useRef<HTMLDivElement>(null);
  const modesMarkerRef = useRef<HTMLDivElement>(null);
  const formMarkerRef = useRef<HTMLDivElement>(null);
  const [selectedStep, setSelectedStep] = useState(0);
  const [featureSlide, setFeatureSlide] = useState(0);
  const [howItWorksMode, setHowItWorksMode] = useState<
    "free-walk" | "mascot-hunt"
  >("free-walk");
  const [topicLocked, setTopicLocked] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: setTopicLocked is stable
  useEffect(() => {
    setTopicLocked(false);
  }, [selectedStep, howItWorksMode]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (id && !id.isGuest) router.replace("/home");
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureSlide((s) => (s + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center justify-center min-h-[calc(100dvh-4rem)] py-16 px-8 border-b border-border/60">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, #FFD44A 0%, #FFC730 45%, #FFB018 80%, #F0A010 100%)",
          }}
        />

        {/* Floating product chips — visible on wide screens only */}
        <div className="hidden xl:block absolute top-[18%] left-[12%] -rotate-3 animate-fade-in-up animation-delay-300">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500 leading-none">
                Color · Today
              </p>
              <p className="text-xs font-semibold text-gray-900 leading-tight mt-0.5">
                Goldenrod #CA8A04
              </p>
            </div>
          </div>
        </div>

        <div className="hidden xl:block absolute top-[22%] right-[12%] rotate-2 animate-fade-in-up animation-delay-400">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg">
            <p className="text-[11px] text-gray-400 font-medium">
              📍 Nearby mascot
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-0.5">
              18m away — in range!
            </p>
          </div>
        </div>

        <div className="hidden xl:block absolute bottom-[28%] left-[12%] rotate-2 animate-fade-in-up animation-delay-300">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
            <p className="text-4xl font-black text-primary leading-none">87</p>
            <div>
              <p className="text-[11px] text-gray-400 leading-none">
                out of 100
              </p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">
                ✓ Great shot!
              </p>
            </div>
          </div>
        </div>

        <div className="hidden xl:block absolute bottom-[30%] right-[12%] -rotate-2 animate-fade-in-up animation-delay-400">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl px-3.5 py-2.5 shadow-lg flex gap-1.5">
            <span className="text-sm bg-gray-100 rounded-full px-2.5 py-0.5">
              🔥 4
            </span>
            <span className="text-sm bg-gray-100 rounded-full px-2.5 py-0.5">
              ❤️ 2
            </span>
            <span className="text-sm bg-gray-100 rounded-full px-2.5 py-0.5">
              😮 1
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-8 animate-fade-in-up animation-delay-100 max-w-3xl">
          <div className="space-y-4">
            <h1 className="font-display text-[7rem] font-extrabold leading-[1.1] tracking-tight">
              <span className="block">Get a topic.</span>
              <span className="block">Take a walk.</span>
              <span className="block">Explore.</span>
            </h1>
            <p className="text-xl leading-relaxed text-foreground/75 max-w-2xl mx-auto">
              Go outside, capture what you find, and share it with your friends.
              <br />
              Your neighborhood has more to offer than you think.
            </p>
          </div>
          <div className="flex flex-row gap-4 animate-fade-in-up animation-delay-200">
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-semibold !bg-gray-950 !text-white !border-2 !border-gray-950 hover:!bg-gray-800 hover:!border-gray-800 hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl shadow-md"
              onClick={() => router.push("/auth?tab=signup")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              className="h-14 px-10 text-lg font-semibold !bg-transparent !border-2 !border-gray-950 !text-gray-950 hover:!border-secondary hover:!text-secondary hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl"
              onClick={() =>
                whyMarkerRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore More →
            </Button>
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

      {/* ── Sections ─────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto w-full isolate">
        {/* ── Why ──────────────────────────────────────────── */}
        <section className="pt-10 pb-20 w-[min(100vw,76rem)] relative left-1/2 -translate-x-1/2 px-16">
          <div ref={whyMarkerRef} />

          {/* ── Modes callout ────────────────────────────────── */}
          <AnimateOnScroll className="px-5 pt-4 pb-10 w-full">
            <div ref={modesMarkerRef} />
            <div className="text-center space-y-5">
              <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-bold text-sm rounded-full px-4 py-1.5 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Two Modes
              </span>
              <p className="font-display text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
                Endless reasons to{" "}
                <span className="text-secondary">go outside</span>
              </p>
            </div>
          </AnimateOnScroll>

          {(() => {
            const FREE_WALK_STEPS = [
              {
                num: "1.",
                title: "Pick a topic",
                description:
                  "Four fresh challenges drop every morning — a color, shape, theme, and object. Pick whichever one calls to you and head out.",
                screen: topicLocked ? (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Free Walk</p>
                      <p className="text-xs text-primary font-medium">
                        ✓ Topic locked in!
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 p-4 opacity-30 pointer-events-none">
                      <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-amber-400/80 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-orange-500" />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600">
                          Color
                        </p>
                      </div>
                      {(
                        [
                          {
                            label: "Shape",
                            bg: "bg-sky-400/80",
                            color: "text-sky-600",
                          },
                          {
                            label: "Theme",
                            bg: "bg-violet-400/80",
                            color: "text-violet-600",
                          },
                          {
                            label: "Object",
                            bg: "bg-emerald-400/80",
                            color: "text-emerald-600",
                          },
                        ] as const
                      ).map(({ label, bg, color }) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border p-4 flex flex-col items-center gap-2"
                        >
                          <div
                            className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}
                          />
                          <p
                            className={`text-[9px] font-bold uppercase tracking-widest ${color}`}
                          >
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mx-4 mb-4 h-11 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
                      Lock in topic
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Free Walk</p>
                      <p className="text-xs text-muted-foreground">
                        Pick a topic · Take a photo
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 p-4">
                      <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-amber-400/80 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-orange-500" />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                          Color
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-sky-400/80 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-sky-700" />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                          Shape
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-violet-400/80 flex items-center justify-center">
                          <span className="text-violet-800 font-black text-xl leading-none">
                            +
                          </span>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                          Theme
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-emerald-400/80 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-emerald-800" />
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          Object
                        </p>
                      </div>
                    </div>
                    <div className="mx-4 mb-4 rounded-xl bg-card border-2 border-primary shadow-sm p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 rounded-full bg-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">
                          Color · Today
                        </p>
                        <p className="font-bold text-sm leading-tight">
                          Goldenrod #CA8A04
                        </p>
                      </div>
                      <p className="text-emerald-600 text-xs font-bold shrink-0">
                        ✓
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                num: "2.",
                title: "Lock in & head out",
                description:
                  "Select your topic, lock in the daily challenge, and go. Today's pick resets at midnight so every day is fresh.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Free Walk</p>
                      <p className="text-xs text-muted-foreground">
                        Pick a topic · Take a photo
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2 opacity-50">
                      <div className="rounded-xl border-2 border-primary p-2 flex items-center gap-2 bg-primary/5">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/80 flex items-center justify-center shrink-0">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                        </div>
                        <p className="text-[10px] font-bold text-orange-600">
                          Color
                        </p>
                      </div>
                      {(["Shape", "Theme", "Object"] as const).map((label) => (
                        <div
                          key={label}
                          className="rounded-xl border border-border p-2 flex items-center gap-2"
                        >
                          <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                          <p className="text-[10px] text-muted-foreground">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="mx-4 mt-2 rounded-xl bg-card border border-border shadow-sm p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                        <div className="w-4 h-4 rounded-full bg-orange-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">
                          Color
                        </p>
                        <p className="font-bold text-sm leading-tight">
                          Goldenrod #CA8A04
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground mt-1.5">
                      🔒 Today's pick — resets at midnight
                    </p>
                    <div className="px-4 mt-3 mb-4">
                      <div className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                        <Camera className="h-4 w-4" />
                        Take / Upload Photo
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "3.",
                title: "AI scores your shot",
                description:
                  "Submit your photo and AI instantly grades whether it matches the topic. Honest scoring keeps everyone on the same playing field.",
                screen: (
                  <div className="flex flex-col">
                    <div className="relative h-36 bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center overflow-hidden">
                      <Camera className="h-14 w-14 text-amber-300 dark:text-amber-600" />
                      <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        Color · Goldenrod
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 pt-4 pb-2">
                      <div className="text-5xl font-extrabold text-primary leading-none">
                        87
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        out of 100
                      </p>
                    </div>
                    <div className="mx-4 mt-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        ✓ Confident match!
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        The warm amber hue clearly matches Goldenrod. Great
                        find!
                      </p>
                    </div>
                    <div className="px-4 mt-3 flex flex-col gap-2 mb-4">
                      <div className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                        Share to feed →
                      </div>
                      <div className="w-full h-9 rounded-lg border border-border text-xs font-medium text-muted-foreground flex items-center justify-center">
                        Continue
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "4.",
                title: "Your friends see your find",
                description:
                  "Your photo lands in a shared feed. React to what friends found, compare perspectives, and see the same streets through different eyes.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-2 border-b border-border/40">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        Today's Feed
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 p-4">
                      {[
                        {
                          user: "Alex",
                          topic: "Something Red",
                          bg: "bg-red-100 dark:bg-red-900/20",
                          reactions: [
                            ["❤️", "2"],
                            ["🔥", "1"],
                          ],
                        },
                        {
                          user: "Jordan",
                          topic: "Perfect Circle",
                          bg: "bg-sky-100 dark:bg-sky-900/20",
                          reactions: [["😮", "3"]],
                        },
                        {
                          user: "You",
                          topic: "Goldenrod",
                          bg: "bg-amber-100 dark:bg-amber-900/20",
                          reactions: [
                            ["🔥", "4"],
                            ["❤️", "2"],
                          ],
                        },
                      ].map(({ user, topic, bg, reactions }) => (
                        <div
                          key={user}
                          className="rounded-xl border border-border overflow-hidden"
                        >
                          <div
                            className={`${bg} h-14 flex items-center justify-center`}
                          >
                            <Camera className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                          <div className="px-2.5 py-1.5 flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold truncate">
                              {user} · {topic}
                            </p>
                            <div className="flex gap-1 shrink-0">
                              {reactions.map(([r, n]) => (
                                <span
                                  key={r}
                                  className="text-[9px] bg-muted rounded-full px-1.5 py-0.5"
                                >
                                  {r}
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
            ];

            const HUNT_STEPS = [
              {
                num: "1.",
                title: "Pick a play radius",
                description:
                  "Before the round starts, your group agrees on a 5 or 10 mile play area. The hider must stay within that boundary when they drop the mascot.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Mascot Hunt</p>
                      <p className="text-xs text-muted-foreground">
                        📍 Setting up round
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-6 pb-3">
                      <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-1">
                        <MapPin className="h-8 w-8 text-primary" />
                      </div>
                      <p className="font-bold text-base text-center">
                        Choose play radius
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        Mascot must be hidden within this distance
                      </p>
                    </div>
                    <div className="px-4 flex flex-col gap-2.5 mb-4">
                      <div className="w-full h-14 rounded-xl bg-primary text-primary-foreground text-sm font-bold flex flex-col items-center justify-center shadow-sm">
                        <span>5 miles</span>
                        <span className="text-[10px] font-normal opacity-80">
                          Quick game · ~8km radius
                        </span>
                      </div>
                      <div className="w-full h-14 rounded-xl border-2 border-border text-sm font-bold flex flex-col items-center justify-center">
                        <span>10 miles</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          Epic hunt · ~16km radius
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "2.",
                title: "Walk to your hiding spot",
                description:
                  "Head anywhere inside the play area and snap a photo of something prominent nearby — a landmark, a sign, a view. That photo becomes the seekers' only visual clue.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Mascot Hunt</p>
                      <p className="text-xs text-primary font-medium">
                        Walking to hide spot…
                      </p>
                    </div>
                    <div className="px-4 pt-4 flex flex-col gap-3">
                      <div className="rounded-xl bg-muted/60 p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Distance from start
                          </p>
                          <p className="font-bold text-lg leading-tight">
                            1.2 mi
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Radius limit
                          </p>
                          <p className="font-bold text-lg leading-tight text-primary">
                            5 mi
                          </p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-[24%] bg-primary rounded-full" />
                      </div>
                      <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ You're within the play area
                      </p>
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center text-xs text-emerald-700 dark:text-emerald-300">
                        Walk to a good hiding spot and take your photo
                      </div>
                    </div>
                    <div className="px-4 mt-3 mb-4">
                      <div className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
                        <Camera className="h-4 w-4" />
                        Take Photo Here
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "3.",
                title: "Tiles flip as they close in",
                description:
                  "9 tiles cover your hiding-spot photo. Each one flips open as a seeker walks closer — and AI drops a fresh clue every time a tile reveals.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">Alex's mascot</p>
                      <p className="text-xs text-primary">📍 320m away</p>
                    </div>
                    <div className="px-4 pt-3">
                      <div className="relative rounded-xl overflow-hidden aspect-square w-full bg-amber-100 dark:bg-amber-900/20">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {[
                            { k: "r0", v: false },
                            { k: "r1", v: false },
                            { k: "r2", v: true },
                            { k: "r3", v: false },
                            { k: "r4", v: true },
                            { k: "r5", v: true },
                            { k: "r6", v: true },
                            { k: "r7", v: false },
                            { k: "r8", v: false },
                          ].map(({ k, v }) => (
                            <div
                              key={k}
                              className={cn(
                                "border border-background/20 transition-all",
                                v
                                  ? "bg-transparent"
                                  : "bg-gray-900/80 backdrop-blur-sm",
                              )}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-40">
                          <Camera className="h-10 w-10 text-amber-600" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          4 / 9
                        </div>
                      </div>
                    </div>
                    <div className="mx-4 mt-3 mb-4 rounded-xl bg-muted/60 p-3">
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">
                        Clue #4
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "The area has paved ground and open sky above —
                        somewhere outdoors."
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                num: "4.",
                title: "First to capture wins",
                description:
                  "Get close enough, tap Capture, and snap your own photo proving you found the spot. Points logged, round over — everyone sees the reveal.",
                screen: (
                  <div className="flex flex-col">
                    <div className="px-4 pt-4 pb-3 border-b border-border/40">
                      <p className="font-bold text-sm">🎯 Seek</p>
                      <p className="text-xs text-muted-foreground">
                        Active mascots · 1
                      </p>
                    </div>
                    <div className="mx-4 mt-3 rounded-xl border-2 border-primary overflow-hidden">
                      <div className="relative">
                        <div className="bg-amber-100 dark:bg-amber-900/20 h-24 flex items-center justify-center">
                          <div className="grid grid-cols-3 grid-rows-3 absolute inset-0 opacity-80">
                            {[
                              { k: "c0", v: true },
                              { k: "c1", v: true },
                              { k: "c2", v: true },
                              { k: "c3", v: true },
                              { k: "c4", v: true },
                              { k: "c5", v: true },
                              { k: "c6", v: false },
                              { k: "c7", v: true },
                              { k: "c8", v: false },
                            ].map(({ k, v }) => (
                              <div
                                key={k}
                                className={cn(
                                  "border border-background/20",
                                  v ? "bg-transparent" : "bg-gray-900/75",
                                )}
                              />
                            ))}
                          </div>
                          <Camera className="h-8 w-8 text-amber-400/50 relative z-10" />
                        </div>
                        <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full z-20">
                          📍 38m away
                        </div>
                      </div>
                      <div className="p-3 bg-background">
                        <p className="font-semibold text-xs">Alex's mascot</p>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          2m 14s ago · 7/9 tiles revealed
                        </p>
                        <div className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5">
                          🎯 Capture!
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              },
            ];

            const steps =
              howItWorksMode === "free-walk" ? FREE_WALK_STEPS : HUNT_STEPS;
            const active = steps[selectedStep];
            const isLast = selectedStep === steps.length - 1;

            const showCursor = !(
              howItWorksMode === "free-walk" && selectedStep === 3
            );

            return (
              <div className="flex flex-col gap-8 items-center">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  {(
                    [
                      { key: "free-walk", label: "Free Walk" },
                      { key: "mascot-hunt", label: "Mascot Hunt" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setHowItWorksMode(key);
                        setSelectedStep(0);
                      }}
                      className={cn(
                        "rounded-xl px-8 py-3 text-base font-bold transition-all duration-200",
                        howItWorksMode === key
                          ? "bg-foreground text-background hover:scale-[1.04] hover:shadow-lg"
                          : "border-2 border-foreground/25 text-foreground/50 hover:border-foreground/50 hover:text-foreground/70 hover:-translate-y-0.5 hover:shadow-sm",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Side-by-side: phone left, info right */}
                <div className="flex items-center gap-20">
                  {/* Phone + dots stacked */}
                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <AnimateOnScroll variant="scale-in">
                      <button
                        type="button"
                        className={cn(
                          "w-72 rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col select-none text-left",
                          "cursor-pointer active:scale-[0.985] transition-transform duration-100",
                        )}
                        style={{ minHeight: "32rem" }}
                        onClick={() => {
                          if (
                            howItWorksMode === "free-walk" &&
                            selectedStep === 0 &&
                            !topicLocked
                          ) {
                            setTopicLocked(true);
                          } else if (isLast) {
                            formRef.current?.scrollIntoView({
                              behavior: "smooth",
                            });
                          } else {
                            setSelectedStep((s) => s + 1);
                          }
                        }}
                      >
                        <div className="bg-foreground/5 flex justify-center py-2 shrink-0">
                          <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                        </div>
                        <div className="flex-1 relative">
                          {active.screen}
                          {showCursor && (
                            <PhoneCursor
                              stepIndex={
                                howItWorksMode === "free-walk" &&
                                selectedStep === 0 &&
                                topicLocked
                                  ? 0
                                  : selectedStep
                              }
                              mode={
                                howItWorksMode === "free-walk" &&
                                selectedStep === 0 &&
                                topicLocked
                                  ? "free-walk-locked"
                                  : howItWorksMode
                              }
                            />
                          )}
                        </div>
                        <div className="bg-background flex justify-center py-2 shrink-0">
                          <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                        </div>
                      </button>
                    </AnimateOnScroll>

                    {/* Progress dots below phone */}
                    <div className="flex gap-2">
                      {steps.map(({ num }, i) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedStep(i)}
                          aria-label={`Step ${i + 1}`}
                          className={cn(
                            "rounded-full transition-all duration-300",
                            selectedStep === i
                              ? "w-6 h-2 bg-foreground"
                              : "w-2 h-2 bg-foreground/25 hover:bg-foreground/50",
                          )}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {isLast ? "tap to get started" : "tap to continue"}
                    </p>
                  </div>

                  {/* Step info */}
                  <div className="flex flex-col gap-4 w-80">
                    <div>
                      <p className="font-bold text-3xl leading-snug">
                        {active.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                        {active.description}
                      </p>
                    </div>
                    {isLast && (
                      <Button
                        size="lg"
                        className="h-12 px-8 text-base font-semibold transition-all duration-200 !rounded-2xl self-start"
                        onClick={() =>
                          formRef.current?.scrollIntoView({
                            behavior: "smooth",
                          })
                        }
                      >
                        Try it Free →
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>

        {/* ── Features carousel ───────────────────────────── */}
        <section className="border-t border-border/60 w-[min(100vw,76rem)] relative left-1/2 -translate-x-1/2 overflow-hidden">
          <AnimateOnScroll>
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${featureSlide * 100}%)` }}
              >
                {/* Slide 0 — Easily shareable */}
                <div className="w-full shrink-0 flex flex-row items-center justify-center gap-16 py-16 px-16 overflow-hidden">
                  <div className="flex flex-col gap-3 max-w-sm flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary font-bold text-xs rounded-full px-3 py-1 uppercase tracking-widest w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Group Play
                    </span>
                    <h2 className="font-display font-extrabold text-5xl leading-tight tracking-tight">
                      Easily shareable with friends
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Share a group code — everyone who joins sees each other's
                      photos the moment they're submitted. React, compare, see
                      the same streets through different eyes.
                    </p>
                  </div>
                  <div className="w-full max-w-[26rem] rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-foreground/5 flex justify-center py-2.5">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-background flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Free Walk</p>
                          <p className="text-xs text-muted-foreground">
                            Today's Feed · 4 members
                          </p>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-2.5 py-1">
                          <p className="text-xs font-mono font-bold text-primary tracking-widest">
                            TRAIL7
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 p-4">
                        {[
                          {
                            user: "Alex",
                            topic: "Goldenrod #CA8A04",
                            cat: "Color",
                            catColor: "text-orange-500 dark:text-orange-400",
                            score: "87",
                            gradient:
                              "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
                            avatarBg: "bg-orange-500",
                            reactions: [
                              ["❤️", "3"],
                              ["🔥", "1"],
                            ],
                          },
                          {
                            user: "Jordan",
                            topic: "Perfect Circle",
                            cat: "Shape",
                            catColor: "text-sky-500 dark:text-sky-400",
                            score: "74",
                            gradient:
                              "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #38bdf8 100%)",
                            avatarBg: "bg-sky-500",
                            reactions: [
                              ["😮", "2"],
                              ["❤️", "1"],
                            ],
                          },
                          {
                            user: "Sam",
                            topic: "Morning Light",
                            cat: "Theme",
                            catColor: "text-violet-500 dark:text-violet-400",
                            score: "91",
                            gradient:
                              "linear-gradient(135deg, #2e1065 0%, #6d28d9 50%, #a78bfa 100%)",
                            avatarBg: "bg-violet-500",
                            reactions: [
                              ["👍", "1"],
                              ["❤️", "2"],
                            ],
                          },
                        ].map(
                          ({
                            user,
                            topic,
                            cat,
                            catColor,
                            score,
                            gradient,
                            avatarBg,
                            reactions,
                          }) => (
                            <div
                              key={user}
                              className="rounded-xl border border-border overflow-hidden"
                            >
                              <div
                                className="h-24 relative"
                                style={{ background: gradient }}
                              >
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>{score}</span>
                                  <span className="text-emerald-400">✓</span>
                                </div>
                              </div>
                              <div className="px-3 py-2 bg-background">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className={`w-4 h-4 rounded-full ${avatarBg} flex items-center justify-center`}
                                    >
                                      <span className="text-[8px] font-bold text-white">
                                        {user[0]}
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold">
                                      {user}
                                    </p>
                                  </div>
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-widest ${catColor}`}
                                  >
                                    {cat}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {topic}
                                </p>
                                <div className="flex gap-1.5 mt-1.5">
                                  {reactions.map(([r, n]) => (
                                    <span
                                      key={`${user}-${r}`}
                                      className="text-[11px] bg-muted rounded-full px-2 py-0.5"
                                    >
                                      {r} {n}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="bg-background flex justify-center py-2">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Slide 1 — Never gets repetitive */}
                <div className="w-full shrink-0 flex flex-row-reverse items-center justify-center gap-16 py-16 px-16 overflow-hidden">
                  <div className="flex flex-col gap-3 max-w-sm flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary font-bold text-xs rounded-full px-3 py-1 uppercase tracking-widest w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      Fresh Daily
                    </span>
                    <h2 className="font-display font-extrabold text-5xl leading-tight tracking-tight">
                      Never gets repetitive
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Four fresh challenges drop every morning — a new color,
                      shape, theme, and object. The topics are always specific:
                      not just "something red", but "Goldenrod #CA8A04". No two
                      days look the same.
                    </p>
                  </div>
                  <div className="w-full max-w-[26rem] rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-foreground/5 flex justify-center py-2.5">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-background flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">Free Walk</p>
                          <p className="text-xs text-muted-foreground">
                            Pick a topic · Take a photo
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">Aug 13</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 p-4">
                        <div className="rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4 flex flex-col gap-2">
                          <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                            <svg
                              viewBox="0 0 32 32"
                              fill="none"
                              aria-hidden="true"
                              className="w-7 h-7 text-orange-500"
                            >
                              <circle
                                cx="16"
                                cy="16"
                                r="11"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                            Color
                          </p>
                          <p className="font-bold text-sm leading-tight">
                            Goldenrod #CA8A04
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-sky-50 dark:bg-sky-900/20 p-4 flex flex-col gap-2">
                          <div className="w-11 h-11 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
                            <svg
                              viewBox="0 0 32 32"
                              fill="none"
                              aria-hidden="true"
                              className="w-7 h-7 text-sky-500"
                            >
                              <polygon
                                points="16,3 30,27 2,27"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                            Shape
                          </p>
                          <p className="font-bold text-sm leading-tight">
                            Perfect Circle
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-violet-50 dark:bg-violet-900/20 p-4 flex flex-col gap-2">
                          <div className="w-11 h-11 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                            <svg
                              viewBox="0 0 32 32"
                              fill="none"
                              aria-hidden="true"
                              className="w-7 h-7 text-violet-500"
                            >
                              <path
                                d="M16 2L18.2 13.8L30 16L18.2 18.2L16 30L13.8 18.2L2 16L13.8 13.8Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                            Theme
                          </p>
                          <p className="font-bold text-sm leading-tight">
                            Morning Light
                          </p>
                        </div>
                        <div className="rounded-xl border border-border bg-emerald-50 dark:bg-emerald-900/20 p-4 flex flex-col gap-2">
                          <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <svg
                              viewBox="0 0 32 32"
                              fill="none"
                              aria-hidden="true"
                              className="w-7 h-7 text-emerald-500"
                            >
                              <path
                                d="M16 2C10.48 2 6 6.48 6 12C6 19.5 16 30 16 30C16 30 26 19.5 26 12C26 6.48 21.52 2 16 2Z"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                fill="currentColor"
                                fillOpacity="0.15"
                              />
                              <circle
                                cx="16"
                                cy="12"
                                r="3"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            Object
                          </p>
                          <p className="font-bold text-sm leading-tight">
                            Found Art
                          </p>
                        </div>
                      </div>
                      <p className="text-center text-xs text-muted-foreground pb-5">
                        🔁 Refreshes tomorrow at midnight
                      </p>
                    </div>
                    <div className="bg-background flex justify-center py-2">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Slide 2 — Explore places */}
                <div className="w-full shrink-0 flex flex-row items-center justify-center gap-16 py-16 px-16 overflow-hidden">
                  <div className="flex flex-col gap-3 max-w-sm flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-full px-3 py-1 uppercase tracking-widest w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Your Archive
                    </span>
                    <h2 className="font-display font-extrabold text-5xl leading-tight tracking-tight">
                      Discover streets you'd walk right past
                    </h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Every walk gets logged in your archive. Watch your streak
                      grow as the topics pull you down streets you'd normally
                      walk straight past.
                    </p>
                  </div>
                  <div className="w-full max-w-[26rem] rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-foreground/5 flex justify-center py-2.5">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-background flex flex-col">
                      <div className="px-5 pt-4 pb-3 border-b border-border/40">
                        <p className="font-bold text-sm">My Archive</p>
                        <p className="text-xs text-muted-foreground">
                          Your Free Walk history
                        </p>
                      </div>
                      <div className="px-5 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-sm">August 2026</p>
                          <p className="text-xs text-muted-foreground">
                            14 walks this month
                          </p>
                        </div>
                        <div className="grid grid-cols-7 mb-1">
                          {(
                            [
                              "Sun",
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                            ] as const
                          ).map((d) => (
                            <p
                              key={d}
                              className="text-center text-[10px] font-medium text-muted-foreground py-1"
                            >
                              {d.charAt(0)}
                            </p>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-0.5">
                          {(["b1", "b2", "b3", "b4", "b5", "b6"] as const).map(
                            (k) => (
                              <div key={k} />
                            ),
                          )}
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const walked = [
                              1, 2, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 18, 19,
                              20, 21, 22, 25, 26, 27, 28,
                            ].includes(day);
                            const isToday = day === 13;
                            const dotColors = [
                              "bg-orange-400",
                              "bg-sky-400",
                              "bg-violet-400",
                              "bg-emerald-400",
                              "bg-primary",
                            ];
                            const dot = dotColors[(day * 3) % dotColors.length];
                            return (
                              <div
                                key={`day-${day}`}
                                className={cn(
                                  "flex flex-col items-center py-0.5 rounded",
                                  isToday ? "bg-primary/10" : "",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-[11px] leading-tight",
                                    isToday
                                      ? "font-bold text-primary"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {day}
                                </p>
                                {walked && (
                                  <div
                                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dot}`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="px-5 pt-3 pb-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Recent Walks
                        </p>
                        {[
                          {
                            label: "Today",
                            topic: "Goldenrod #CA8A04",
                            cat: "Color",
                            dot: "bg-orange-400",
                          },
                          {
                            label: "Yesterday",
                            topic: "Perfect Circle",
                            cat: "Shape",
                            dot: "bg-sky-400",
                          },
                          {
                            label: "Aug 11",
                            topic: "Morning Light",
                            cat: "Theme",
                            dot: "bg-violet-400",
                          },
                        ].map(({ label, topic, cat, dot }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2.5 py-1.5 border-b border-border/40 last:border-0"
                          >
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${dot}`}
                            />
                            <p className="text-xs font-semibold flex-1 truncate">
                              {topic}
                            </p>
                            <p className="text-[10px] text-muted-foreground shrink-0">
                              {label} · {cat}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-background flex justify-center py-2">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav: arrows + dots inline */}
            <div className="flex items-center justify-center gap-4 pb-10">
              <button
                type="button"
                onClick={() => setFeatureSlide((s) => Math.max(0, s - 1))}
                disabled={featureSlide === 0}
                className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center shadow-sm transition-all duration-200 hover:border-foreground/30 hover:shadow-md disabled:opacity-25 disabled:cursor-not-allowed"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex gap-2">
                {([0, 1, 2] as const).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFeatureSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300",
                      featureSlide === i
                        ? "w-6 h-2 bg-foreground"
                        : "w-2 h-2 bg-foreground/25 hover:bg-foreground/50",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setFeatureSlide((s) => Math.min(2, s + 1))}
                disabled={featureSlide === 2}
                className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center shadow-sm transition-all duration-200 hover:border-foreground/30 hover:shadow-md disabled:opacity-25 disabled:cursor-not-allowed"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </AnimateOnScroll>
        </section>

        {/* ── Get Started CTA ──────────────────────────────── */}
        <section ref={formRef} className="px-5 pb-16 w-full">
          {/* invisible trail anchor */}
          <div
            ref={formMarkerRef}
            className="w-0 h-0 opacity-0 pointer-events-none"
          />
          <AnimateOnScroll>
            <div className="rounded-3xl bg-primary px-12 py-16 flex flex-col items-center text-center gap-8">
              <div className="flex flex-col items-center gap-3">
                <h2 className="font-display font-extrabold text-6xl leading-tight text-primary-foreground">
                  Get outside today!
                </h2>
                <p className="text-primary-foreground/75 text-lg max-w-md leading-relaxed">
                  Pick a topic, head out, take a photo. Free forever.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={() => router.push("/auth?tab=signup")}
                >
                  Sign Up Free
                </Button>
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={() => router.push("/auth")}
                >
                  Log In
                </Button>
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg text-primary-foreground/60 hover:text-primary-foreground bg-transparent hover:bg-primary-foreground/10 transition-all"
                  onClick={() => {
                    saveGuestIdentity();
                    router.push("/walk");
                  }}
                >
                  Try Free Walk →
                </Button>
              </div>
            </div>
          </AnimateOnScroll>
        </section>
      </div>
      {/* end sectionsWrapper */}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border/60 bg-muted/30">
        <div className="max-w-3xl mx-auto px-5 py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <Image
              src="/image-1786109910251.png"
              alt="TopicWalk"
              height={28}
              width={120}
              className="object-contain"
            />
            <p className="text-xs text-muted-foreground max-w-[200px] text-center md:text-left">
              Get a topic. Take a walk. Explore.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start gap-1.5 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              App
            </p>
            <Link
              href="/walk"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Free Walk
            </Link>
            <Link
              href="/auth"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/auth"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
          </div>

          <div className="flex flex-col items-center md:items-start gap-1.5 text-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Legal
            </p>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>

        <div className="border-t border-border/40 px-5 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TopicWalk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
