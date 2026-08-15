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
  "free-walk": [
    // Step 0 — Pick a topic: tap the Color card (top-left, ~130px from top)
    [
      { x: 52, y: 75, t: 0 },
      { x: 27, y: 29, t: 700 },
      { x: 27, y: 29, t: 1100, click: true },
      { x: 55, y: 55, t: 2100 },
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
      </div>
    </div>
  );
}

// ── Hero phone animations ─────────────────────────────────────────────

function HeroPhoneLeft() {
  const [phase, setPhase] = useState(0);
  const [cx, setCx] = useState(142);
  const [cy, setCy] = useState(420);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    let alive = true;
    const T: ReturnType<typeof setTimeout>[] = [];

    function clearAll() {
      T.forEach(clearTimeout);
      T.length = 0;
    }

    function sched(fn: () => void, ms: number) {
      T.push(setTimeout(fn, ms));
    }

    function runPhase(p: number) {
      if (!alive) return;
      clearAll();
      setPhase(p);
      setClicking(false);
      if (p === 0) {
        setCx(142);
        setCy(420);
        sched(() => {
          setCx(76);
          setCy(112);
        }, 600);
        sched(() => setClicking(true), 1250);
        sched(() => setClicking(false), 1650);
        sched(() => runPhase(1), 2200);
      } else if (p === 1) {
        setCx(230);
        setCy(60);
        sched(() => {
          setCx(142);
          setCy(355);
        }, 700);
        sched(() => setClicking(true), 1350);
        sched(() => setClicking(false), 1750);
        sched(() => runPhase(2), 2300);
      } else {
        setCx(50);
        setCy(100);
        sched(() => {
          setCx(142);
          setCy(390);
        }, 700);
        sched(() => setClicking(true), 1350);
        sched(() => setClicking(false), 1750);
        sched(() => runPhase(0), 2800);
      }
    }

    T.push(setTimeout(() => runPhase(0), 800));

    return () => {
      alive = false;
      T.forEach(clearTimeout);
    };
  }, []);

  const screens = [
    /* Phase 0 – topic picker */
    <div key="p0" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <p className="font-bold text-sm">Free Walk</p>
        <p className="text-xs text-muted-foreground">
          Pick a topic · Take a photo
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-4">
        <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-xl bg-amber-400/90 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-orange-600" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-orange-600">
            Color
          </p>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2 opacity-55">
          <div className="w-11 h-11 rounded-xl bg-sky-400/80 flex items-center justify-center">
            <div className="w-0 h-0 border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-sky-700" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-sky-600">
            Shape
          </p>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2 opacity-55">
          <div className="w-11 h-11 rounded-xl bg-violet-400/80 flex items-center justify-center">
            <span className="text-violet-900 font-black text-xl leading-none">
              +
            </span>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-violet-600">
            Theme
          </p>
        </div>
        <div className="rounded-xl border border-border p-4 flex flex-col items-center gap-2 opacity-55">
          <div className="w-11 h-11 rounded-xl bg-emerald-400/80 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-emerald-800" />
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">
            Object
          </p>
        </div>
      </div>
      <div className="mx-4 rounded-xl bg-muted/40 p-3 text-center">
        <p className="text-[11px] text-muted-foreground">
          Tap a category to begin
        </p>
      </div>
    </div>,
    /* Phase 1 – color selected + camera */
    <div key="p1" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <p className="font-bold text-sm">Free Walk</p>
        <p className="text-xs text-muted-foreground">
          Pick a topic · Take a photo
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-2 opacity-50">
        <div className="rounded-xl border-2 border-primary p-2 flex items-center gap-2 bg-primary/5">
          <div className="w-7 h-7 rounded-lg bg-amber-400 shrink-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-orange-600" />
          </div>
          <p className="text-[10px] font-bold text-orange-600">Color</p>
        </div>
        {(["Shape", "Theme", "Object"] as const).map((l) => (
          <div
            key={l}
            className="rounded-xl border border-border p-2 flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-muted shrink-0" />
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="mx-4 mt-2 rounded-xl bg-card border border-border shadow-sm p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
          <div className="w-4 h-4 rounded-full bg-orange-600" />
        </div>
        <div>
          <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest">
            Color · Today
          </p>
          <p className="font-bold text-sm leading-tight">Goldenrod #CA8A04</p>
        </div>
      </div>
      <p className="text-[10px] text-center text-muted-foreground mt-2 px-4">
        🔒 Today's pick — resets at midnight
      </p>
      <div className="px-4 mt-3">
        <div className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2">
          <Camera className="h-4 w-4" />
          Take / Upload Photo
        </div>
      </div>
    </div>,
    /* Phase 2 – AI result */
    <div key="p2" className="flex flex-col h-full">
      <div className="relative h-36 bg-amber-100 dark:bg-amber-900/25 flex items-center justify-center overflow-hidden shrink-0">
        <Camera className="h-16 w-16 text-amber-300" />
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
          Color · Goldenrod
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 pt-4 pb-3 shrink-0">
        <div className="text-5xl font-extrabold text-primary leading-none">
          87
        </div>
        <p className="text-xs text-muted-foreground font-medium">out of 100</p>
      </div>
      <div className="mx-4 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-3">
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
          ✓ Confident match!
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          The warm amber hue clearly matches Goldenrod. Great find!
        </p>
      </div>
      <div className="px-4 mt-3">
        <div className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
          Share to feed →
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="bg-secondary rounded-[2.5rem] p-[8px] shadow-xl w-[300px]">
      <div
        className="relative bg-background rounded-[2rem] overflow-hidden"
        style={{ height: "530px" }}
      >
        <div className="bg-foreground/5 flex justify-center py-3">
          <div className="w-20 h-1.5 bg-foreground/20 rounded-full" />
        </div>
        <div className="relative overflow-hidden" style={{ height: "458px" }}>
          {screens[phase]}
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: cx,
              top: cy,
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
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full" />
      </div>
    </div>
  );
}

const HUNT_TILES_FAR = [
  { k: "f0", r: false },
  { k: "f1", r: false },
  { k: "f2", r: true },
  { k: "f3", r: false },
  { k: "f4", r: false },
  { k: "f5", r: true },
  { k: "f6", r: true },
  { k: "f7", r: false },
  { k: "f8", r: false },
];
const HUNT_TILES_NEAR = [
  { k: "n0", r: true },
  { k: "n1", r: true },
  { k: "n2", r: true },
  { k: "n3", r: true },
  { k: "n4", r: true },
  { k: "n5", r: true },
  { k: "n6", r: true },
  { k: "n7", r: false },
  { k: "n8", r: true },
];

function HeroPhoneRight() {
  const [phase, setPhase] = useState(0);
  const [cx, setCx] = useState(200);
  const [cy, setCy] = useState(380);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    let alive = true;
    const T: ReturnType<typeof setTimeout>[] = [];

    function clearAll() {
      T.forEach(clearTimeout);
      T.length = 0;
    }

    function sched(fn: () => void, ms: number) {
      T.push(setTimeout(fn, ms));
    }

    function runPhase(p: number) {
      if (!alive) return;
      clearAll();
      setPhase(p);
      setClicking(false);
      if (p === 0) {
        setCx(200);
        setCy(380);
        sched(() => {
          setCx(58);
          setCy(110);
        }, 600);
        sched(() => {
          setCx(226);
          setCy(194);
        }, 1700);
        sched(() => {
          setCx(58);
          setCy(278);
        }, 2700);
        sched(() => runPhase(1), 3900);
      } else {
        setCx(60);
        setCy(140);
        sched(() => {
          setCx(142);
          setCy(355);
        }, 700);
        sched(() => setClicking(true), 1350);
        sched(() => setClicking(false), 1750);
        sched(() => runPhase(0), 2800);
      }
    }

    T.push(setTimeout(() => runPhase(0), 1200));

    return () => {
      alive = false;
      T.forEach(clearTimeout);
    };
  }, []);

  const screens = [
    /* Phase 0 – hunting */
    <div key="h0" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <p className="font-bold text-sm">Sean's mascot</p>
        <p className="text-xs text-secondary font-semibold">📍 280m away</p>
      </div>
      <div className="px-4 pt-3">
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-950/30">
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <Camera className="h-14 w-14 text-amber-700" />
          </div>
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {HUNT_TILES_FAR.map(({ k, r }) => (
              <div
                key={k}
                className={cn(
                  "border border-background/20",
                  r ? "bg-transparent" : "bg-gray-800/80",
                )}
              />
            ))}
          </div>
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            2 / 9
          </div>
        </div>
      </div>
      <div className="mx-4 mt-3 rounded-xl bg-muted/50 p-3">
        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest mb-0.5">
          Clue #2
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          "There's outdoor seating nearby and open sky above."
        </p>
      </div>
    </div>,
    /* Phase 1 – in range, capture */
    <div key="h1" className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 border-b border-border/40">
        <p className="font-bold text-sm">Sean's mascot</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
          📍 18m — in range!
        </p>
      </div>
      <div className="px-4 pt-3">
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-950/30">
          <div className="absolute inset-0 flex items-center justify-center opacity-45">
            <Camera className="h-14 w-14 text-amber-700" />
          </div>
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {HUNT_TILES_NEAR.map(({ k, r }) => (
              <div
                key={k}
                className={cn(
                  "border border-background/20",
                  r ? "bg-transparent" : "bg-gray-800/80",
                )}
              />
            ))}
          </div>
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            8 / 9
          </div>
        </div>
      </div>
      <div className="px-4 mt-3">
        <div className="w-full h-11 rounded-xl bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center gap-2 shadow-md">
          🎯 Capture!
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="bg-secondary rounded-[2.5rem] p-[8px] shadow-xl w-[300px]">
      <div
        className="relative bg-background rounded-[2rem] overflow-hidden"
        style={{ height: "530px" }}
      >
        <div className="bg-foreground/5 flex justify-center py-3">
          <div className="w-20 h-1.5 bg-foreground/20 rounded-full" />
        </div>
        <div className="relative overflow-hidden" style={{ height: "458px" }}>
          {screens[phase]}
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: cx,
              top: cy,
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
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full" />
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
  const [visitedSections, setVisitedSections] = useState<Set<number>>(
    new Set(),
  );
  const [selectedStep, setSelectedStep] = useState(0);
  const [featureSlide, setFeatureSlide] = useState(0);
  const [howItWorksMode, setHowItWorksMode] = useState<
    "free-walk" | "mascot-hunt"
  >("free-walk");

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity();
    if (id && !id.isGuest) router.replace("/home");
  }, []);

  useEffect(() => {
    const markers = [
      [whyMarkerRef, 0],
      [modesMarkerRef, 1],
      [formMarkerRef, 2],
    ] as const;
    const observers = markers.map(([ref, idx]) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting)
            setVisitedSections((prev) => new Set([...prev, idx]));
        },
        { rootMargin: "0px 0px -25% 0px", threshold: 0.5 },
      );
      if (ref.current) observer.observe(ref.current);
      return observer;
    });
    return () =>
      observers.forEach((o) => {
        o.disconnect();
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatureSlide((s) => (s + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-dvh">
      {/* ── Background trail (removed — replaced by section path) ── */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden hidden"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Trail 1 — upper sweep */}
          <path
            d="M-20,190 Q120,110 270,170 Q420,230 560,145 Q700,60 840,125 Q980,190 1120,115 Q1260,40 1460,85"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="2.5"
            strokeDasharray="10 7"
            opacity="0.55"
          />
          {/* Trail 2 — mid sweep */}
          <path
            d="M-20,460 Q110,385 250,440 Q400,495 530,410 Q660,325 800,385 Q940,445 1090,375 Q1230,305 1460,350"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="2.0"
            strokeDasharray="10 7"
            opacity="0.40"
          />
          {/* Trail 3 — lower sweep, teal */}
          <path
            d="M-20,710 Q160,640 310,690 Q460,740 600,665 Q740,590 880,645 Q1020,700 1160,630 Q1300,560 1460,605"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
            strokeDasharray="8 6"
            opacity="0.32"
          />

          {/* ── Trail 1 waypoint icons ── */}
          {/* camera at 270,170 */}
          <g
            transform="translate(261,161)"
            opacity="0.60"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#FFBE59" stroke="none" />
          </g>
          {/* pin at 560,145 */}
          <g
            transform="translate(552,133)"
            opacity="0.60"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
          {/* camera at 840,125 */}
          <g
            transform="translate(831,116)"
            opacity="0.50"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#FFBE59" stroke="none" />
          </g>
          {/* pin at 1120,115 */}
          <g
            transform="translate(1112,103)"
            opacity="0.45"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
          {/* camera at 1380,85 */}
          <g
            transform="translate(1371,76)"
            opacity="0.40"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#FFBE59" stroke="none" />
          </g>

          {/* ── Trail 2 waypoint icons ── */}
          {/* pin at 250,440 */}
          <g
            transform="translate(242,428)"
            opacity="0.45"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
          {/* camera at 530,410 */}
          <g
            transform="translate(521,401)"
            opacity="0.40"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#5ba4cf" stroke="none" />
          </g>
          {/* pin at 800,385 */}
          <g
            transform="translate(792,373)"
            opacity="0.38"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
          {/* camera at 1090,375 */}
          <g
            transform="translate(1081,366)"
            opacity="0.36"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#5ba4cf" stroke="none" />
          </g>

          {/* ── Trail 3 waypoint icons ── */}
          {/* camera at 310,690 */}
          <g
            transform="translate(301,681)"
            opacity="0.35"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#5ba4cf" stroke="none" />
          </g>
          {/* pin at 600,665 */}
          <g
            transform="translate(592,653)"
            opacity="0.33"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
          {/* camera at 880,645 */}
          <g
            transform="translate(871,636)"
            opacity="0.30"
            fill="none"
            stroke="#FFBE59"
            strokeWidth="1.8"
          >
            <rect x="0" y="4" width="18" height="13" rx="2.5" />
            <circle cx="9" cy="10.5" r="3.5" />
            <circle cx="9" cy="10.5" r="1.5" />
            <rect x="4" y="0" width="7" height="5" rx="1" />
            <circle cx="15.5" cy="6" r="1" fill="#FFBE59" stroke="none" />
          </g>
          {/* pin at 1160,630 */}
          <g
            transform="translate(1152,618)"
            opacity="0.28"
            fill="none"
            stroke="#5ba4cf"
            strokeWidth="1.8"
          >
            <path d="M8,0 C8,0 16,8 16,12 C16,16.4 12.4,20 8,20 C3.6,20 0,16.4 0,12 C0,8 8,0 8,0Z" />
            <circle cx="8" cy="12" r="2.5" />
          </g>
        </svg>
      </div>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center justify-center min-h-[calc(100dvh-4rem)] py-16 px-16 gap-20 border-b border-border/60">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, #FFD44A 0%, #FFC730 45%, #FFB018 80%, #F0A010 100%)",
          }}
        />
        {/* Left phone mockup */}
        <div className="relative shrink-0 animate-fade-in-up animation-delay-300">
          <HeroPhoneLeft />
        </div>

        <div className="shrink-0 flex flex-col items-center text-center gap-6 animate-fade-in-up animation-delay-100">
          <div className="space-y-5">
            <h1 className="font-display text-[5.75rem] font-extrabold leading-[1.15] tracking-tight">
              <span className="block">Get a topic.</span>
              <span className="block">Take a walk.</span>
              <span className="block">
                <span className="relative inline-block pb-3">
                  Explore.
                  <svg
                    className="absolute bottom-0 left-0 w-full overflow-visible"
                    height="10"
                    viewBox="0 0 200 10"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0,5 C4.5,0 8,0 12.5,5 C17,10 20.5,10 25,5 C29.5,0 33,0 37.5,5 C42,10 45.5,10 50,5 C54.5,0 58,0 62.5,5 C67,10 70.5,10 75,5 C79.5,0 83,0 87.5,5 C92,10 95.5,10 100,5 C104.5,0 108,0 112.5,5 C117,10 120.5,10 125,5 C129.5,0 133,0 137.5,5 C142,10 145.5,10 150,5 C154.5,0 158,0 162.5,5 C167,10 170.5,10 175,5 C179.5,0 183,0 187.5,5 C192,10 195.5,10 200,5"
                      fill="none"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="stroke-secondary"
                    />
                  </svg>
                </span>
              </span>
            </h1>
            <p className="text-xl leading-relaxed text-foreground/80">
              Go outside, capture what you find, and share it with your friends.
              <br />
              Your neighborhood has more to offer than you think.
            </p>
          </div>
          <div className="flex flex-row gap-6 animate-fade-in-up animation-delay-200">
            <Button
              size="lg"
              className="h-16 w-60 text-xl font-medium !bg-transparent !border-2 !border-gray-950 !text-foreground hover:!border-secondary hover:!text-secondary hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl"
              onClick={() =>
                formRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
            </Button>
            <Button
              size="lg"
              className="h-16 w-60 text-xl font-medium !bg-transparent !border-2 !border-gray-950 !text-foreground hover:!border-secondary hover:!text-secondary hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl"
              onClick={() => {
                saveGuestIdentity();
                router.push("/walk");
              }}
            >
              Try Free Walk →
            </Button>
          </div>
        </div>

        {/* Right phone mockup */}
        <div className="relative shrink-0 animate-fade-in-up animation-delay-300">
          <HeroPhoneRight />
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
        <section className="py-20 w-[min(100vw,76rem)] relative left-1/2 -translate-x-1/2 px-16">
          <AnimateOnScroll className="mb-12">
            <div className="flex items-center gap-3">
              <div
                ref={whyMarkerRef}
                className={cn(
                  "shrink-0 rounded-full border overflow-hidden flex items-center justify-center transition-all duration-500 bg-background",
                  visitedSections.has(0)
                    ? "w-10 h-10 border-primary/50 shadow-sm"
                    : "w-7 h-7 border-border bg-muted",
                )}
              >
                {visitedSections.has(0) ? (
                  <Image
                    src="/mascot-new.png"
                    alt="TopicWalk mascot"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <h2 className="font-bold text-xl whitespace-nowrap">
                How it works
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
          </AnimateOnScroll>

          {/* ── Modes callout ────────────────────────────────── */}
          <AnimateOnScroll className="px-5 pt-4 pb-10 w-full">
            <div className="flex items-center gap-3 mb-8">
              <div
                ref={modesMarkerRef}
                className={cn(
                  "shrink-0 rounded-full border overflow-hidden flex items-center justify-center transition-all duration-500 bg-background",
                  visitedSections.has(1)
                    ? "w-10 h-10 border-primary/50 shadow-sm"
                    : "w-7 h-7 border-border bg-muted",
                )}
              >
                {visitedSections.has(1) ? (
                  <Image
                    src="/mascot-new.png"
                    alt="TopicWalk mascot"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                    unoptimized
                  />
                ) : (
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2">
                <span className="h-px w-6 bg-primary/40" />
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Two Modes
                </p>
                <span className="h-px w-6 bg-primary/40" />
              </div>
              <p className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
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
                screen: (
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
                    <div className="mx-4 mb-4 rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        Tap a category to see today's challenge
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
                    <div className="px-4 mt-3 mb-4">
                      <div className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
                        Share to feed →
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "4.",
                title: "Everyone sees your find",
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
                      <p className="font-bold text-sm">Sean's mascot</p>
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
                        <p className="font-semibold text-xs">Sean's mascot</p>
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

            const renderInstance = (
              steps: typeof FREE_WALK_STEPS,
              step: number,
              setStep: (i: number) => void,
              mirrored: boolean,
            ) => {
              const active = steps[step];

              const stepList = (
                <AnimateOnScroll
                  className="shrink-0 flex flex-col"
                  variant="scale-in"
                >
                  {steps.map(({ num, title }, i) => {
                    const isActive = i === step;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setStep(i)}
                        className={cn(
                          "py-6 text-left transition-all duration-200",
                          mirrored
                            ? cn(
                                "pr-5 pl-10 border-r-2",
                                isActive
                                  ? "border-r-primary"
                                  : "border-r-border hover:border-r-primary/40",
                              )
                            : cn(
                                "pl-5 pr-10 border-l-2",
                                isActive
                                  ? "border-l-primary"
                                  : "border-l-border hover:border-l-primary/40",
                              ),
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-bold uppercase tracking-widest transition-colors duration-200",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {num.replace(".", "")}
                        </p>
                        <p
                          className={cn(
                            "text-base font-semibold transition-all duration-200 mt-1",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {title}
                        </p>
                      </button>
                    );
                  })}
                </AnimateOnScroll>
              );

              const frame = (
                <AnimateOnScroll
                  className="shrink-0"
                  variant="scale-in"
                  delay={80}
                >
                  <div
                    className="w-80 rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col"
                    style={{ minHeight: "32rem" }}
                  >
                    <div className="bg-foreground/5 flex justify-center py-2 shrink-0">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 relative">
                      {active.screen}
                      <PhoneCursor stepIndex={step} mode={howItWorksMode} />
                    </div>
                    <div className="bg-background flex justify-center py-2 shrink-0">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                </AnimateOnScroll>
              );

              const text = (
                <div className="flex-1 flex flex-col gap-6">
                  <p className="font-display text-[7rem] font-extrabold text-primary leading-none">
                    {active.num}
                  </p>
                  <p className="font-bold text-5xl leading-snug">
                    {active.title}
                  </p>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {active.description}
                  </p>
                </div>
              );

              return (
                <div className="flex items-center gap-12">
                  {mirrored ? (
                    <>
                      {text}
                      {frame}
                      {stepList}
                    </>
                  ) : (
                    <>
                      {stepList}
                      {frame}
                      {text}
                    </>
                  )}
                </div>
              );
            };

            return (
              <div className="flex flex-col gap-10">
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
                        "rounded-xl px-6 py-2.5 text-sm font-bold transition-all duration-200",
                        howItWorksMode === key
                          ? "bg-foreground text-background hover:scale-[1.04] hover:shadow-lg"
                          : "border border-border/50 text-foreground/40 hover:border-foreground/40 hover:text-foreground/70 hover:-translate-y-0.5 hover:shadow-sm",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {renderInstance(
                  howItWorksMode === "free-walk" ? FREE_WALK_STEPS : HUNT_STEPS,
                  selectedStep,
                  setSelectedStep,
                  false,
                )}
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
                <div className="w-full shrink-0 flex flex-col items-center gap-8 py-12 px-8 overflow-hidden">
                  <div className="flex flex-col items-center gap-3 text-center max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl font-extrabold text-primary leading-none">
                        01
                      </span>
                      <span className="h-px w-6 bg-border" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Share
                      </span>
                    </div>
                    <h2 className="font-bold text-5xl leading-tight tracking-tight">
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
                            photoBg:
                              "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
                            iconBg: "bg-orange-100 dark:bg-orange-900/40",
                            catColor: "text-orange-500 dark:text-orange-400",
                            reactions: [
                              ["❤️", "3"],
                              ["🔥", "1"],
                            ],
                          },
                          {
                            user: "Jordan",
                            topic: "Perfect Circle",
                            cat: "Shape",
                            photoBg:
                              "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800",
                            iconBg: "bg-sky-100 dark:bg-sky-900/40",
                            catColor: "text-sky-500 dark:text-sky-400",
                            reactions: [
                              ["😮", "2"],
                              ["❤️", "1"],
                            ],
                          },
                          {
                            user: "Sam",
                            topic: "Morning Light",
                            cat: "Theme",
                            photoBg:
                              "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800",
                            iconBg: "bg-violet-100 dark:bg-violet-900/40",
                            catColor: "text-violet-500 dark:text-violet-400",
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
                            photoBg,
                            iconBg,
                            catColor,
                            reactions,
                          }) => (
                            <div
                              key={user}
                              className={`rounded-xl border overflow-hidden ${photoBg}`}
                            >
                              <div
                                className={`h-20 flex items-center justify-center ${iconBg}`}
                              >
                                <Camera
                                  className={`h-8 w-8 opacity-40 ${catColor}`}
                                />
                              </div>
                              <div className="px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold">
                                    {user}
                                  </p>
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-widest ${catColor}`}
                                  >
                                    {cat}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {topic}
                                </p>
                                <div className="flex gap-1.5 mt-1.5">
                                  {reactions.map(([r, n]) => (
                                    <span
                                      key={`${user}-${r}`}
                                      className="text-[11px] bg-background/80 rounded-full px-2 py-0.5 border border-border/50"
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
                <div className="w-full shrink-0 flex flex-col items-center gap-8 py-12 px-8 overflow-hidden">
                  <div className="flex flex-col items-center gap-3 text-center max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl font-extrabold text-primary leading-none">
                        02
                      </span>
                      <span className="h-px w-6 bg-border" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Fresh Daily
                      </span>
                    </div>
                    <h2 className="font-bold text-5xl leading-tight tracking-tight">
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
                <div className="w-full shrink-0 flex flex-col items-center gap-8 py-12 px-8 overflow-hidden">
                  <div className="flex flex-col items-center gap-3 text-center max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-display text-4xl font-extrabold text-primary leading-none">
                        03
                      </span>
                      <span className="h-px w-6 bg-border" />
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                        Discover
                      </span>
                    </div>
                    <h2 className="font-bold text-5xl leading-tight tracking-tight">
                      Explore places you've never gone to
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
            <div className="rounded-3xl bg-primary/10 border-2 border-primary/60 px-12 py-16 flex flex-col items-center text-center gap-10">
              <h2 className="font-bold text-5xl leading-tight">
                Ready to start walking?
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg font-semibold shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={() => router.push("/auth?tab=signup")}
                >
                  Sign Up
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-lg hover:-translate-y-px active:translate-y-0 transition-all"
                  onClick={() => router.push("/auth")}
                >
                  Log In
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-14 px-8 text-lg text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => {
                    saveGuestIdentity();
                    router.push("/walk");
                  }}
                >
                  Try Free Walk →
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">
                No account needed to try Free Walk
              </p>
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
