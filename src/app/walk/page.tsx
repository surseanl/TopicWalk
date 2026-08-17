"use client";

import { ArrowLeft, CalendarDays, Camera, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import type { Identity } from "~/lib/identity";
import { getIdentity, saveGuestIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { syncIdentityFromSupabase } from "~/lib/sync-identity";
import type { Category } from "~/lib/topics";
import { getTodayTopics } from "~/lib/topics";
import { imageExt, validateImage } from "~/lib/upload";
import { cn } from "~/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮"];

type Reaction = { emoji: string; user_id: string };
type Rating = { user_id: string; score: number };
type Submission = {
  id: string;
  user_id: string;
  display_name: string;
  topic_category: string;
  topic_label: string;
  photo_path: string;
  submitted_at: string;
  tw_reactions: Reaction[];
  tw_ratings: Rating[];
};

const CATEGORY_STYLE: Record<
  Category,
  { icon: string; wash: string; dot: string; badge: string; accent: string }
> = {
  Color: {
    icon: "bg-orange-100 dark:bg-orange-900/40",
    wash: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
    dot: "bg-orange-400 dark:bg-orange-500",
    badge: "text-orange-600 dark:text-orange-400",
    accent: "text-orange-500 dark:text-orange-400",
  },
  Shape: {
    icon: "bg-sky-100 dark:bg-sky-900/40",
    wash: "bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800",
    dot: "bg-sky-400 dark:bg-sky-500",
    badge: "text-sky-600 dark:text-sky-400",
    accent: "text-sky-500 dark:text-sky-400",
  },
  Theme: {
    icon: "bg-violet-100 dark:bg-violet-900/40",
    wash: "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800",
    dot: "bg-violet-400 dark:bg-violet-500",
    badge: "text-violet-600 dark:text-violet-400",
    accent: "text-violet-500 dark:text-violet-400",
  },
  Object: {
    icon: "bg-emerald-100 dark:bg-emerald-900/40",
    wash: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
    dot: "bg-emerald-400 dark:bg-emerald-500",
    badge: "text-emerald-600 dark:text-emerald-400",
    accent: "text-emerald-500 dark:text-emerald-400",
  },
};

const CATEGORY_ICONS = {
  Color: (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="w-full h-full"
    >
      <circle cx="16" cy="16" r="11" fill="currentColor" />
    </svg>
  ),
  Shape: (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="w-full h-full"
    >
      <polygon
        points="16,3 30,27 2,27"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Theme: (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="w-full h-full"
    >
      <path
        d="M16 2L18.2 13.8L30 16L18.2 18.2L16 30L13.8 18.2L2 16L13.8 13.8Z"
        fill="currentColor"
      />
    </svg>
  ),
  Object: (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="w-full h-full"
    >
      <path
        d="M16 2C10.48 2 6 6.48 6 12C6 19.5 16 30 16 30C16 30 26 19.5 26 12C26 6.48 21.52 2 16 2Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <circle cx="16" cy="12" r="3.5" fill="currentColor" />
    </svg>
  ),
};

const CATEGORY_COLORS: Record<Category, string> = {
  Color:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Shape: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Theme:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Object:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const CATEGORY_EMOJI: Record<Category, string> = {
  Color: "🎨",
  Shape: "🔷",
  Theme: "✨",
  Object: "📍",
};

const DAILY_PICK_KEY = "tw_daily_pick";
type DailyPick = { category: Category; label: string };
type StoredPick = { date: string; category: Category; label: string };

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadDailyPick(): DailyPick | null {
  try {
    const raw = localStorage.getItem(DAILY_PICK_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as StoredPick;
    return p.date === todayKey()
      ? { category: p.category, label: p.label }
      : null;
  } catch (_e) {
    return null;
  }
}

function saveDailyPick(topic: DailyPick) {
  try {
    localStorage.setItem(
      DAILY_PICK_KEY,
      JSON.stringify({ date: todayKey(), ...topic }),
    );
  } catch (_e) {}
}

// Star path used for both filled and empty stars
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("w-full h-full", className)}
      aria-hidden="true"
    >
      <path d={STAR_PATH} fill="currentColor" />
    </svg>
  );
}

// Static star display — shows average score
function StarDisplay({ ratings }: { ratings: Rating[] }) {
  if (ratings.length === 0) {
    return <p className="text-xs text-muted-foreground">No ratings yet</p>;
  }
  const avg = ratings.reduce((s, r) => s + Number(r.score), 0) / ratings.length;
  const rounded = Math.round(avg * 2) / 2; // round to nearest 0.5

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill: 0 | 0.5 | 1 =
            rounded >= i ? 1 : rounded >= i - 0.5 ? 0.5 : 0;
          return (
            <div key={i} className="relative w-4 h-4">
              <div className="text-border/40">
                <StarIcon />
              </div>
              {fill > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden text-amber-400"
                  style={{ width: fill === 0.5 ? "50%" : "100%" }}
                >
                  <div className="w-4 h-4">
                    <StarIcon />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {avg.toFixed(1)} ({ratings.length})
      </span>
    </div>
  );
}

// Interactive star rating widget
function StarRatingWidget({
  submissionId,
  myScore,
  onRate,
}: {
  submissionId: string;
  myScore: number | null;
  onRate: (id: string, score: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? myScore ?? 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const fill: 0 | 0.5 | 1 =
            display >= i ? 1 : display >= i - 0.5 ? 0.5 : 0;
          return (
            <div key={i} className="relative w-6 h-6">
              <div className="text-border/40">
                <StarIcon />
              </div>
              {fill > 0 && (
                <div
                  className="absolute inset-0 overflow-hidden text-amber-400"
                  style={{ width: fill === 0.5 ? "50%" : "100%" }}
                >
                  <div className="w-6 h-6">
                    <StarIcon />
                  </div>
                </div>
              )}
              {/* Left half — i - 0.5 */}
              <button
                type="button"
                className="absolute inset-y-0 left-0 w-1/2 h-full"
                onMouseEnter={() => setHover(i - 0.5)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onRate(submissionId, i - 0.5)}
                aria-label={`${i - 0.5} stars`}
              />
              {/* Right half — i */}
              <button
                type="button"
                className="absolute inset-y-0 right-0 w-1/2 h-full"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onRate(submissionId, i)}
                aria-label={`${i} stars`}
              />
            </div>
          );
        })}
      </div>
      {myScore !== null && (
        <span className="text-xs text-muted-foreground tabular-nums ml-0.5">
          {myScore % 1 === 0 ? myScore.toFixed(0) : myScore.toFixed(1)}★
        </span>
      )}
    </div>
  );
}

