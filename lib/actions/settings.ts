"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { payoutSchema, workspaceSettingsSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/request";
import { logError } from "@/lib/logger";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";

const LOGO_MAX = 1024 * 1024;

function sniffLogoType(file: { type: string; name?: string }): string | null {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg") {
    return file.type;
  }
  if (file.type === "image/jpg") return "image/jpeg";
  const name = (file.name ?? "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return null;
}

function asBlob(value: FormDataEntryValue | null): { blob: Blob; name: string; type: string } | null {
  if (!value || typeof value === "string") return null;
  const blob = value as Blob;
  if (typeof blob.size !== "number" || blob.size <= 0) return null;
  const name = "name" in value && typeof value.name === "string" ? value.name : "logo";
  const type = typeof blob.type === "string" ? blob.type : "";
  return { blob, name, type };
}

export async function updateWorkspaceAction(formData: FormData): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const parsed = workspaceSettingsSchema.safeParse({
      name: formData.get("name"),
      currency: formData.get("currency"),
      country: formData.get("country"),
    });
    if (!parsed.success) {
      return { ok: false, error: "Check name, a 3-letter currency, and a 2-letter country." };
    }
    const { supabase, workspace } = await requireWorkspace();
    const { error } = await supabase
      .from("workspaces")
      .update(parsed.data)
      .eq("id", workspace.id)
      .eq("owner_id", workspace.owner_id);
    if (error) return { ok: false, error: "Could not save brand." };
    revalidatePath("/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    logError("settings.workspace", error);
    return { ok: false, error: "Could not save brand." };
  }
}

export async function updatePayoutAction(formData: FormData): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const parsed = payoutSchema.safeParse({
      payout_type: formData.get("payout_type"),
      payout_value: formData.get("payout_value"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payout method." };
    }
    const { supabase, workspace } = await requireWorkspace();
    const { error } = await supabase
      .from("workspaces")
      .update({
        payout_type: parsed.data.payout_type,
        payout_value: parsed.data.payout_value,
      })
      .eq("id", workspace.id);
    if (error) return { ok: false, error: "Could not save payout method." };
    revalidatePath("/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    logError("settings.payout", error);
    return { ok: false, error: "Could not save payout method." };
  }
}

export async function uploadLogoAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const parsed = asBlob(formData.get("logo"));
    if (!parsed) {
      return { ok: false, error: "Choose a PNG, JPEG, or WebP under 1 MB." };
    }
    if (parsed.blob.size > LOGO_MAX) {
      return { ok: false, error: "Logo must be under 1 MB." };
    }
    const contentType = sniffLogoType({ type: parsed.type, name: parsed.name });
    if (!contentType) {
      return { ok: false, error: "Use PNG, JPEG, or WebP." };
    }

    const { user, workspace } = await requireWorkspace();
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/logo.${ext}`;
    const buffer = Buffer.from(await parsed.blob.arrayBuffer());
    const admin = createSupabaseAdmin();
    const { error: uploadError } = await admin.storage.from("logos").upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (uploadError) {
      logError("settings.logo", uploadError);
      return {
        ok: false,
        error:
          uploadError.message.includes("Bucket") || uploadError.message.includes("not found")
            ? "Logo storage is missing. Run supabase/migrations/0001_init.sql in the SQL editor."
            : "Could not upload logo.",
      };
    }

    const { supabase } = await requireWorkspace();
    const { error } = await supabase.from("workspaces").update({ logo_url: path }).eq("id", workspace.id);
    if (error) return { ok: false, error: "Uploaded, but could not save the logo path." };
    revalidatePath("/settings");
    return { ok: true, data: undefined };
  } catch (error) {
    logError("settings.logo", error);
    return { ok: false, error: "Could not upload logo." };
  }
}
