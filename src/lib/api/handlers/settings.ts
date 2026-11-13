import { prisma } from "../prisma";
import { Prisma } from "@prisma/client";
import { field, file, json } from "../http";
import { ApiError } from "../errors";
import { Validator } from "../validate";
import { serializeSettings } from "../serialize";
import { deleteFromCloudinary, uploadToCloudinary } from "../cloudinary";
import { assertUploadSize } from "../upload";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

const DEFAULT_SETTINGS = {
  siteName: "Portofolio Owner",
  tagline: "Informatics Student",
  name: "Portofolio Owner",
  title: "Informatics Student",
  email: "",
  whatsapp: "",
  bio: "",
  aboutMe:
    "Aku Deva, mahasiswa Informatika yang antusias dalam pengembangan web, Internet of Things, dan pengolahan data. Aku suka eksplor teknologi baru dan membangun project yang bukan cuma terlihat rapi, tapi juga punya alur yang jelas di belakangnya.",
  github: "",
  linkedin: "",
  instagram: "",
  completedProjects: 0,
  techStackCount: 0,
  gpa: "",
  autoUpdateSkillBadges: true,
  showLearningCurve: true,
  showGithubActivity: true,
} satisfies Prisma.SettingUncheckedCreateInput;

/** Accepts both `auto_update_skill_badges` and `autoUpdateSkillBadges`. */
function pick(ctx: Ctx, ...names: string[]): unknown {
  for (const name of names) {
    const value = field(ctx, name);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

async function getOrCreateSettings() {
  const existing = await prisma.setting.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return prisma.setting.create({ data: DEFAULT_SETTINGS });
}

async function index(): Promise<Response> {
  const settings = await getOrCreateSettings();
  return json({ data: serializeSettings(settings) });
}

async function resume(): Promise<Response> {
  const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });

  if (!settings?.resume) {
    return json({ message: "Resume not found" }, 404);
  }

  if (settings.resume.startsWith("http")) {
    return Response.redirect(settings.resume, 302);
  }

  return json({ message: "Resume file missing" }, 404);
}

async function profileImage(): Promise<Response> {
  const settings = await prisma.setting.findFirst({ orderBy: { id: "asc" } });

  if (!settings?.profileImage) {
    return json({ message: "Profile image not found" }, 404);
  }

  if (settings.profileImage.startsWith("http")) {
    return Response.redirect(settings.profileImage, 302);
  }

  return json({ message: "Profile image file missing" }, 404);
}

async function show(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const setting = Number.isInteger(id) ? await prisma.setting.findUnique({ where: { id } }) : null;

  if (!setting) {
    throw ApiError.notFound();
  }

  return json({ data: setting });
}

