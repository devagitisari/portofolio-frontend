import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { asArray, field, file, files, json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeProject } from "../serialize";
import { deleteFromCloudinary, uploadToCloudinary } from "../cloudinary";
import { assertUploadSize, LARAVEL_IMAGE_LIMIT_BYTES } from "../upload";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

/** Port of Laravel's `Str::slug()`. */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function validateSkillIds(raw: unknown): Promise<number[]> {
  const ids = asArray(raw)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (ids.length === 0) return [];

  const existing = await prisma.skill.findMany({ where: { id: { in: ids } }, select: { id: true } });

  if (existing.length !== ids.length) {
    throw ApiError.validation("The selected skill_ids.0 is invalid.", {
      "skill_ids.0": ["The selected skill_ids.0 is invalid."],
    });
  }

  return ids;
}

async function syncSkills(projectId: number, skillIds: number[]) {
  await prisma.projectSkill.deleteMany({ where: { projectId } });
  if (skillIds.length > 0) {
    await prisma.projectSkill.createMany({
      data: skillIds.map((skillId) => ({ projectId, skillId })),
      skipDuplicates: true,
    });
  }
}

async function index(): Promise<Response> {
  const projects = await prisma.project.findMany({
    where: { status: "published" },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: { images: true, projectSkills: { include: { skill: true } } },
  });

  // Laravel wraps resource collections in a `data` key — keep the same shape.
  return json({ data: projects.map((project) => serializeProject(project)) });
}

async function show(ctx: Ctx): Promise<Response> {
  const slug = ctx.params.slug ?? "";

  const project = await prisma.project.findFirst({
    where: { slug, status: "published" },
    include: { images: true, projectSkills: { include: { skill: true } } },
  });

  if (!project) {
    throw ApiError.notFound();
  }

  return json({ data: serializeProject(project) });
}

