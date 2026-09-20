import { z } from "zod";
import { MAX_LINE_ITEMS, MAX_SCOPE_LENGTH, MAX_TITLE_LENGTH } from "@/lib/sanitize";

export const emailSchema = z.string().trim().email().max(320);

export const lineItemSchema = z.object({
  label: z.string().trim().min(1).max(200),
  qty: z.number().positive().max(10_000),
  unit_amount: z.number().int().min(0).max(1_000_000_000),
});

export const documentInputSchema = z.object({
  client_name: z.string().trim().min(1).max(120),
  client_email: emailSchema,
  title: z.string().trim().min(1).max(MAX_TITLE_LENGTH),
  scope_html: z.string().max(MAX_SCOPE_LENGTH),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase()),
  deposit_percent: z.number().int().min(0).max(100),
  expires_at: z.string().datetime().nullable().optional(),
  line_items: z.array(lineItemSchema).max(MAX_LINE_ITEMS),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;

export const signInputSchema = z.object({
  public_id: z.string().min(16).max(32),
  signer_name: z.string().trim().min(2).max(120),
  signer_email: emailSchema,
  agree: z.coerce.boolean().refine((value) => value === true, "You must agree to sign."),
});

export const payoutSchema = z.discriminatedUnion("payout_type", [
  z.object({
    payout_type: z.literal("upi"),
    payout_value: z
      .string()
      .trim()
      .min(5)
      .max(80)
      .regex(/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/, "Enter a UPI VPA like name@okaxis"),
  }),
  z.object({
    payout_type: z.literal("url"),
    payout_value: z.string().trim().url().max(500).refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Payout URL must be https"),
  }),
]);

export const workspaceSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  currency: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase()),
  country: z
    .string()
    .length(2)
    .transform((v) => v.toUpperCase()),
});

export const authSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
  workspace_name: z.string().trim().min(1).max(80).optional(),
});

export const planCheckoutSchema = z.enum(["founder", "solo", "busy"]);
