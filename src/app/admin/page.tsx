import { redirect } from "next/navigation";
import { env } from "~/env";
import { createClient } from "~/lib/supabase/server";
import { deleteMascot, deleteSubmission } from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== env.ADMIN_EMAIL) {
    redirect("/");
  }

  const [{ data: submissions }, { data: mascots }] = await Promise.all([
    supabase
      .from("tw_submissions")
      .select(
        "id, display_name, topic_category, topic_label, photo_path, submitted_at",
      )
      .order("submitted_at", { ascending: false }),
    supabase
      .from("tw_mascots")
      .select(
        "id, hider_name, finder_name, photo_path, finder_photo_path, hidden_at, found_at",
      )
      .order("hidden_at", { ascending: false }),
  ]);

  const base = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/game-photos`;

  const totalSubmissions = submissions?.length ?? 0;
  const totalMascots = mascots?.length ?? 0;
  const captured = mascots?.filter((m) => m.found_at).length ?? 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted-foreground">All user activity</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-3xl font-bold">{totalSubmissions}</p>
          <p className="text-sm text-muted-foreground mt-1">Walk photos</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-3xl font-bold">{totalMascots}</p>
          <p className="text-sm text-muted-foreground mt-1">Mascots hidden</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-3xl font-bold">{captured}</p>
          <p className="text-sm text-muted-foreground mt-1">Mascots captured</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Walk Photos</h2>
        {!submissions?.length ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl overflow-hidden border bg-card"
              >
                <div className="aspect-square">
                  {/* biome-ignore lint/performance/noImgElement: dynamic Supabase storage URL */}
                  <img
                    src={`${base}/${sub.photo_path}`}
                    alt={sub.topic_label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="px-3 py-2 space-y-0.5">
                  <p className="text-xs font-medium truncate">
                    {sub.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {sub.topic_category}: {sub.topic_label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sub.submitted_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <form action={deleteSubmission}>
                    <input type="hidden" name="id" value={sub.id} />
                    <input
                      type="hidden"
                      name="photoPath"
                      value={sub.photo_path ?? ""}
                    />
                    <button
                      type="submit"
                      className="mt-1 w-full text-xs text-destructive font-medium hover:underline text-left"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mascot Hunt</h2>
        {!mascots?.length ? (
          <p className="text-sm text-muted-foreground">No mascots yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mascots.map((m) => (
              <div
                key={m.id}
                className="rounded-xl overflow-hidden border bg-card"
              >
                <div className="aspect-square relative">
                  {/* biome-ignore lint/performance/noImgElement: dynamic Supabase storage URL */}
                  <img
                    src={`${base}/${m.photo_path}`}
                    alt="Hidden mascot"
                    className="w-full h-full object-cover"
                  />
                  {m.found_at && m.finder_photo_path && (
                    <div className="absolute bottom-1 right-1 w-1/3 aspect-square rounded-lg overflow-hidden border-2 border-background">
                      {/* biome-ignore lint/performance/noImgElement: dynamic Supabase storage URL */}
                      <img
                        src={`${base}/${m.finder_photo_path}`}
                        alt="Capture"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      m.found_at
                        ? "bg-green-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    {m.found_at ? "Found" : "Active"}
                  </span>
                </div>
                <div className="px-3 py-2 space-y-0.5">
                  <p className="text-xs font-medium truncate">
                    By: {m.hider_name}
                  </p>
                  {m.found_at && m.finder_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      Found by: {m.finder_name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.hidden_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <form action={deleteMascot}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="photoPath"
                      value={m.photo_path}
                    />
                    <input
                      type="hidden"
                      name="finderPhotoPath"
                      value={m.finder_photo_path ?? ""}
                    />
                    <button
                      type="submit"
                      className="mt-1 w-full text-xs text-destructive font-medium hover:underline text-left"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
