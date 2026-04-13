import { Visa, VisaReviewStatus, VisaSource } from "@/lib/types";

type VisaCandidate = Omit<Visa, "source"> & {
  source?: Partial<VisaSource> | null;
};

const reviewStatusLabels: Record<VisaReviewStatus, string> = {
  pending_source: "Source pending",
  needs_review: "Needs review",
  reviewed: "Reviewed",
  stale: "Review stale",
};

export function createPendingVisaSource(
  overrides: Partial<VisaSource> = {}
): VisaSource {
  return {
    authorityName: "",
    officialUrl: "",
    lastReviewedAt: "",
    reviewStatus: "pending_source",
    reviewNotes: "",
    ...overrides,
  };
}

export function normalizeVisaSource(
  source?: Partial<VisaSource> | null
): VisaSource {
  return createPendingVisaSource(source ?? {});
}

export function normalizeVisa(visa: VisaCandidate): Visa {
  return {
    ...visa,
    source: normalizeVisaSource(visa.source),
  };
}

export function getVisaReviewStatusLabel(status: VisaReviewStatus) {
  return reviewStatusLabels[status];
}
