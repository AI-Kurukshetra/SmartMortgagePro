import { generateDisclosure } from "@/lib/services/disclosures";
import type { DisclosureType } from "@/types/database.types";

export async function generateDisclosureJob(input: {
  loanId: string;
  type: DisclosureType;
  changeReason?: string;
  changeNotes?: string;
}) {
  return generateDisclosure({
    loanId: input.loanId,
    type: input.type,
    changeReason: input.changeReason,
    changeNotes: input.changeNotes,
  });
}
