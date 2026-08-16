"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import type { Identity } from "~/lib/identity";
import { getIdentity } from "~/lib/identity";
import { createClient } from "~/lib/supabase/client";
import { syncIdentityFromSupabase } from "~/lib/sync-identity";
import { cn } from "~/lib/utils";

type Submission = {
  id: string;
  topic_category: string;
  topic_label: string;
  photo_path: string;
  submitted_at: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function ArchivePage() {
  const router = useRouter();
  const supabase = createClient();

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    async function init() {
      let id = getIdentity();
      if (!id || id.isGuest) {
        const synced = await syncIdentityFromSupabase(supabase);
        if (!synced) {
          router.replace("/auth?tab=login");
          return;
        }
        id = getIdentity();
      }
      if (!id || id.isGuest) {
        router.replace("/auth?tab=login");
        return;
      }
      setIdentity(id);
      fetchAll(id);
    }
    void init();
  }, []);

  async function fetchAll(id: Identity) {
    const { data } = await supabase
      .from("tw_submissions")
      .select("id, topic_category, topic_label, photo_path, submitted_at")
      .eq("user_id", id.userId)
      .order("submitted_at", { ascending: true });
    if (data) setSubmissions(data as Submission[]);
    setLoading(false);
  }

  const byDate = new Map<string, Submission[]>();
  for (const s of submissions) {
    const d = new Date(s.submitted_at).toLocaleDateString("en-CA");
    const existing = byDate.get(d);
    if (existing) {
      existing.push(s);
    } else {
      byDate.set(d, [s]);
    }
  }

  const nowDate = new Date();
  const nowYear = nowDate.getFullYear();
  const nowMonth = nowDate.getMonth();
  const todayStr = nowDate.toLocaleDateString("en-CA");

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const spacers = Array.from({ length: firstDow }, (_, i) => i);
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const atLimit = year > nowYear || (year === nowYear && month >= nowMonth);

  function prevMonth() {
    setSelected(null);
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (atLimit) return;
    setSelected(null);
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const selectedSubs = selected ? (byDate.get(selected) ?? []) : [];

  if (!identity) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-12 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/walk">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">My Archive</h1>
          <p className="text-xs text-muted-foreground">
            Your Free Walk history
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-base font-semibold">
          {MONTHS[month]} {year}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          disabled={atLimit}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground text-sm animate-pulse">
          Loading…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 text-center">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-xs text-muted-foreground font-medium py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {spacers.map((n) => (
              <div key={`sp-${n}`} />
            ))}
            {dayNumbers.map((day) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const subs = byDate.get(dateStr) ?? [];
              const hasEntry = subs.length > 0;
              const isSelected = selected === dateStr;
              const isToday = dateStr === todayStr;
              const firstSub = hasEntry ? subs[0] : null;
              const thumbUrl = firstSub
                ? supabase.storage
                    .from("game-photos")
                    .getPublicUrl(firstSub.photo_path).data.publicUrl
                : null;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    if (!hasEntry) return;
                    setSelected(isSelected ? null : dateStr);
                  }}
                  className={cn(
                    "relative aspect-square rounded-lg overflow-hidden flex items-center justify-center text-sm font-medium transition-all",
                    hasEntry
                      ? "cursor-pointer hover:opacity-90"
                      : "cursor-default",
                    isSelected && "ring-2 ring-primary ring-offset-1",
                    isToday && !hasEntry && "ring-1 ring-border",
                    !hasEntry && "text-muted-foreground/50",
                  )}
                >
                  {thumbUrl ? (
                    <>
                      {/* biome-ignore lint/performance/noImgElement: Supabase storage thumbnail */}
                      <img
                        src={thumbUrl}
                        alt={dateStr}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <span className="relative text-white text-xs font-bold drop-shadow-sm">
                        {day}
                      </span>
                    </>
                  ) : (
                    <span>{day}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selected && selectedSubs.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="font-semibold mt-0.5 text-sm">
                <span className="text-muted-foreground">
                  {selectedSubs[0].topic_category}:
                </span>{" "}
                {selectedSubs[0].topic_label}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={() => setSelected(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {selectedSubs.map((s) => {
            const url = supabase.storage
              .from("game-photos")
              .getPublicUrl(s.photo_path).data.publicUrl;
            return (
              // biome-ignore lint/performance/noImgElement: Supabase storage public URL
              <img
                key={s.id}
                src={url}
                alt={s.topic_label}
                className="w-full aspect-square object-cover"
              />
            );
          })}
        </div>
      )}

      {!loading && submissions.length === 0 && (
        <div className="rounded-xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          No entries yet — go on a Free Walk to start your archive! 📸
        </div>
      )}
    </div>
  );
}
