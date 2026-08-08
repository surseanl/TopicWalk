"use client";

import { ArrowLeft, CalendarDays, Camera } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import type { Identity } from "~/lib/identity";
import { getIdentity, saveGuestIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import type { Category } from "~/lib/topics";
import { getTodayTopics } from "~/lib/topics";
import { imageExt, validateImage } from "~/lib/upload";
import { cn } from "~/lib/utils";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "😮"];

type Reaction = { emoji: string; user_id: string };
type Submission = {
  id: string;
  user_id: string;
  display_name: string;
  topic_category: string;
  topic_label: string;
  photo_path: string;
  submitted_at: string;
  tw_reactions: Reaction[];
};

const CATEGORY_COLORS: Record<Category, string> = {
  Color:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Shape:
    "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300",
  Theme:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Object:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const STAGGER = [
  "animation-delay-75",
  "animation-delay-150",
  "animation-delay-225",
  "animation-delay-300",
];

export default function WalkPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const topics = getTodayTopics();

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{
    category: Category;
    label: string;
  } | null>(null);
  const [feed, setFeed] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [guestPhotos, setGuestPhotos] = useState<
    Array<{ url: string; label: string; category: Category }>
  >([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    const id = getIdentity() ?? saveGuestIdentity();
    setIdentity(id);
    if (id.isGuest) {
      setLoading(false);
      return;
    }
    fetchFeed(id);
    const interval = setInterval(() => fetchFeed(id), 8000);
    return () => clearInterval(interval);
  }, []);

  async function fetchFeed(id: Identity) {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("tw_submissions")
      .select("*, tw_reactions(*)")
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
      if (identity.isGuest) {
        const publicUrl = supabase.storage
          .from("game-photos")
          .getPublicUrl(path).data.publicUrl;
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
      setSelectedTopic(null);
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
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Today&apos;s Topics
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {topics.map((t, i) => (
            <button
              key={t.category}
              type="button"
              onClick={() =>
                setSelectedTopic(selectedTopic?.label === t.label ? null : t)
              }
              className={cn(
                "animate-scale-in rounded-xl border-2 p-3.5 text-left transition-all duration-200",
                STAGGER[i],
                selectedTopic?.label === t.label
                  ? "border-primary bg-primary/8 shadow-sm scale-[1.02]"
                  : "border-border hover:border-primary/40 hover:bg-muted/40 hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold rounded-full px-2 py-0.5",
                  CATEGORY_COLORS[t.category],
                )}
              >
                {t.category}
              </span>
              <p className="mt-2 font-semibold text-sm leading-tight">
                {t.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Photo submit */}
      {selectedTopic && (
        <div className="animate-scale-in rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
          <p className="text-sm">
            Topic:{" "}
            <span className="font-semibold text-primary">
              {selectedTopic.label}
            </span>
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            className="w-full h-12 font-semibold shadow-sm hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all"
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

      {/* Guest: own photos + sign-up prompt */}
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
                      {p.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-xl border bg-muted/40 p-5 space-y-3 text-center">
            <p className="font-semibold text-sm">See what your friends found</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign up to share photos with friends, react to their finds, and
              save your walk history.
            </p>
            <div className="flex gap-2">
              <Link href="/auth" className="flex-1">
                <Button className="w-full shadow-sm hover:shadow-md hover:-translate-y-px transition-all">
                  Sign Up
                </Button>
              </Link>
              <Link href="/auth" className="flex-1">
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
        /* Social feed */
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
                        {sub.topic_category}
                      </span>
                    </div>
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
