import {
  formatDisclosureType,
  getDisclosureDetail,
  listDisclosuresByLoanId,
} from "@/lib/services/disclosures";

export async function buildDisclosureReminderPayload(loanId: string) {
  const disclosures = await listDisclosuresByLoanId(loanId);
  const stale = disclosures.filter(
    (disclosure) =>
      disclosure.sent_to_borrower_at &&
      !disclosure.acknowledged_by_borrower_at &&
      Date.now() - new Date(disclosure.sent_to_borrower_at).getTime() >= 24 * 60 * 60 * 1000,
  );

  return Promise.all(
    stale.map(async (disclosure) => {
      const detail = await getDisclosureDetail(loanId, disclosure.id);
      return {
        disclosureId: disclosure.id,
        type: formatDisclosureType(disclosure.type),
        dueDate: disclosure.due_date,
        violationCount: detail?.toleranceResult.violations.length ?? 0,
      };
    }),
  );
}