async function store(ctx: Ctx): Promise<Response> {
  const validated = await new Validator(ctx.body)
    .required("name")
    .string("name", { max: 255 })
    .string("title", { max: 255, nullable: true })
    .email("email", { max: 255, nullable: true })
    .string("whatsapp", { max: 255, nullable: true })
    .string("bio", { nullable: true })
    .string("about_me", { nullable: true })
    .string("gpa", { max: 10, nullable: true })
    .url("github", { nullable: true })
    .url("linkedin", { nullable: true })
    .url("instagram", { nullable: true })
    .integer("completed_projects", { min: 0, nullable: true })
    .integer("tech_stack_count", { min: 0, nullable: true })
    .boolean("auto_update_skill_badges", { nullable: true })
    .boolean("show_learning_curve", { nullable: true })
    .boolean("show_github_activity", { nullable: true })
    .string("site_name", { max: 255, nullable: true })
    .string("tagline", { max: 255, nullable: true })
    .string("meta_title", { max: 255, nullable: true })
    .string("meta_description", { nullable: true })
    .string("meta_keywords", { nullable: true })
    .string("og_title", { max: 255, nullable: true })
    .string("og_description", { nullable: true })
    .validate();

  const profileFile = file(ctx, "profile_image");
  const resumeFile = file(ctx, "resume");
  const ogFile = file(ctx, "og_image");

  if (profileFile) assertUploadSize(profileFile, "profile_image");
  if (resumeFile) assertUploadSize(resumeFile, "resume");
  if (ogFile) assertUploadSize(ogFile, "og_image");

  const setting = await prisma.setting.create({
    data: {
      name: String(validated.name),
      title: (validated.title as string | null) ?? null,
      email: (validated.email as string | null) ?? null,
      whatsapp: (validated.whatsapp as string | null) ?? null,
      bio: (validated.bio as string | null) ?? null,
      aboutMe: (validated.about_me as string | null) ?? null,
      gpa: (validated.gpa as string | null) ?? null,
      github: (validated.github as string | null) ?? null,
      linkedin: (validated.linkedin as string | null) ?? null,
      instagram: (validated.instagram as string | null) ?? null,
      completedProjects: Number(validated.completed_projects ?? 0),
      techStackCount: Number(validated.tech_stack_count ?? 0),
      autoUpdateSkillBadges: Boolean(validated.auto_update_skill_badges ?? true),
      showLearningCurve: Boolean(validated.show_learning_curve ?? true),
      showGithubActivity: Boolean(validated.show_github_activity ?? true),
      siteName: (validated.site_name as string | null) ?? String(validated.name),
      tagline: (validated.tagline as string | null) ?? null,
      metaTitle: (validated.meta_title as string | null) ?? null,
      metaDescription: (validated.meta_description as string | null) ?? null,
      metaKeywords: (validated.meta_keywords as string | null) ?? null,
      ogTitle: (validated.og_title as string | null) ?? null,
      ogDescription: (validated.og_description as string | null) ?? null,
      profileImage: profileFile ? await uploadToCloudinary(profileFile, "settings/profile") : null,
      resume: resumeFile ? await uploadToCloudinary(resumeFile, "settings/resume") : null,
      ogImage: ogFile ? await uploadToCloudinary(ogFile, "settings/seo") : null,
    },
  });

  return json({ message: "Settings created successfully", data: serializeSettings(setting) }, 201);
}