export default function WalkPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const topics = getTodayTopics();

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{
    category: Category;
    label: string;
  } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [feed, setFeed] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [guestPhotos, setGuestPhotos] = useState<
    Array<{ url: string; label: string; category: Category }>
  >([]);

  function handleCategoryPick(cat: Category) {
    if (isLocked) return;
    const topic = topics.find((t) => t.category === cat);
    if (!topic) return;
    setIsFlipped(false);
    setSelectedTopic(topic);
    setCardKey((k) => k + 1);
    setTimeout(() => setIsFlipped(true), 60);
  }

  function handleConfirm() {
    if (!selectedTopic || isLocked) return;
    saveDailyPick(selectedTopic);
    setIsLocked(true);
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const saved = loadDailyPick();
    if (saved) {
      setSelectedTopic(saved);
      setIsFlipped(true);
      setIsLocked(true);
    }
    async function init() {
      let id = getIdentity();
      if (!id || id.isGuest) {
        await syncIdentityFromSupabase(supabase);
        id = getIdentity();
      }
      const finalId = id ?? saveGuestIdentity();
      setIdentity(finalId);
      if (finalId.isGuest) {
        setLoading(false);
        return;
      }
      fetchFeed(finalId);
      const interval = setInterval(() => fetchFeed(finalId), 8000);
      return () => clearInterval(interval);
    }
    void init();
  }, []);

  async function fetchFeed(id: Identity) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("tw_submissions")
      .select("*, tw_reactions(*), tw_ratings(*)")
      .eq("group_id", id.groupId)
      .gte("submitted_at", `${today}T00:00:00`)
      .order("submitted_at", { ascending: false });
    if (data) setFeed(data as Submission[]);
    setLoading(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedTopic || !identity) return;
    const validationError = validateImage(file);
    if (validationError) {
      setUploadError(validationError);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploadError(null);
    setUploading(true);

    const ext = imageExt(file);
    const path = identity.isGuest
      ? `guest/${identity.userId}/${Date.now()}.${ext}`
      : `${identity.groupId}/${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("game-photos")
      .upload(path, file, { upsert: false });

    if (!uploadErr) {
      const publicUrl = supabase.storage.from("game-photos").getPublicUrl(path)
        .data.publicUrl;

      if (identity.isGuest) {
        setGuestPhotos((prev) => [
          {
            url: publicUrl,
            label: selectedTopic.label,
            category: selectedTopic.category,
          },
          ...prev,
        ]);
      } else {
        await supabase.from("tw_submissions").insert({
          group_id: identity.groupId,
          user_id: identity.userId,
          display_name: identity.displayName,
          topic_category: selectedTopic.category,
          topic_label: selectedTopic.label,
          photo_path: path,
        });
        fetchFeed(identity);
      }
      if (fileRef.current) fileRef.current.value = "";
    }
    setUploading(false);
  }

  async function react(submissionId: string, emoji: string) {
    if (!identity) return;
    const sub = feed.find((s) => s.id === submissionId);
    const mine = sub?.tw_reactions.find((r) => r.user_id === identity.userId);
    if (mine?.emoji === emoji) {
      await supabase
        .from("tw_reactions")
        .delete()
        .eq("submission_id", submissionId)
        .eq("user_id", identity.userId);
    } else {
      await supabase
        .from("tw_reactions")
        .upsert(
          { submission_id: submissionId, user_id: identity.userId, emoji },
          { onConflict: "submission_id,user_id" },
        );
    }
    fetchFeed(identity);
  }

  async function rateSubmission(submissionId: string, score: number) {
    if (!identity) return;
    await supabase
      .from("tw_ratings")
      .upsert(
        { submission_id: submissionId, user_id: identity.userId, score },
        { onConflict: "submission_id,user_id" },
      );
    fetchFeed(identity);
  }

  if (!identity) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <Link href={identity.isGuest ? "/" : "/home"}>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/60 transition-colors active:scale-90"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Free Walk</h1>
          <p className="text-xs text-muted-foreground">
            {identity.isGuest
              ? "Pick a topic · Take a photo"
              : "Pick a topic · Take a photo · Share with your group"}
          </p>
        </div>
        <Link href="/archive">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted/60 transition-colors active:scale-90"
          >
            <CalendarDays className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Topic picker */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {topics.map((t) => {
            const s = CATEGORY_STYLE[t.category];
            const isActive = selectedTopic?.category === t.category;
            const isDisabled = isLocked && !isActive;
            return (
              <button
                key={t.category}
                type="button"
                onClick={() => handleCategoryPick(t.category)}
                disabled={isDisabled}
                className={cn(
                  "rounded-2xl p-5 flex flex-col items-center gap-3 border-2 transition-all duration-200",
                  isDisabled
                    ? "opacity-25 cursor-not-allowed border-border bg-card"
                    : isActive
                      ? cn("shadow-md active:scale-95", s.wash)
                      : "border-border bg-card hover:bg-muted/50 active:scale-95",
                )}
              >
                <div
                  className={cn(
                    "h-16 w-16 rounded-2xl flex items-center justify-center p-4",
                    s.icon,
                    s.accent,
                  )}
                >
                  {CATEGORY_ICONS[t.category]}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isActive ? s.badge : "text-muted-foreground",
                  )}
                >
                  {t.category}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dispenser: mascot + flip card */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex-shrink-0 transition-all duration-300",
              selectedTopic ? "opacity-100 scale-100" : "opacity-30 scale-90",
            )}
          >
            <div
              key={cardKey}
              className={cardKey > 0 ? "animate-mascot-flip" : ""}
            >
              <Image
                src="/mascot-new.png"
                width={80}
                height={80}
                alt="mascot"
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          <div className="flex-1 h-[148px]" style={{ perspective: "900px" }}>
            <div
              key={cardKey}
              className="w-full h-full relative"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(0deg)" : "rotateY(-180deg)",
                transition: "transform 0.52s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {/* Front — topic text */}
              <div
                className="absolute inset-0 rounded-2xl bg-card border-2 border-border shadow-sm flex flex-col justify-center px-6"
                style={{ backfaceVisibility: "hidden" }}
              >
                {selectedTopic && (
                  <>
                    <p
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-widest mb-2",
                        CATEGORY_STYLE[selectedTopic.category].badge,
                      )}
                    >
                      {selectedTopic.category}
                    </p>
                    <p className="font-bold text-xl leading-snug text-foreground">
                      {selectedTopic.label}
                    </p>
                  </>
                )}
              </div>

              {/* Back — category SVG icon */}
              <div
                className={cn(
                  "absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2",
                  selectedTopic
                    ? CATEGORY_STYLE[selectedTopic.category].icon
                    : "bg-muted",
                  selectedTopic
                    ? CATEGORY_STYLE[selectedTopic.category].accent
                    : "text-muted-foreground",
                )}
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="w-10 h-10">
                  {selectedTopic ? (
                    CATEGORY_ICONS[selectedTopic.category]
                  ) : (
                    <svg
                      viewBox="0 0 32 32"
                      fill="none"
                      aria-hidden="true"
                      className="w-full h-full"
                    >
                      <circle
                        cx="16"
                        cy="16"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">
                  {selectedTopic?.category ?? "Pick a category"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {isLocked && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Today&apos;s pick — resets at midnight</span>
          </div>
        )}
      </div>

      {/* Confirm pick or take photo */}
      {selectedTopic && !isLocked && (
        <div className="animate-scale-in">
          <Button
            className="w-full h-14 font-semibold text-base shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all rounded-2xl"
            onClick={handleConfirm}
          >
            <Lock className="h-5 w-5 mr-2" />
            Lock in {selectedTopic.category}
          </Button>
        </div>
      )}

      {isLocked && selectedTopic && (
        <div className="animate-scale-in space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            className="w-full h-14 font-semibold text-base shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all rounded-2xl"
            onClick={() => {
              setUploadError(null);
              fileRef.current?.click();
            }}
            disabled={uploading}
          >
            <Camera className="h-5 w-5 mr-2" />
            {uploading ? "Uploading…" : "Take / Upload Photo"}
          </Button>
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>
      )}

      {/* Feed — locked for guests */}
      {identity.isGuest ? (
        <div className="space-y-4">
          {guestPhotos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Your Submissions
              </h2>
              {guestPhotos.map((p) => (
                <div
                  key={p.url}
                  className="animate-fade-in-up rounded-xl border shadow-sm overflow-hidden"
                >
                  {/* biome-ignore lint/performance/noImgElement: Supabase storage public URL */}
                  <img
                    src={p.url}
                    alt={p.label}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-3 flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{p.label}</p>
                    <span
                      className={cn(
                        "text-xs font-semibold rounded-full px-2 py-0.5",
                        CATEGORY_COLORS[p.category],
                      )}
                    >
                      {CATEGORY_EMOJI[p.category]} {p.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <p className="font-semibold text-sm">Community Feed</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sign in to see what your friends photographed today and react to
                their finds.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/auth?tab=signup" className="flex-1">
                <Button className="w-full shadow-sm hover:shadow-md hover:-translate-y-px transition-all">
                  Sign Up
                </Button>
              </Link>
              <Link href="/auth?tab=login" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full hover:-translate-y-px transition-all"
                >
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Today&apos;s Feed
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="rounded-xl border overflow-hidden animate-pulse"
                >
                  <div className="w-full aspect-square bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
              No submissions yet — be the first! 📸
            </div>
          ) : (
            feed.map((sub) => {
              const url = supabase.storage
                .from("game-photos")
                .getPublicUrl(sub.photo_path).data.publicUrl;
              const isOwn = sub.user_id === identity.userId;
              const myRating = sub.tw_ratings.find(
                (r) => r.user_id === identity.userId,
              );

              return (
                <div
                  key={sub.id}
                  className="animate-fade-in-up rounded-xl border shadow-sm overflow-hidden"
                >
                  {/* biome-ignore lint/performance/noImgElement: Supabase storage public URL */}
                  <img
                    src={url}
                    alt={sub.topic_label}
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm truncate">
                        {sub.display_name}
                        <span className="font-normal text-muted-foreground ml-1.5 text-xs">
                          {sub.topic_label}
                        </span>
                      </p>
                      <span
                        className={cn(
                          "text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0",
                          CATEGORY_COLORS[sub.topic_category as Category],
                        )}
                      >
                        {CATEGORY_EMOJI[sub.topic_category as Category]}{" "}
                        {sub.topic_category}
                      </span>
                    </div>

                    {/* Star rating */}
                    <div className="flex items-center justify-between gap-2">
                      {isOwn ? (
                        <StarDisplay ratings={sub.tw_ratings} />
                      ) : (
                        <StarRatingWidget
                          submissionId={sub.id}
                          myScore={myRating ? Number(myRating.score) : null}
                          onRate={rateSubmission}
                        />
                      )}
                      {!isOwn && sub.tw_ratings.length > 0 && (
                        <StarDisplay ratings={sub.tw_ratings} />
                      )}
                    </div>

                    {/* Emoji reactions */}
                    <div className="flex gap-1.5 flex-wrap">
                      {EMOJIS.map((emoji) => {
                        const count = sub.tw_reactions.filter(
                          (r) => r.emoji === emoji,
                        ).length;
                        const mine = sub.tw_reactions.some(
                          (r) =>
                            r.emoji === emoji && r.user_id === identity.userId,
                        );
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => react(sub.id, emoji)}
                            className={cn(
                              "flex items-center gap-0.5 rounded-full px-2.5 py-1 text-sm border transition-all duration-150 active:scale-90",
                              mine
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-border hover:border-primary/50 hover:bg-muted/50",
                            )}
                          >
                            {emoji}
                            {count > 0 && (
                              <span className="text-xs ml-0.5 tabular-nums">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
