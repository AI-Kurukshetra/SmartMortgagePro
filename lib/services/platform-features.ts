import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  FeatureCategory,
  FeatureStatus,
  PlatformFeatureRow,
  ProfileRole,
} from "@/types/database.types";

const featureColumns = [
  "id",
  "feature_code",
  "feature_name",
  "summary",
  "category",
  "audience",
  "tier",
  "complexity",
  "status",
  "owner_team",
  "route_href",
  "sort_order",
  "created_at",
  "updated_at",
].join(", ");

export type PlatformFeatureRecord = PlatformFeatureRow;

function assertNoError(error: { message: string } | null) {
  if (!error) return;
  throw new Error(error.message);
}

function isBorrowerRole(role: ProfileRole | null | undefined) {
  return !role || role === "borrower";
}

export function filterPlatformFeaturesForRole(
  features: PlatformFeatureRecord[],
  role: ProfileRole | null | undefined,
) {
  if (!isBorrowerRole(role)) {
    return features;
  }

  return features.filter((feature) => feature.audience === "borrower" || feature.audience === "both");
}

export async function listPlatformFeatures(
  role?: ProfileRole | null,
): Promise<PlatformFeatureRecord[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("platform_features")
    .select(featureColumns)
    .order("sort_order", { ascending: true });

  if (error?.message.includes("Could not find the table")) {
    return [];
  }

  assertNoError(error);
  return filterPlatformFeaturesForRole(
    (((data ?? []) as unknown) as PlatformFeatureRecord[]),
    role,
  );
}

export function summarizePlatformFeatures(features: PlatformFeatureRecord[]) {
  const counts = features.reduce(
    (accumulator, feature) => {
      accumulator.total += 1;
      accumulator.byCategory[feature.category] += 1;
      accumulator.byStatus[feature.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      byCategory: {
        core: 0,
        automation: 0,
        ai: 0,
      } satisfies Record<FeatureCategory, number>,
      byStatus: {
        planned: 0,
        seeded: 0,
        in_progress: 0,
        live: 0,
      } satisfies Record<FeatureStatus, number>,
    },
  );

  return counts;
}

export function formatFeatureTier(value: PlatformFeatureRecord["tier"]) {
  return value.replaceAll("_", " ");
}

export function formatFeatureStatus(value: PlatformFeatureRecord["status"]) {
  return value.replaceAll("_", " ");
}

export function formatFeatureCategory(value: PlatformFeatureRecord["category"]) {
  switch (value) {
    case "core":
      return "Core";
    case "automation":
      return "Automation";
    case "ai":
      return "AI";
    default:
      return value;
  }
}
