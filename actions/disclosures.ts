"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateDisclosure } from "@/lib/services/disclosures";
import { createServerClient } from "@/lib/supabase/server";
import type { DisclosureType } from "@/types/database.types";

const generateDisclosureSchema = z
  .object({
    loanId: z.string().min(1),
    type: z.enum([
      "loan_estimate",
      "closing_disclosure",
      "intent_to_proceed",
      "adverse_action",
      "appraisal_notice",
    ] satisfies [DisclosureType, ...DisclosureType[]]),
    supersedesId: z.string().optional(),
    changeReason: z.string().trim().optional(),
    changeNotes: z.string().trim().max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.supersedesId && !value.changeReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason is required",
        path: ["changeReason"],
      });
    }
  });

type DisclosureActionResult =
  | { ok: true; disclosureId: string }
  | { ok: false; error: string };

export async function generateDisclosureAction(input: {
  loanId: string;
  type: DisclosureType;
  supersedesId?: string;
  changeReason?: string;
  changeNotes?: string;
}): Promise<DisclosureActionResult> {
  const parsed = generateDisclosureSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please provide valid disclosure details.",
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const disclosure = await generateDisclosure({
      loanId: parsed.data.loanId,
      type: parsed.data.type,
      generatedBy: user?.id ?? null,
      supersedesId: parsed.data.supersedesId,
      changeReason: parsed.data.changeReason,
      changeNotes: parsed.data.changeNotes,
    });

    revalidatePath(`/loans/${parsed.data.loanId}/disclosures`);
    revalidatePath(`/loans/${parsed.data.loanId}/disclosures/${disclosure.id}`);
    return { ok: true, disclosureId: disclosure.id };
  } catch (error) {
    console.error("generateDisclosureAction failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to generate the disclosure right now.",
    };
  }
}
