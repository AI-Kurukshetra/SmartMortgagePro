import { NextResponse } from "next/server";
import {
  buildTemplateFromQuery,
  messageTemplateDefinitions,
} from "@/lib/messages/templates";
import type { DocCategory } from "@/types/database.types";

const docCategories = [
  "pay_stub",
  "w2",
  "bank_statement",
  "tax_return",
  "id_document",
  "employment_letter",
  "other",
] as const satisfies readonly DocCategory[];

function getRequestedCategory(searchParams: URLSearchParams) {
  const category = searchParams.get("category");
  if (!category || !docCategories.includes(category as DocCategory)) {
    return undefined;
  }

  return category as DocCategory;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = getRequestedCategory(searchParams);
  const highlightedTemplate = searchParams.get("template") ?? undefined;

  return NextResponse.json(
    {
      ok: true,
      highlightedTemplate: buildTemplateFromQuery(highlightedTemplate, category) ?? null,
      templates: messageTemplateDefinitions.map((definition) => ({
        description: definition.description,
        draft: definition.createDraft(category),
        label: definition.label,
      })),
    },
    { status: 200 },
  );
}
