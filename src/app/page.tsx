"use client";

import {
  Calendar,
  Camera,
  ChevronDown,
  Compass,
  Crosshair,
  Eye,
  MapPin,
  Search,
  Sun,
  Users,
  Zap,
} from "lucide-react";
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
import { cn } from "~/lib/utils";

const WHY_ITEMS = [
  {
    icon: Sun,
    title: "Get outside more",
    description:
      "A daily challenge that makes getting off the couch actually tempting.",
    color: "text-primary",
    iconBg: "bg-primary/12",
  },
  {
    icon: Eye,
    title: "See differently",
    description:
      "Topics train you to notice things you'd normally walk right past.",
    color: "text-secondary",
    iconBg: "bg-secondary/12",
  },
  {
    icon: Zap,
    title: "Always fresh",
    description:
      "A new topic drops every day. You'll never run out of reasons to go.",
    color: "text-primary",
    iconBg: "bg-primary/12",
  },
  {
    icon: Users,
    title: "Better with friends",
    description:
      "Share finds, react to photos, and compete in real-world games.",
    color: "text-secondary",
    iconBg: "bg-secondary/12",
  },
  {
    icon: Calendar,
    title: "Build a habit",
    description: "Turn your daily walk into a ritual worth looking forward to.",
    color: "text-primary",
    iconBg: "bg-primary/12",
  },
  {
    icon: MapPin,
    title: "Any neighbourhood",
    description: "Works wherever you are — your street, a park, a new city.",
    color: "text-secondary",
    iconBg: "bg-secondary/12",
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const whyMarkerRef = useRef<HTMLDivElement>(null);
  const modesMarkerRef = useRef<HTMLDivElement>(null);
  const formMarkerRef = useRef<HTMLDivElement>(null);
  const sectionsWrapperRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const phone1Ref = useRef<HTMLDivElement>(null);
  const phone2Ref = useRef<HTMLDivElement>(null);
  const phone3Ref = useRef<HTMLDivElement>(null);
  const [visitedSections, setVisitedSections] = useState<Set<number>>(
    new Set(),
  );
  const [trailPath, setTrailPath] = useState("");
  const [heroTrail, setHeroTrail] = useState<{
    vx: number;
    vy1: number;
    vy2: number;
    curve: string;
  } | null>(null);
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

  useEffect(() => {
    const calc = () => {
      const section = heroSectionRef.current;
      const p1 = phone1Ref.current;
      const p2 = phone2Ref.current;
      const p3 = phone3Ref.current;
      if (!section || !p1 || !p2 || !p3) return;
      const sR = section.getBoundingClientRect();
      const r1 = p1.getBoundingClientRect();
      const r2 = p2.getBoundingClientRect();
      const r3 = p3.getBoundingClientRect();
      const x1 = r1.left - sR.left + r1.width / 2;
      const p3cx = r3.left - sR.left + r3.width / 2;
      const p3cy = r3.top - sR.top + r3.height / 2;
      const by = r2.bottom - sR.top + 6;
      const dip = Math.min(sR.height - 36, by + 100);
      setHeroTrail({
        vx: x1,
        vy1: r1.bottom - sR.top + 4,
        vy2: r2.top - sR.top - 4,
        curve: `M ${x1} ${by} C ${x1 + 80} ${dip} ${p3cx - 120} ${dip * 0.92} ${p3cx} ${p3cy}`,
      });
    };
    const t = setTimeout(calc, 150);
    const ro = new ResizeObserver(calc);
    if (heroSectionRef.current) ro.observe(heroSectionRef.current);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
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
      <section
        ref={heroSectionRef}
        className="relative overflow-hidden grid items-center justify-items-center min-h-[calc(100dvh-4rem)] px-8 py-16 pb-20 border-b border-border/60 gap-x-6 [grid-template-columns:140px_1fr_140px]"
      >
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse at center, #FFD44A 0%, #FFC730 45%, #FFB018 80%, #F0A010 100%)",
          }}
        />
        {/* Dotted trail SVG — positions computed from actual phone element rects */}
        {heroTrail && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            aria-hidden="true"
          >
            <line
              x1={heroTrail.vx}
              y1={heroTrail.vy1}
              x2={heroTrail.vx}
              y2={heroTrail.vy2}
              stroke="rgba(0,0,0,0.30)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="0.1 13"
            />
            <path
              d={heroTrail.curve}
              fill="none"
              stroke="rgba(0,0,0,0.26)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="0.1 13"
            />
          </svg>
        )}

        {/* Phone frames — left */}
        <div className="flex flex-col items-center gap-8 animate-fade-in-up animation-delay-300">
          {/* Phone 1 — Get a Topic: Walk page topic picker */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={phone1Ref}
              className="relative w-[140px] h-[280px] bg-gray-950 rounded-[2rem] border-[4px] border-gray-800 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded-full z-10" />
              <div className="absolute inset-0 bg-background pt-7 px-2 pb-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1 pb-1 border-b border-border/50">
                  <span className="text-[9px] text-muted-foreground">‹</span>
                  <p className="text-[8px] font-bold flex-1">Free Walk</p>
                  <Calendar
                    className="h-2.5 w-2.5 text-muted-foreground shrink-0"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-[5px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Today's Topics
                </p>
                <div className="grid grid-cols-2 gap-1 flex-1">
                  <div className="border-2 border-primary rounded-lg p-1 bg-primary/8 scale-[1.02]">
                    <span className="text-[4px] font-semibold bg-orange-100 text-orange-700 rounded-full px-1 py-0.5">
                      Color
                    </span>
                    <p className="text-[6px] font-semibold mt-1 leading-tight">
                      Something Orange
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-1">
                    <span className="text-[4px] font-semibold bg-sky-100 text-sky-700 rounded-full px-1 py-0.5">
                      Shape
                    </span>
                    <p className="text-[6px] font-semibold mt-1 leading-tight">
                      Round Things
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-1">
                    <span className="text-[4px] font-semibold bg-violet-100 text-violet-700 rounded-full px-1 py-0.5">
                      Theme
                    </span>
                    <p className="text-[6px] font-semibold mt-1 leading-tight">
                      Daily Ritual
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-1">
                    <span className="text-[4px] font-semibold bg-emerald-100 text-emerald-700 rounded-full px-1 py-0.5">
                      Object
                    </span>
                    <p className="text-[6px] font-semibold mt-1 leading-tight">
                      Found Objects
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-gray-950 text-white px-2.5 py-1 rounded-full tracking-wide">
              Get a Topic
            </span>
          </div>

          {/* Phone 2 — Take a Walk: topic selected + capture panel */}
          <div className="flex flex-col items-center gap-2">
            <div
              ref={phone2Ref}
              className="relative w-[140px] h-[304px] bg-gray-950 rounded-[2rem] border-[4px] border-gray-800 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded-full z-10" />
              <div className="absolute inset-0 bg-background pt-7 px-2 pb-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1 pb-1 border-b border-border/50">
                  <span className="text-[9px] text-muted-foreground">‹</span>
                  <p className="text-[8px] font-bold flex-1">Free Walk</p>
                  <Calendar
                    className="h-2.5 w-2.5 text-muted-foreground shrink-0"
                    strokeWidth={1.5}
                  />
                </div>
                <p className="text-[5px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Today's Topics
                </p>
                <div className="grid grid-cols-2 gap-1">
                  <div className="border-2 border-primary rounded-lg p-1 bg-primary/8">
                    <span className="text-[4px] font-semibold bg-orange-100 text-orange-700 rounded-full px-1 py-0.5">
                      Color
                    </span>
                    <p className="text-[6px] font-semibold mt-0.5 leading-tight">
                      Something Orange
                    </p>
                  </div>
                  <div className="border border-border rounded-lg p-1 opacity-40">
                    <span className="text-[4px] font-semibold bg-sky-100 text-sky-700 rounded-full px-1 py-0.5">
                      Shape
                    </span>
                    <p className="text-[6px] font-semibold mt-0.5 leading-tight">
                      Round Things
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-1.5 flex flex-col gap-1.5">
                  <p className="text-[6px]">
                    Topic:{" "}
                    <span className="font-semibold text-primary">
                      Something Orange
                    </span>
                  </p>
                  <div className="bg-primary rounded-lg py-1.5 flex items-center justify-center gap-1">
                    <Camera
                      className="h-2.5 w-2.5 text-primary-foreground"
                      strokeWidth={1.5}
                    />
                    <p className="text-[6px] font-semibold text-primary-foreground">
                      Take / Upload Photo
                    </p>
                  </div>
                </div>
                <p className="text-[5px] font-semibold text-muted-foreground uppercase tracking-widest">
                  Today's Feed
                </p>
                <div className="flex-1 rounded-lg bg-muted/50 flex items-center justify-center">
                  <p className="text-[5px] text-muted-foreground text-center px-2">
                    Be the first to submit!
                  </p>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-gray-950 text-white px-2.5 py-1 rounded-full tracking-wide">
              Take a Walk
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-6 w-full">
          <div className="space-y-5 animate-fade-in-up animation-delay-100">
            <h1 className="font-display text-[5.5rem] font-extrabold leading-[1.15] tracking-tight">
              <span className="block">Get a topic.</span>
              <span className="block">Take a walk.</span>
              <span className="block underline decoration-wavy decoration-primary decoration-4 underline-offset-[6px]">
                Explore.
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-foreground/80 max-w-[440px]">
              Go outside, capture what you find, and share it with friends.
            </p>
          </div>
          <div className="flex flex-row gap-3 animate-fade-in-up animation-delay-200">
            <Button
              size="lg"
              className="h-14 w-52 text-lg font-medium !bg-transparent !border-2 !border-gray-950 !text-foreground hover:!bg-gray-950/10 hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl"
              onClick={() =>
                formRef.current?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get Started
            </Button>
            <Button
              size="lg"
              className="h-14 w-52 text-lg font-medium !bg-transparent !border-2 !border-gray-950 !text-foreground hover:!bg-gray-950/10 hover:-translate-y-px active:translate-y-0 transition-all duration-200 !rounded-2xl"
              onClick={() => {
                saveGuestIdentity();
                router.push("/walk");
              }}
            >
              Try Free Walk →
            </Button>
          </div>
        </div>

        {/* Phone 3 — Explore */}
        <div className="flex flex-col items-center gap-3 animate-fade-in-up animation-delay-300">
          <div
            ref={phone3Ref}
            className="relative w-[140px] h-[280px] bg-gray-950 rounded-[2rem] border-[4px] border-gray-800 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-700 rounded-full z-10" />
            <div className="absolute inset-0 bg-background pt-7 px-2 pb-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 pb-1 border-b border-border/50">
                <span className="text-[9px] text-muted-foreground">‹</span>
                <div>
                  <p className="text-[8px] font-bold leading-tight">
                    My Archive
                  </p>
                  <p className="text-[5px] text-muted-foreground">
                    Your Free Walk history
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground">‹</span>
                <p className="text-[7px] font-semibold">August 2025</p>
                <span className="text-[8px] text-muted-foreground">›</span>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[4px] text-muted-foreground font-medium"
                  >
                    {d}
                  </div>
                ))}
              </div>
              {/* Aug 2025 starts on Friday (5 leading blanks) */}
              <div className="grid grid-cols-7 gap-0.5 flex-1 content-start">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={`s${i}`} />
                ))}
                {[
                  [1, ""],
                  [2, "bg-emerald-300"],
                  [3, ""],
                  [4, ""],
                  [5, ""],
                  [6, ""],
                  [7, "bg-sky-300"],
                  [8, ""],
                  [9, ""],
                  [10, ""],
                  [11, "bg-amber-300"],
                  [12, ""],
                  [13, ""],
                  [14, "bg-rose-300"],
                  [15, ""],
                  [16, ""],
                  [17, ""],
                  [18, "bg-violet-300"],
                  [19, ""],
                  [20, ""],
                  [21, "bg-orange-300"],
                  [22, ""],
                  [23, ""],
                  [24, ""],
                  [25, "bg-teal-300"],
                  [26, ""],
                  [27, ""],
                  [28, "bg-pink-300"],
                  [29, ""],
                  [30, ""],
                  [31, ""],
                ].map(([d, bg]) => (
                  <div
                    key={d}
                    className={cn(
                      "aspect-square rounded flex items-center justify-center overflow-hidden",
                      bg ? `${bg}` : "",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[4px] font-medium",
                        bg ? "text-white font-bold" : "text-foreground/60",
                      )}
                    >
                      {d}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-gray-950 text-white px-2.5 py-1 rounded-full tracking-wide">
            Explore
          </span>
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
        className="relative max-w-3xl mx-auto w-full isolate"
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

        {/* ── Why ──────────────────────────────────────────── */}
        <section className="px-5 py-14 w-full">
          <AnimateOnScroll className="mb-8">
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
              <h2 className="font-bold text-base whitespace-nowrap">
                Why TopicWalk?
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {WHY_ITEMS.slice(0, 3).map(
              ({ icon: Icon, title, description, color, iconBg }, i) => (
                <AnimateOnScroll key={title} variant="scale-in" delay={i * 60}>
                  <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm h-full">
                    <div className={`p-2.5 rounded-xl ${iconBg} w-fit`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ),
            )}
          </div>
        </section>

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
          <p className="text-3xl font-extrabold tracking-tight">2 modes.</p>
          <p className="text-xl font-semibold text-muted-foreground mt-1">
            Endless reasons to go outside.
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

        {/* ── Get Started form ──────────────────────────────── */}
        <section ref={formRef} className="px-5 pb-16 w-full">
          <AnimateOnScroll className="mb-8">
            <div className="flex items-center gap-3">
              <div
                ref={formMarkerRef}
                className={cn(
                  "shrink-0 rounded-full border overflow-hidden flex items-center justify-center transition-all duration-500 bg-background",
                  visitedSections.has(2)
                    ? "w-10 h-10 border-primary/50 shadow-sm"
                    : "w-7 h-7 border-border bg-muted",
                )}
              >
                {visitedSections.has(2) ? (
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
              <h2 className="font-bold text-base whitespace-nowrap">
                Ready to start walking?
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
          </AnimateOnScroll>

          <div className="max-w-lg mx-auto">
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
          </div>
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