async function store(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("title")
    .string("title", { max: 255 })
    .string("slug", { max: 255, nullable: true })
    .required("description")
    .string("description")
    .string("long_description", { nullable: true })
    .string("project_role", { max: 255, nullable: true })
    .string("problem", { nullable: true })
    .string("solution", { nullable: true })
    .array("key_features", { nullable: true })
    .string("category", { max: 255, nullable: true })
    .string("impact", { nullable: true })
    .string("status", { nullable: true })
    .in("status", ["draft", "published"], { nullable: true })
    .url("demo_url", { nullable: true })
    .url("github_url", { nullable: true })
    .boolean("featured", { nullable: true })
    .date("start_date", { nullable: true })
    .date("end_date", { nullable: true })
    .array("image_urls", { nullable: true })
    .present("thumbnail")
    .validate();

  const slugInput = typeof validated.slug === "string" && validated.slug ? validated.slug : slugify(String(validated.title));

  const duplicate = await prisma.project.findUnique({ where: { slug: slugInput } });
  if (duplicate) {
    throw ApiError.validation("The slug has already been taken.", {
      slug: ["The slug has already been taken."],
    });
  }

  const skillIds = await validateSkillIds(field(ctx, "skill_ids"));
  const imageUrls = asArray(field(ctx, "image_urls")).map(String).filter(Boolean);
  const uploadedImages = files(ctx, "images");

  let thumbnail = typeof validated.thumbnail === "string" ? validated.thumbnail : null;

  const thumbnailFile = file(ctx, "thumbnail");
  if (thumbnailFile) {
    assertUploadSize(thumbnailFile, "thumbnail", LARAVEL_IMAGE_LIMIT_BYTES);
    thumbnail = await uploadToCloudinary(thumbnailFile, "projects/thumbnails");
  }

  const project = await prisma.project.create({
    data: {
      title: String(validated.title),
      slug: slugInput,
      description: String(validated.description),
      longDescription: (validated.long_description as string | null) ?? null,
      projectRole: (validated.project_role as string | null) ?? null,
      problem: (validated.problem as string | null) ?? null,
      solution: (validated.solution as string | null) ?? null,
      keyFeatures: (validated.key_features as string[] | undefined) ?? [],
      impact: (validated.impact as string | null) ?? null,
      category: (validated.category as string | null) ?? null,
      status: (validated.status as string | undefined) ?? "draft",
      thumbnail,
      demoUrl: (validated.demo_url as string | null) ?? null,
      githubUrl: (validated.github_url as string | null) ?? null,
      featured: Boolean(validated.featured ?? false),
      startDate: (validated.start_date as Date | null) ?? null,
      endDate: (validated.end_date as Date | null) ?? null,
    },
  });

  await syncSkills(project.id, skillIds);

  for (const url of imageUrls) {
    await prisma.projectImage.create({ data: { projectId: project.id, image: url } });
  }

  for (const image of uploadedImages) {
    assertUploadSize(image, "images.0", LARAVEL_IMAGE_LIMIT_BYTES);
    const path = await uploadToCloudinary(image, "projects/images");
    if (path) {
      await prisma.projectImage.create({ data: { projectId: project.id, image: path } });
    }
  }

  const fresh = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { images: true, projectSkills: { include: { skill: true } } },
  });

  return json({ message: "Project created successfully", data: serializeProject(fresh) }, 201);
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const project = Number.isInteger(id)
    ? await prisma.project.findUnique({ where: { id }, include: { images: true } })
    : null;

  if (!project) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .required("title")
    .string("title", { max: 255 })
    .string("slug", { max: 255, nullable: true })
    .required("description")
    .string("description")
    .string("long_description", { nullable: true })
    .string("project_role", { max: 255, nullable: true })
    .string("problem", { nullable: true })
    .string("solution", { nullable: true })
    .array("key_features", { nullable: true })
    .string("category", { max: 255, nullable: true })
    .string("impact", { nullable: true })
    .string("status", { nullable: true })
    .in("status", ["draft", "published"], { nullable: true })
    .url("demo_url", { nullable: true })
    .url("github_url", { nullable: true })
    .boolean("featured", { nullable: true })
    .date("start_date", { nullable: true })
    .date("end_date", { nullable: true })
    .array("image_urls", { nullable: true })
    .validate();

  if (validated.slug) {
    const duplicate = await prisma.project.findFirst({ where: { slug: String(validated.slug), id: { not: project.id } } });
    if (duplicate) {
      throw ApiError.validation("The slug has already been taken.", {
        slug: ["The slug has already been taken."],
      });
    }
  }

  const hasSkillIds = field(ctx, "skill_ids") !== undefined;
  const skillIds = hasSkillIds ? await validateSkillIds(field(ctx, "skill_ids")) : null;

  const imageUrls = asArray(field(ctx, "image_urls")).map(String).filter(Boolean);
  const deletedImageIds = asArray(field(ctx, "deleted_image_ids"))
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value));

  const data: Prisma.ProjectUpdateInput = {
    title: String(validated.title),
    slug: (validated.slug as string | undefined) || project.slug,
    description: String(validated.description),
    longDescription: (validated.long_description as string | null) ?? null,
    projectRole: (validated.project_role as string | null) ?? null,
    problem: (validated.problem as string | null) ?? null,
    solution: (validated.solution as string | null) ?? null,
    keyFeatures: (validated.key_features as string[] | undefined) ?? [],
    impact: (validated.impact as string | null) ?? null,
    category: (validated.category as string | null) ?? null,
    status: (validated.status as string | undefined) ?? project.status,
    demoUrl: (validated.demo_url as string | null) ?? null,
    githubUrl: (validated.github_url as string | null) ?? null,
    featured: Boolean(validated.featured ?? false),
    startDate: (validated.start_date as Date | null) ?? null,
    endDate: (validated.end_date as Date | null) ?? null,
  };

  const thumbnailFile = file(ctx, "thumbnail");
  if (thumbnailFile) {
    assertUploadSize(thumbnailFile, "thumbnail", LARAVEL_IMAGE_LIMIT_BYTES);
    if (project.thumbnail) {
      await deleteFromCloudinary(project.thumbnail);
    }
    data.thumbnail = await uploadToCloudinary(thumbnailFile, "projects/thumbnails");
  }

  await prisma.project.update({ where: { id: project.id }, data });

  if (deletedImageIds.length > 0) {
    const images = await prisma.projectImage.findMany({
      where: { id: { in: deletedImageIds }, projectId: project.id },
    });

    for (const image of images) {
      await deleteFromCloudinary(image.image);
      await prisma.projectImage.delete({ where: { id: image.id } });
    }
  }

  if (skillIds !== null) {
    await syncSkills(project.id, skillIds);
  }

  for (const url of imageUrls) {
    await prisma.projectImage.create({ data: { projectId: project.id, image: url } });
  }

  for (const image of files(ctx, "images")) {
    assertUploadSize(image, "images.0", LARAVEL_IMAGE_LIMIT_BYTES);
    const path = await uploadToCloudinary(image, "projects/images");
    if (path) {
      await prisma.projectImage.create({ data: { projectId: project.id, image: path } });
    }
  }

  const fresh = await prisma.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { images: true, projectSkills: { include: { skill: true } } },
  });

  return json({ message: "Project updated successfully", data: serializeProject(fresh) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const project = Number.isInteger(id)
    ? await prisma.project.findUnique({ where: { id }, include: { images: true } })
    : null;

  if (!project) {
    throw ApiError.notFound();
  }

  if (project.thumbnail) {
    await deleteFromCloudinary(project.thumbnail);
  }

  for (const image of project.images) {
    await deleteFromCloudinary(image.image);
  }

  await prisma.project.delete({ where: { id: project.id } });

  return json({ message: "Project deleted successfully" });
}

export const projectRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "projects", handler: index },
  { method: "GET", pattern: "projects/:slug", handler: show },
  { method: "POST", pattern: "admin/projects", handler: store, auth: true },
  { method: "PUT", pattern: "admin/projects/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/projects/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/projects/:id", handler: destroy, auth: true },
];
