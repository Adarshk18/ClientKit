"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { payoutSchema, workspaceSettingsSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/request";
import { logError } from "@/lib/logger";

const LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const LOGO_MAX = 1024 * 1024;

export async function updateWorkspaceAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const parsed = workspaceSettingsSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    country: formData.get("country"),
  });
  if (!parsed.success) return;
  const { supabase, workspace } = await requireWorkspace();
  const { error } = await supabase
    .from("workspaces")
    .update(parsed.data)
    .eq("id", workspace.id)
    .eq("owner_id", workspace.owner_id);
  if (error) logError("settings.workspace", error);
  revalidatePath("/settings");
}

export async function updatePayoutAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const parsed = payoutSchema.safeParse({
    payout_type: formData.get("payout_type"),
    payout_value: formData.get("payout_value"),
  });
  if (!parsed.success) return;
  const { supabase, workspace } = await requireWorkspace();
  const { error } = await supabase
    .from("workspaces")
    .update({
      payout_type: parsed.data.payout_type,
      payout_value: parsed.data.payout_value,
    })
    .eq("id", workspace.id);
  if (error) logError("settings.payout", error);
  revalidatePath("/settings");
}

export async function uploadLogoAction(formData: FormData): Promise<void> {
  await assertSameOrigin();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;
  if (!LOGO_TYPES.has(file.type) || file.size > LOGO_MAX) return;
  const { supabase, user, workspace } = await requireWorkspace();
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from("logos").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    logError("settings.logo", uploadError);
    return;
  }
  const { error } = await supabase.from("workspaces").update({ logo_url: path }).eq("id", workspace.id);
  if (error) logError("settings.logo", error);
  revalidatePath("/settings");
}
