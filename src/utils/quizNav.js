// src/utils/quizNav.js
export function buildStartRandomQuery(parentSlug, {
  includeDescendants = true,
  difficulty,
  aircraftCsv,
  strictAircraft,
  limit = 20,
} = {}) {
  const qs = new URLSearchParams();
  qs.set("category_slug", parentSlug);
  if (includeDescendants) qs.set("include_descendants", "1");
  if (difficulty) qs.set("difficulty", difficulty);
  if (aircraftCsv) qs.set("aircraft", aircraftCsv);
  if (strictAircraft) qs.set("strict_aircraft", "1");
  qs.set("limit", String(limit));
  return qs.toString();
}

export function buildPracticeQuery(parentSlug, childSlug, {
  difficulty,
  aircraftCsv,
  strictAircraft,
  limit = 20,
} = {}) {
  const qs = new URLSearchParams();
  qs.set("category_slug", childSlug);
  qs.set("parent_slug", parentSlug); // <— disambiguasi child
  if (difficulty) qs.set("difficulty", difficulty);
  if (aircraftCsv) qs.set("aircraft", aircraftCsv);
  if (strictAircraft) qs.set("strict_aircraft", "1");
  qs.set("limit", String(limit));
  return qs.toString();
}
