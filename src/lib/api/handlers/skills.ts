import { prisma } from "../prisma";
import { json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeSkill } from "../serialize";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

/**
 * Mirrors the Skill model's accessor: the percentage is derived from how many
 * projects use the skill relative to the total number of projects.
 */
async function accessorPercentage(skillId: number): Promise<{ total: number; used: number }> {
  const [total, used] = await Promise.all([
    prisma.project.count(),
    prisma.projectSkill.count({ where: { skillId } }),
  ]);

  return { total, used };
}

async function index(): Promise<Response> {
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: { projectSkills: { select: { projectId: true } } },
  });

  const counts = skills.map((skill) => skill.projectSkills.length);
  const max = counts.length > 0 ? Math.max(...counts) : 0;

  const data = skills.map((skill, index) => {
    const projectsCount = counts[index] ?? 0;
    const calculated = max > 0 ? Math.round((projectsCount / max) * 100) : 0;

    return serializeSkill({
      ...skill,
      calculatedPercentage: calculated,
      projectCount: projectsCount,
      projects_count: projectsCount,
    });
  });

  // Laravel sorts by projects_count descending within a category.
  data.sort((a, b) => a.category.localeCompare(b.category) || b.project_count - a.project_count || a.name.localeCompare(b.name));

  return json({ data });
}

async function store(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("name")
    .string("name", { max: 255 })
    .required("category")
    .string("category", { max: 255 })
    .required("percentage")
    .integer("percentage", { min: 0, max: 100 })
    .boolean("show_on_home", { nullable: true })
    .validate();

  const skill = await prisma.skill.create({
    data: {
      name: String(validated.name),
      category: String(validated.category),
      percentage: Number(validated.percentage),
      showOnHome: Boolean(validated.show_on_home ?? false),
    },
  });

  const { used } = await accessorPercentage(skill.id);

  const updated = await prisma.skill.update({
    where: { id: skill.id },
    data: {
      calculatedPercentage: Math.min(used * 20, 100),
      projectCount: used,
    },
  });

  return json({ message: "Skill created successfully", data: serializeSkill(updated) }, 201);
}

async function show(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const skill = Number.isInteger(id) ? await prisma.skill.findUnique({ where: { id } }) : null;

  if (!skill) {
    throw ApiError.notFound();
  }

  return json({ data: serializeSkill(skill) });
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const skill = Number.isInteger(id) ? await prisma.skill.findUnique({ where: { id } }) : null;

  if (!skill) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .required("name")
    .string("name", { max: 255 })
    .required("category")
    .string("category", { max: 255 })
    .required("percentage")
    .integer("percentage", { min: 0, max: 100 })
    .boolean("show_on_home", { nullable: true })
    .validate();

  await prisma.skill.update({
    where: { id: skill.id },
    data: {
      name: String(validated.name),
      category: String(validated.category),
      percentage: Number(validated.percentage),
      showOnHome: Boolean(validated.show_on_home ?? false),
    },
  });

  const { used } = await accessorPercentage(skill.id);
  const counts = await prisma.skill.findMany({
    include: { projectSkills: { select: { projectId: true } } },
  });
  const max = counts.length > 0 ? Math.max(...counts.map((item) => item.projectSkills.length)) : 0;

  const updated = await prisma.skill.update({
    where: { id: skill.id },
    data: {
      calculatedPercentage: max > 0 ? Math.round((used / max) * 100) : 0,
      projectCount: used,
    },
  });

  return json({ message: "Skill updated successfully", data: serializeSkill(updated) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const skill = Number.isInteger(id) ? await prisma.skill.findUnique({ where: { id } }) : null;

  if (!skill) {
    throw ApiError.notFound();
  }

  await prisma.skill.delete({ where: { id: skill.id } });

  return json({ message: "Skill deleted successfully" });
}

export const skillRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "skills", handler: index },
  { method: "GET", pattern: "admin/skills", handler: index, auth: true },
  { method: "GET", pattern: "admin/skills/:id", handler: show, auth: true },
  { method: "POST", pattern: "admin/skills", handler: store, auth: true },
  { method: "PUT", pattern: "admin/skills/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/skills/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/skills/:id", handler: destroy, auth: true },
];
