/**
 * Shared helpers for grouping and scoring skills.
 *
 * The category names come from the CMS ("Languages", "Frameworks & Tools",
 * "Other Skills", ...) so they are matched by keyword instead of an exact
 * string, otherwise every category silently ends up empty.
 */

export type SkillGroup = "language" | "framework" | "other";

export interface SkillLike {
  id?: string | number;
  name: string;
  category?: string | null;
  percentage?: number | null;
  calculatedPercentage?: number | null;
  projectCount?: number | null;
}

export interface ProjectLike {
  skillNames?: string[] | null;
}

/** Maps a free-form category name to one of the three groups. */
export function skillGroup(category?: string | null): SkillGroup | null {
  const value = (category ?? "").trim().toLowerCase();
  if (!value) return null;

  if (value.includes("language") || value.includes("bahasa")) return "language";
  if (value.includes("framework") || value.includes("library")) return "framework";
  if (value.includes("tool") || value.includes("library")) return "framework";
  if (value.includes("other") || value.includes("custom") || value.includes("additional")) return "other";

  return null;
}

/** How many projects use this skill (1 project = 20%, 5+ = 100%). */
export function projectUsagePercentage(skillName: string, projects: ProjectLike[] = []): number {
  const used = projects.filter((project) =>
    (project.skillNames ?? []).some((name) => name.toLowerCase() === skillName.toLowerCase()),
  ).length;

  return Math.min(used * 20, 100);
}

/**
 * Percentage shown in the UI.
 *
 * Project usage is the source of truth, but when a skill is not linked to any
 * project yet the manually configured percentage is used instead of hiding the
 * skill completely.
 */
export function resolveSkillPercentage(skill: SkillLike, projects: ProjectLike[] = []): number {
  const usage = projectUsagePercentage(skill.name, projects);
  if (usage > 0) return usage;

  if ((skill.projectCount ?? 0) > 0 && (skill.calculatedPercentage ?? 0) > 0) {
    return skill.calculatedPercentage as number;
  }

  return Math.max(skill.percentage ?? 0, 0);
}

/** Skills that should be displayed (a skill is hidden only when it has no value at all). */
export function visibleSkills<T extends SkillLike>(skills: T[], projects: ProjectLike[] = []): T[] {
  return skills.filter((skill) => resolveSkillPercentage(skill, projects) > 0);
}

/** Groups skills into the three sections used across the public pages. */
export function groupSkills<T extends SkillLike>(skills: T[], projects: ProjectLike[] = []) {
  const visible = visibleSkills(skills, projects);

  return {
    languages: visible.filter((skill) => skillGroup(skill.category) === "language"),
    frameworks: visible.filter((skill) => skillGroup(skill.category) === "framework"),
    others: visible.filter((skill) => skillGroup(skill.category) === "other"),
    ungrouped: visible.filter((skill) => skillGroup(skill.category) === null),
  };
}

/** A project counts as full-stack when it uses a language, a framework and an extra skill. */
export function isFullStackProject(projectSkills: string[] = [], skills: SkillLike[] = []): boolean {
  const groups = new Set<SkillGroup>();

  for (const name of projectSkills) {
    const skill = skills.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const group = skillGroup(skill?.category);
    if (group) groups.add(group);
  }

  return groups.has("language") && groups.has("framework") && groups.has("other");
}
