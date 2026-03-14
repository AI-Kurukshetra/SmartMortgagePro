"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDisclosureViaApi } from "@/lib/api/disclosures";
import type { DisclosureType } from "@/types/database.types";

function formatDisclosureType(type: DisclosureType) {
  switch (type) {
    case "loan_estimate":
      return "Loan Estimate";
    case "closing_disclosure":
      return "Closing Disclosure";
    case "intent_to_proceed":
      return "Intent to Proceed";
    case "adverse_action":
      return "Adverse Action";
    case "appraisal_notice":
      return "Appraisal Notice";
    default:
      return type;
  }
}

export function GenerateDisclosureButton({
  loanId,
  type,
  supersedesId,
  changeReason,
  changeNotes,
  testId,
  label,
  onError,
}: {
  loanId: string;
  type: DisclosureType;
  supersedesId?: string;
  changeReason?: string;
  changeNotes?: string;
  testId?: string;
  label?: string;
  onError?: (message: string | null) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      data-testid={testId}
      onClick={() => {
        onError?.(null);
        startTransition(() => {
          void (async () => {
            try {
              await createDisclosureViaApi({
                loanId,
                type,
                supersedesId,
                changeReason,
                changeNotes,
              });
              router.refresh();
            } catch (error) {
              onError?.(
                error instanceof Error
                  ? error.message
                  : "Unable to generate the disclosure right now.",
              );
              return;
            }
          })();
        });
      }}
      disabled={isPending}
    >
      <FilePlus2 className="mr-2 size-4" />
      {isPending ? "Generating..." : label ?? `Generate ${formatDisclosureType(type)}`}
    </Button>
  );
}
