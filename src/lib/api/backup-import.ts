import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const REQUIRED_SECTIONS = ["projects", "skills", "experiences", "certificates", "settings", "inquiries"];

type Row = Record<string, unknown>;

const str = (value: unknown): string | null => (value === null || value === undefined ? null : String(value));
const num = (value: unknown): number | null =>
  value === null || value === undefined || value === "" ? null : Number(value);
const bool = (value: unknown): boolean => value === true || value === 1 || value === "1" || value === "true";
const date = (value: unknown): Date | null => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const jsonOrNull = (value: unknown): Prisma.InputJsonValue | undefined =>
  value === null || value === undefined ? undefined : (value as Prisma.InputJsonValue);

export class BackupFormatError extends Error {}

/** Validates the backup envelope (same rules as the Laravel endpoint). */
export function parseBackupPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object" || !("version" in (data as object))) {
    throw new BackupFormatError("Invalid backup file");
  }

  const payload = data as Record<string, unknown>;

  for (const section of REQUIRED_SECTIONS) {
    if (!Array.isArray(payload[section])) {
      throw new BackupFormatError(`Invalid backup file: missing or invalid '${section}' field`);
    }
  }

  return payload;
}

/**
 * Replaces the content tables with the contents of a backup file.
 * Works with files produced by the Laravel backend as well as this one.
 *
 * Uses a batch transaction (not an interactive one) so it also works with
 * transaction-mode connection poolers such as Neon's pooled endpoint.
 */
