"use client";

import {
  Camera,
  ChevronDown,
  Compass,
  Crosshair,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimateOnScroll } from "~/components/animate-on-scroll";
import { Button } from "~/components/ui/button";
import { getIdentity, saveGuestIdentity } from "~/lib/identity";
import { cn } from "~/lib/utils";

export default function LandingPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const whyMarkerRef = useRef<HTMLDivElement>(null);
  const modesMarkerRef = useRef<HTMLDivElement>(null);
  const formMarkerRef = useRef<HTMLDivElement>(null);
  const sectionsWrapperRef = useRef<HTMLDivElement>(null);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(
    new Set(),
  );
  const [trailPath, setTrailPath] = useState("");
  const [selectedStep, setSelectedStep] = useState(0);

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
    const calcPath = () => {
      const wrapper = sectionsWrapperRef.current;
      const els = [
        whyMarkerRef.current,
        modesMarkerRef.current,
        formMarkerRef.current,
      ];
      if (!wrapper || els.some((e) => !e)) return;
      const wRect = wrapper.getBoundingClientRect();
      const pts = els.map((el) => {
        const r = (el as HTMLDivElement).getBoundingClientRect();
        return {
          x: r.left - wRect.left + r.width / 2,
          y: r.top - wRect.top + r.height / 2,
        };
      });
      const [p1, p2, p3] = pts;
      const off = 40;
      setTrailPath(
        `M ${p1.x},${p1.y} ` +
          `C ${p1.x + off},${(p1.y + p2.y) / 2} ${p2.x - off},${(p1.y + p2.y) / 2} ${p2.x},${p2.y} ` +
          `C ${p2.x + off},${(p2.y + p3.y) / 2} ${p3.x - off},${(p2.y + p3.y) / 2} ${p3.x},${p3.y}`,
      );
    };
    const timer = setTimeout(calcPath, 50);
    const ro = new ResizeObserver(calcPath);
    if (sectionsWrapperRef.current) ro.observe(sectionsWrapperRef.current);
    return () => {
      clearTimeout(timer);
      ro.disconnect();
    };
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
          <div className="bg-gray-950 rounded-[2.5rem] p-[8px] shadow-xl w-[300px]">
            <div
              className="relative bg-background rounded-[2rem] overflow-hidden"
              style={{ height: "530px" }}
            >
              {/* App header */}
              <div className="flex items-center px-4 py-2.5 border-b border-border">
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    Free Walk
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Pick a topic · Take a photo
                  </p>
                </div>
              </div>
              {/* Topic section label */}
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-4 mt-3 mb-2">
                Today's Topics
              </p>
              {/* Topic grid */}
              <div className="grid grid-cols-2 gap-2.5 px-4">
                <div className="rounded-xl border-2 border-primary bg-primary/8 p-3">
                  <span className="text-[9px] font-semibold rounded-full px-2 py-0.5 bg-orange-100 text-orange-700">
                    Color
                  </span>
                  <p className="mt-2 font-semibold text-xs text-foreground leading-tight">
                    Something Red
                  </p>
                </div>
                <div className="rounded-xl border-2 border-border p-3">
                  <span className="text-[9px] font-semibold rounded-full px-2 py-0.5 bg-sky-100 text-sky-700">
                    Shape
                  </span>
                  <p className="mt-2 font-semibold text-xs text-foreground leading-tight">
                    Perfect Circle
                  </p>
                </div>
                <div className="rounded-xl border-2 border-border p-3">
                  <span className="text-[9px] font-semibold rounded-full px-2 py-0.5 bg-violet-100 text-violet-700">
                    Theme
                  </span>
                  <p className="mt-2 font-semibold text-xs text-foreground leading-tight">
                    Morning Light
                  </p>
                </div>
                <div className="rounded-xl border-2 border-border p-3">
                  <span className="text-[9px] font-semibold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">
                    Object
                  </span>
                  <p className="mt-2 font-semibold text-xs text-foreground leading-tight">
                    Found Art
                  </p>
                </div>
              </div>
              {/* Photo submit panel */}
              <div className="mx-4 mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3 space-y-2">
                <p className="text-[10px] text-foreground">
                  Topic:{" "}
                  <span className="font-semibold text-primary">
                    Something Red
                  </span>
                </p>
                <button
                  type="button"
                  className="w-full h-8 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center gap-1.5"
                >
                  <svg
                    aria-hidden="true"
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Take / Upload Photo
                </button>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full" />
            </div>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center text-center gap-6 animate-fade-in-up animation-delay-100">
          <div className="space-y-5">
            <h1 className="font-display text-[5.75rem] font-extrabold leading-[1.15] tracking-tight">
              <span className="block">Get a topic.</span>
              <span className="block">Take a walk.</span>
              <span className="block underline decoration-wavy decoration-primary decoration-4 underline-offset-[6px]">
                Explore.
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
          <div className="bg-gray-950 rounded-[2.5rem] p-[8px] shadow-xl w-[300px]">
            <div
              className="relative bg-background rounded-[2rem] overflow-hidden"
              style={{ height: "530px" }}
            >
              {/* App header */}
              <div className="flex items-center px-4 py-2.5 border-b border-border">
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground leading-tight">
                    Hide &amp; Seek
                  </p>
                  <p className="text-[10px] text-primary leading-tight">
                    📍 GPS active
                  </p>
                </div>
              </div>
              {/* Tabs */}
              <div className="flex mx-4 mt-3 rounded-lg bg-muted p-0.5">
                <div className="flex-1 rounded-md py-1.5 text-center text-[10px] font-semibold bg-background shadow-sm">
                  🎯 Seek
                </div>
                <div className="flex-1 rounded-md py-1.5 text-center text-[10px] font-medium text-muted-foreground">
                  🏆 Leaderboard
                </div>
              </div>
              {/* Section label */}
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-4 mt-3 mb-2">
                Active Mascots (1)
              </p>
              {/* Mascot card */}
              <div className="mx-4 rounded-xl border-2 border-primary ring-1 ring-primary/30 overflow-hidden">
                <div className="relative">
                  <Image
                    src="/ny mascot.png"
                    alt="TopicWalk mascot in front of the Statue of Liberty"
                    width={1536}
                    height={1024}
                    unoptimized
                    className="w-full"
                    priority
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                    <span>📍</span>
                    <span>38m away</span>
                  </div>
                </div>
                <div className="p-2.5 bg-background space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-semibold text-xs text-foreground">
                        Sean's mascot
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        1m 47s ago
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-xs">38m</p>
                      <p className="text-sm leading-none">↗</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full h-7 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold"
                  >
                    🎯 Capture!
                  </button>
                </div>
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full" />
            </div>
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

      {/* ── Sections with connecting trail ───────────────── */}
      <div
        ref={sectionsWrapperRef}
        className="relative max-w-5xl mx-auto w-full isolate"
      >
        {/* Trail SVG — winding path between section waypoints */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none -z-10"
          aria-hidden="true"
        >
          {trailPath && (
            <path
              d={trailPath}
              fill="none"
              stroke="#FFBE59"
              strokeWidth="2.5"
              strokeDasharray="10 7"
              strokeLinecap="round"
              opacity="0.55"
            />
          )}
        </svg>

        {/* ── Modes callout ────────────────────────────────── */}
        <AnimateOnScroll className="px-5 pt-4 pb-10 w-full">
          <div className="flex items-center gap-3 mb-4">
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
          <p className="text-3xl font-extrabold tracking-tight">
            2 modes - Endless reasons to go outside
          </p>
        </AnimateOnScroll>

        {/* ── Modes phones ─────────────────────────────────── */}
        <section className="px-5 pb-20 w-full">
          <AnimateOnScroll>
            <div className="relative rounded-3xl border border-border shadow-lg overflow-hidden bg-muted/20 py-14 px-6">
              {/* dot grid */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, oklch(0 0 0 / 0.05) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              <div className="relative z-10 flex items-end justify-center gap-4 md:gap-10">
                {/* Free Walk phone */}
                <div
                  className="flex flex-col items-center gap-4"
                  style={{
                    transform:
                      "perspective(600px) rotateY(10deg) rotateZ(-2deg)",
                  }}
                >
                  <div className="w-36 md:w-48 rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-foreground/5 flex justify-center py-2.5">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-primary/[0.07] p-3 md:p-4 flex flex-col gap-2.5 min-h-[260px] md:min-h-[320px]">
                      <div className="bg-card rounded-xl p-2.5 border border-border/60 shadow-sm">
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium">
                          Today's Topic
                        </p>
                        <p className="text-xs md:text-sm font-bold mt-0.5">
                          🔴 Red Things
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 flex-1">
                        <div className="bg-primary/20 rounded-xl flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-primary/10 rounded-xl" />
                        <div className="bg-primary/10 rounded-xl" />
                        <div className="bg-primary/20 rounded-xl flex items-center justify-center">
                          <Compass className="h-4 w-4 text-primary/60" />
                        </div>
                      </div>
                      <div className="flex justify-center mt-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Camera className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-background flex justify-center py-2">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-sm">Free Walk</p>
                    <p className="text-xs text-muted-foreground">
                      Solo or group
                    </p>
                  </div>
                </div>

                {/* VS badge */}
                <div className="shrink-0 mb-20 bg-card border-2 border-border rounded-full w-10 h-10 text-[11px] font-extrabold flex items-center justify-center shadow-md text-muted-foreground">
                  VS
                </div>

                {/* Hide & Seek phone */}
                <div
                  className="flex flex-col items-center gap-4"
                  style={{
                    transform:
                      "perspective(600px) rotateY(-10deg) rotateZ(2deg)",
                  }}
                >
                  <div className="w-36 md:w-48 rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                    <div className="bg-foreground/5 flex justify-center py-2.5">
                      <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                    </div>
                    <div className="flex-1 bg-secondary/[0.07] p-3 md:p-4 flex flex-col gap-2.5 min-h-[260px] md:min-h-[320px]">
                      <div className="bg-secondary/20 rounded-xl p-2.5 border border-secondary/30">
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-medium">
                          Clue dropped!
                        </p>
                        <p className="text-xs md:text-sm font-bold mt-0.5 text-secondary">
                          Find them →
                        </p>
                      </div>
                      <div className="flex-1 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <Crosshair className="h-8 w-8 md:h-10 md:w-10 text-secondary/40" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                          <Users className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <div className="flex-1 h-8 bg-secondary rounded-lg flex items-center justify-center shadow-sm">
                          <Search className="h-3.5 w-3.5 text-secondary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="bg-background flex justify-center py-2">
                      <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-extrabold text-sm">Hide & Seek</p>
                    <p className="text-xs text-muted-foreground">Multiplayer</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </section>

        {/* ── Why ──────────────────────────────────────────── */}
        <section className="px-4 py-20 w-full">
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

          {(() => {
            const HOW_STEPS = [
              {
                num: "1.",
                title: "Pick a mode",
                description:
                  "Four fresh challenges drop every morning — a color, shape, theme, and object. Pick whichever one calls to you and head out.",
                icon: Crosshair,
                bg: "bg-sky-100 dark:bg-sky-900/30",
                iconColor: "text-sky-500 dark:text-sky-400",
              },
              {
                num: "2.",
                title: "Head outside & shoot",
                description:
                  "Open Free Walk, select your topic, and start exploring. When you spot something that fits, snap a photo right from the app.",
                icon: Camera,
                bg: "bg-orange-100 dark:bg-orange-900/30",
                iconColor: "text-orange-500 dark:text-orange-400",
              },
              {
                num: "3.",
                title: "Share to your feed",
                description:
                  "Your photo lands in a shared feed with your group. React to what friends found, compare perspectives, and see the neighbourhood through different eyes.",
                icon: Users,
                bg: "bg-violet-100 dark:bg-violet-900/30",
                iconColor: "text-violet-500 dark:text-violet-400",
              },
              {
                num: "4.",
                title: "Play Hide & Seek",
                description:
                  "Drop your mascot anywhere on the map. Friends get a GPS ping and a photo clue — first one to find it wins the round.",
                icon: MapPin,
                bg: "bg-emerald-100 dark:bg-emerald-900/30",
                iconColor: "text-emerald-500 dark:text-emerald-400",
              },
            ];
            const active = HOW_STEPS[selectedStep];
            const ActiveIcon = active.icon;
            return (
              <div className="flex items-center gap-16">
                {/* Left: compact step list */}
                <AnimateOnScroll
                  className="shrink-0 flex flex-col"
                  variant="scale-in"
                >
                  {HOW_STEPS.map(({ num, title }, i) => {
                    const isActive = i === selectedStep;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedStep(i)}
                        className={cn(
                          "py-6 pl-5 pr-10 text-left border-l-2 transition-all duration-200",
                          isActive
                            ? "border-l-primary"
                            : "border-l-border hover:border-l-primary/40",
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

                {/* Middle: step illustration */}
                <AnimateOnScroll
                  className="shrink-0"
                  variant="scale-in"
                  delay={80}
                >
                  <div
                    className={cn(
                      "w-96 h-[32rem] rounded-3xl flex items-center justify-center transition-colors duration-300",
                      active.bg,
                    )}
                  >
                    <ActiveIcon
                      className={cn(
                        "h-36 w-36 transition-colors duration-300",
                        active.iconColor,
                      )}
                    />
                  </div>
                </AnimateOnScroll>

                {/* Right: reactive text */}
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
              </div>
            );
          })()}
        </section>

        {/* ── Easily shareable ─────────────────────────────── */}
        <section className="py-16 border-t border-border/60 w-[min(100vw,76rem)] relative left-1/2 -translate-x-1/2 px-16">
          <div className="flex items-center justify-between gap-16">
            <AnimateOnScroll
              className="flex flex-col gap-4 max-w-2xl shrink-0"
              variant="scale-in"
            >
              <h2 className="font-bold text-7xl leading-tight">
                Easily shareable with friends
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Every photo you take lands straight in a shared feed. React,
                compare, and see what your friends spotted — no links or group
                chats needed.
              </p>
            </AnimateOnScroll>

            {/* Phone mockup: feed */}
            <AnimateOnScroll
              className="shrink-0"
              variant="scale-in"
              delay={100}
            >
              <div className="w-[30rem] rounded-[2rem] border-[3px] border-foreground/15 bg-background shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-foreground/5 flex justify-center py-2.5">
                  <div className="w-12 h-1 bg-foreground/20 rounded-full" />
                </div>
                <div className="flex-1 bg-background p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Today's Feed
                  </p>
                  {/* Feed item 1 */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-orange-100 dark:bg-orange-900/30 h-32 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-orange-400" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold">Alex · Red Things</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                          ❤️ 2
                        </span>
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                          🔥 1
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Feed item 2 */}
                  <div className="rounded-xl border border-border overflow-hidden">
                    <div className="bg-sky-100 dark:bg-sky-900/30 h-32 flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-sky-400" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold">Jordan · Circles</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-xs bg-muted rounded-full px-2 py-0.5">
                          😮 3
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-background flex justify-center py-2">
                  <div className="w-16 h-1 bg-foreground/15 rounded-full" />
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </section>

        {/* ── Never gets repetitive ─────────────────────────── */}
        <section className="px-4 py-16 w-full border-t border-border/60">
          <AnimateOnScroll className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Crosshair className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-bold text-3xl leading-tight">
                Never gets repetitive
              </h2>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Four fresh challenges drop every morning — a new color, shape,
              theme, and object. No two days look the same.
            </p>
          </AnimateOnScroll>
        </section>

        {/* ── Explore places ───────────────────────────────── */}
        <section className="px-4 py-16 w-full border-t border-border/60">
          <AnimateOnScroll className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Compass className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-bold text-3xl leading-tight">
                Explore places you've never gone to
              </h2>
            </div>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
              A topic pulls you down streets you'd normally walk past. You'll be
              surprised how much your own neighbourhood has been hiding.
            </p>
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
