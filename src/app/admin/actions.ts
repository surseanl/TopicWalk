"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { env } from "~/env";
import { createClient } from "~/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== env.ADMIN_EMAIL) redirect("/");
  return supabase;
}

export async function deleteSubmission(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const photoPath = formData.get("photoPath") as string;
  await supabase.from("tw_submissions").delete().eq("id", id);
  if (photoPath) await supabase.storage.from("game-photos").remove([photoPath]);
  revalidatePath("/admin");
}

export async function deleteMascot(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get("id") as string;
  const photoPath = formData.get("photoPath") as string;
  const finderPhotoPath = formData.get("finderPhotoPath") as string;
  await supabase.from("tw_mascots").delete().eq("id", id);
  const paths = [photoPath, finderPhotoPath].filter(Boolean);
  if (paths.length) await supabase.storage.from("game-photos").remove(paths);
  revalidatePath("/admin");
}
