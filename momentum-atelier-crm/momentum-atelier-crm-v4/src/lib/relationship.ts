// Relationship scoring: a transparent heuristic built from data that actually
// exists in this database — how recently you last engaged, how often you
// engage, and how much revenue is tied to the relationship. This is not an
// AI-derived score; it's arithmetic over real rows, which makes it
// explainable and trustworthy rather than a black box.

export type RelationshipTier = "strong" | "warm" | "cooling" | "cold";

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const time = new Date(dateStr).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / (1000 * 60 * 60 * 24));
}

export function computeRelationshipScore(params: {
  activityDates: (string | null | undefined)[];
  openOpportunityValue?: number;
  wonOpportunityValue?: number;
}): number {
  const { activityDates, openOpportunityValue = 0, wonOpportunityValue = 0 } = params;

  const timestamps = activityDates
    .map((d) => (d ? new Date(d).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));

  // Up to 40 points for how often you engage (capped so a handful of
  // meaningful touches matters more than raw volume).
  const frequencyScore = Math.min(timestamps.length * 4, 40);

  // Up to 40 points for how recently you last engaged.
  let recencyScore = 0;
  if (timestamps.length > 0) {
    const mostRecentDaysAgo = (Date.now() - Math.max(...timestamps)) / (1000 * 60 * 60 * 24);
    if (mostRecentDaysAgo <= 7) recencyScore = 40;
    else if (mostRecentDaysAgo <= 30) recencyScore = 30;
    else if (mostRecentDaysAgo <= 90) recencyScore = 15;
    else recencyScore = 5;
  }

  // Up to 20 points for revenue tied to the relationship (open pipeline
  // counts less than closed-won, since won revenue is proven, not projected).
  const valueScore = Math.min(
    Math.round((openOpportunityValue / 50000) * 10 + (wonOpportunityValue / 50000) * 10),
    20
  );

  return Math.max(0, Math.min(100, Math.round(frequencyScore + recencyScore + valueScore)));
}

export function scoreTier(score: number): RelationshipTier {
  if (score >= 75) return "strong";
  if (score >= 50) return "warm";
  if (score >= 25) return "cooling";
  return "cold";
}

export const TIER_LABEL: Record<RelationshipTier, string> = {
  strong: "Strong",
  warm: "Warm",
  cooling: "Cooling",
  cold: "Needs attention",
};

export const TIER_DOT: Record<RelationshipTier, string> = {
  strong: "bg-emerald-600",
  warm: "bg-brass-500",
  cooling: "bg-bronze-500",
  cold: "bg-clay-500",
};

export const TIER_BADGE: Record<RelationshipTier, string> = {
  strong: "bg-emerald-600/12 text-emerald-700",
  warm: "bg-brass-500/12 text-brass-600",
  cooling: "bg-bronze-500/15 text-bronze-600",
  cold: "bg-clay-500/12 text-clay-600",
};
