/** Suggestions for the Occupation box on sign-up; people can type anything else. */
export const OCCUPATIONS = [
  "Land Surveyor",
  "Cadastral Surveyor",
  "Party Chief",
  "Civil Engineer",
  "Site Engineer",
  "GIS Specialist",
  "UAV / Drone Operator",
  "Survey Technician",
  "Contractor",
  "Architect",
  "Student",
];

export const OCCUPATION_MAX = 60;

/**
 * An occupation as typed, made safe to keep: invisible and control characters removed,
 * spaces collapsed, cut to OCCUPATION_MAX. Empty stays empty.
 */
export function cleanOccupation(v: unknown): string {
  return String(v ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202f\u2060-\u206f\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, OCCUPATION_MAX)
    .trim();
}