async function update(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const setting = Number.isInteger(id) ? await prisma.setting.findUnique({ where: { id } }) : null;

  if (!setting) {
    throw ApiError.notFound();
  }

  const validated = await new Validator(ctx.body)
    .required("name")
    .string("name", { max: 255 })
    .string("title", { max: 255, nullable: true })
    .email("email", { max: 255, nullable: true })
    .string("whatsapp", { max: 255, nullable: true })
    .string("bio", { nullable: true })
    .string("about_me", { nullable: true })
    .string("gpa", { max: 10, nullable: true })
    .url("github", { nullable: true })
    .url("linkedin", { nullable: true })
    .url("instagram", { nullable: true })
    .integer("completed_projects", { min: 0, nullable: true })
    .integer("tech_stack_count", { min: 0, nullable: true })
    .boolean("auto_update_skill_badges", { nullable: true })
    .boolean("show_learning_curve", { nullable: true })
    .boolean("show_github_activity", { nullable: true })
    .string("site_name", { max: 255, nullable: true })
    .string("tagline", { max: 255, nullable: true })
    .string("meta_title", { max: 255, nullable: true })
    .string("meta_description", { nullable: true })
    .string("meta_keywords", { nullable: true })
    .string("og_title", { max: 255, nullable: true })
    .string("og_description", { nullable: true })
    .validate();

  const data: Prisma.SettingUpdateInput = {
    name: String(validated.name),
    title: (validated.title as string | null) ?? null,
    email: (validated.email as string | null) ?? null,
    whatsapp: (validated.whatsapp as string | null) ?? null,
    bio: (validated.bio as string | null) ?? null,
    aboutMe: (validated.about_me as string | null) ?? null,
    gpa: (validated.gpa as string | null) ?? null,
    github: (validated.github as string | null) ?? null,
    linkedin: (validated.linkedin as string | null) ?? null,
    instagram: (validated.instagram as string | null) ?? null,
    completedProjects: Number(validated.completed_projects ?? setting.completedProjects),
    techStackCount: Number(validated.tech_stack_count ?? setting.techStackCount),
    autoUpdateSkillBadges: Boolean(validated.auto_update_skill_badges ?? setting.autoUpdateSkillBadges),
    showLearningCurve: Boolean(validated.show_learning_curve ?? setting.showLearningCurve),
    showGithubActivity: Boolean(validated.show_github_activity ?? setting.showGithubActivity),
    siteName: (validated.site_name as string | null) ?? setting.siteName,
    tagline: (validated.tagline as string | null) ?? null,
    metaTitle: (validated.meta_title as string | null) ?? null,
    metaDescription: (validated.meta_description as string | null) ?? null,
    metaKeywords: (validated.meta_keywords as string | null) ?? null,
    ogTitle: (validated.og_title as string | null) ?? null,
    ogDescription: (validated.og_description as string | null) ?? null,
  };

  // camelCase aliases used by the admin panel.
  const aliasMetaTitle = pick(ctx, "metaTitle");
  if (aliasMetaTitle !== undefined) data.metaTitle = String(aliasMetaTitle);
  const aliasMetaDescription = pick(ctx, "metaDescription");
  if (aliasMetaDescription !== undefined) data.metaDescription = String(aliasMetaDescription);
  const aliasMetaKeywords = pick(ctx, "metaKeywords");
  if (aliasMetaKeywords !== undefined) data.metaKeywords = String(aliasMetaKeywords);
  const aliasOgTitle = pick(ctx, "ogTitle");
  if (aliasOgTitle !== undefined) data.ogTitle = String(aliasOgTitle);
  const aliasOgDescription = pick(ctx, "ogDescription");
  if (aliasOgDescription !== undefined) data.ogDescription = String(aliasOgDescription);
  const aliasAboutMe = pick(ctx, "aboutMe");
  if (aliasAboutMe !== undefined) data.aboutMe = String(aliasAboutMe);

  // Profile image: a file replaces the old asset, a plain URL is stored as-is.
  const profileFile = file(ctx, "profile_image");
  if (profileFile) {
    assertUploadSize(profileFile, "profile_image");
    if (setting.profileImage) {
      await deleteFromCloudinary(setting.profileImage);
    }
    data.profileImage = await uploadToCloudinary(profileFile, "settings/profile");
  } else {
    const profileUrl = pick(ctx, "profile_image");
    if (profileUrl !== undefined) {
      data.profileImage = String(profileUrl);
    }
  }

  // Resume: only a new file replaces the current one (matches the Laravel API).
  const resumeFile = file(ctx, "resume");
  if (resumeFile) {
    assertUploadSize(resumeFile, "resume");
    if (setting.resume) {
      await deleteFromCloudinary(setting.resume);
    }
    data.resume = await uploadToCloudinary(resumeFile, "settings/resume");
  }

  const ogFile = file(ctx, "og_image");
  if (ogFile) {
    assertUploadSize(ogFile, "og_image");
    if (setting.ogImage) {
      await deleteFromCloudinary(setting.ogImage);
    }
    data.ogImage = await uploadToCloudinary(ogFile, "settings/seo");
  } else {
    const ogUrl = pick(ctx, "og_image");
    if (ogUrl !== undefined) {
      data.ogImage = String(ogUrl);
    }
  }

  const updated = await prisma.setting.update({ where: { id: setting.id }, data });

  return json({ message: "Settings updated successfully", data: serializeSettings(updated) });
}

async function destroy(ctx: Ctx): Promise<Response> {
  const id = Number.parseInt(ctx.params.id ?? "", 10);
  const setting = Number.isInteger(id) ? await prisma.setting.findUnique({ where: { id } }) : null;

  if (!setting) {
    throw ApiError.notFound();
  }

  await deleteFromCloudinary(setting.profileImage);
  await deleteFromCloudinary(setting.resume);
  await deleteFromCloudinary(setting.ogImage);

  await prisma.setting.delete({ where: { id: setting.id } });

  return json({ message: "Settings deleted successfully" });
}

/**
 * Legacy route kept for compatibility with the Laravel backend.
 * Files used to live on the local `public` disk; everything is on Cloudinary now.
 */
async function legacyStorage(): Promise<Response> {
  return json({ message: "File not found" }, 404);
}

export const settingRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "settings", handler: index },
  { method: "GET", pattern: "storage/*", handler: legacyStorage },
  { method: "GET", pattern: "resume", handler: resume },
  { method: "GET", pattern: "profile-image", handler: profileImage },
  { method: "GET", pattern: "admin/settings", handler: index, auth: true },
  { method: "GET", pattern: "admin/settings/:id", handler: show, auth: true },
  { method: "POST", pattern: "admin/settings", handler: store, auth: true },
  { method: "PUT", pattern: "admin/settings/:id", handler: update, auth: true },
  { method: "PATCH", pattern: "admin/settings/:id", handler: update, auth: true },
  { method: "DELETE", pattern: "admin/settings/:id", handler: destroy, auth: true },
];
