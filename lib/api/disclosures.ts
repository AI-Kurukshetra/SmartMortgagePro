import type { DisclosureType } from "@/types/database.types";

type GenerateDisclosurePayload = {
  loanId: string;
  type: DisclosureType;
  supersedesId?: string;
  changeReason?: string;
  changeNotes?: string;
};

export async function createDisclosureViaApi(payload: GenerateDisclosurePayload) {
  const response = await fetch(`/api/loans/${payload.loanId}/disclosures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: payload.type,
      supersedesId: payload.supersedesId,
      changeReason: payload.changeReason,
      changeNotes: payload.changeNotes,
    }),
  });

  const result = (await response.json()) as
    | { ok: true; disclosure: { id: string } }
    | { ok: false; error: string };

  if (!response.ok || !result.ok) {
    throw new Error(result.ok ? "Disclosure request failed." : result.error);
  }

  return result.disclosure;
}