export async function importBackupData(data: Record<string, unknown>): Promise<void> {
  const projects = data.projects as Row[];
  const skills = data.skills as Row[];
  const experiences = data.experiences as Row[];
  const certificates = data.certificates as Row[];
  const settings = data.settings as Row[];
  const inquiries = data.inquiries as Row[];
  const projectImages = (data.project_images as Row[] | undefined) ?? [];
  const replies = (data.replies as Row[] | undefined) ?? [];
  const projectSkill = (data.project_skill as Row[] | undefined) ?? [];

  const operations: Prisma.PrismaPromise<unknown>[] = [
    prisma.projectImage.deleteMany(),
    prisma.projectSkill.deleteMany(),
    prisma.reply.deleteMany(),
    prisma.project.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.experience.deleteMany(),
    prisma.certificate.deleteMany(),
    prisma.inquiry.deleteMany(),
    prisma.setting.deleteMany(),
  ];

  if (skills.length > 0) {
    operations.push(
      prisma.skill.createMany({
        data: skills.map((row) => ({
          id: num(row.id) ?? undefined,
          name: String(row.name ?? ""),
          category: String(row.category ?? ""),
          percentage: num(row.percentage) ?? 0,
          showOnHome: bool(row.show_on_home),
          calculatedPercentage: num(row.calculated_percentage),
          projectCount: num(row.project_count),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (projects.length > 0) {
    operations.push(
      prisma.project.createMany({
        data: projects.map((row) => ({
          id: num(row.id) ?? undefined,
          title: String(row.title ?? ""),
          slug: String(row.slug ?? ""),
          description: String(row.description ?? ""),
          longDescription: str(row.long_description),
          projectRole: str(row.project_role),
          problem: str(row.problem),
          solution: str(row.solution),
          keyFeatures: jsonOrNull(row.key_features) as Prisma.InputJsonValue | undefined,
          impact: str(row.impact),
          tools: jsonOrNull(row.tools) as Prisma.InputJsonValue | undefined,
          category: str(row.category),
          status: str(row.status) ?? "draft",
          thumbnail: str(row.thumbnail),
          demoUrl: str(row.demo_url),
          githubUrl: str(row.github_url),
          featured: bool(row.featured),
          startDate: date(row.start_date),
          endDate: date(row.end_date),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (projectImages.length > 0) {
    operations.push(
      prisma.projectImage.createMany({
        data: projectImages.map((row) => ({
          id: num(row.id) ?? undefined,
          projectId: num(row.project_id) ?? 0,
          image: String(row.image ?? ""),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (projectSkill.length > 0) {
    operations.push(
      prisma.projectSkill.createMany({
        data: projectSkill.map((row) => ({
          projectId: num(row.project_id) ?? 0,
          skillId: num(row.skill_id) ?? 0,
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (experiences.length > 0) {
    operations.push(
      prisma.experience.createMany({
        data: experiences.map((row) => ({
          id: num(row.id) ?? undefined,
          company: String(row.company ?? ""),
          position: String(row.position ?? ""),
          description: String(row.description ?? ""),
          startDate: date(row.start_date) ?? new Date(),
          endDate: date(row.end_date),
          isCurrent: bool(row.is_current),
          certificate: str(row.certificate),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (certificates.length > 0) {
    operations.push(
      prisma.certificate.createMany({
        data: certificates.map((row) => ({
          id: num(row.id) ?? undefined,
          title: String(row.title ?? ""),
          issuer: String(row.issuer ?? ""),
          description: str(row.description),
          date: date(row.date),
          expiresDate: date(row.expires_date),
          credentialUrl: str(row.credential_url),
          image: str(row.image),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (settings.length > 0) {
    operations.push(
      prisma.setting.createMany({
        data: settings.map((row) => ({
          id: num(row.id) ?? undefined,
          siteName: str(row.site_name) ?? "Portofolio Owner",
          tagline: str(row.tagline),
          name: str(row.name),
          title: str(row.title),
          email: str(row.email),
          whatsapp: str(row.whatsapp),
          bio: str(row.bio),
          aboutMe: str(row.about_me),
          profileImage: str(row.profile_image),
          resume: str(row.resume),
          github: str(row.github),
          linkedin: str(row.linkedin),
          instagram: str(row.instagram),
          completedProjects: num(row.completed_projects) ?? 0,
          techStackCount: num(row.tech_stack_count) ?? 0,
          gpa: str(row.gpa),
          autoUpdateSkillBadges:
            row.auto_update_skill_badges === undefined ? true : bool(row.auto_update_skill_badges),
          showLearningCurve: row.show_learning_curve === undefined ? true : bool(row.show_learning_curve),
          showGithubActivity: row.show_github_activity === undefined ? true : bool(row.show_github_activity),
          metaTitle: str(row.meta_title),
          metaDescription: str(row.meta_description),
          metaKeywords: str(row.meta_keywords),
          ogTitle: str(row.og_title),
          ogDescription: str(row.og_description),
          ogImage: str(row.og_image),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (inquiries.length > 0) {
    operations.push(
      prisma.inquiry.createMany({
        data: inquiries.map((row) => ({
          id: num(row.id) ?? undefined,
          name: String(row.name ?? ""),
          email: String(row.email ?? ""),
          subject: str(row.subject) ?? "Website Inquiry",
          category: str(row.category) ?? "General",
          message: String(row.message ?? ""),
          isRead: bool(row.is_read),
          isReplied: bool(row.is_replied),
        })),
        skipDuplicates: true,
      }),
    );
  }

  if (replies.length > 0) {
    operations.push(
      prisma.reply.createMany({
        data: replies.map((row) => ({
          id: num(row.id) ?? undefined,
          inquiryId: num(row.inquiry_id) ?? 0,
          message: String(row.message ?? ""),
          sentAt: date(row.sent_at),
        })),
        skipDuplicates: true,
      }),
    );
  }

  await prisma.$transaction(operations);

  await resetSequences();
}

/**
 * Tables whose `id` column is a serial.
 *
 * Importing rows with explicit ids does not advance the Postgres sequence, so
 * the next insert would collide with an existing id. This resets every
 * sequence to `max(id) + 1`.
 */
const SERIAL_TABLES = [
  "users",
  "api_tokens",
  "projects",
  "project_images",
  "skills",
  "experiences",
  "certificates",
  "inquiries",
  "replies",
  "settings",
  "analytics",
];

export async function resetSequences(): Promise<void> {
  for (const table of SERIAL_TABLES) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`,
    );
  }
}
