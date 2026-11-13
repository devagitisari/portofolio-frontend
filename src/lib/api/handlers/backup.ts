import { prisma } from "../prisma";
import { file, json } from "../http";
import { ApiError } from "../errors";
import { BackupFormatError, importBackupData, parseBackupPayload } from "../backup-import";
import type { RouteDefinition } from "../router";
import type { Ctx } from "../types";

async function exportBackup(): Promise<Response> {
  const [projects, skills, experiences, certificates, settings, inquiries, projectImages, replies, projectSkill] =
    await Promise.all([
      prisma.project.findMany({ orderBy: { id: "asc" } }),
      prisma.skill.findMany({ orderBy: { id: "asc" } }),
      prisma.experience.findMany({ orderBy: { id: "asc" } }),
      prisma.certificate.findMany({ orderBy: { id: "asc" } }),
      prisma.setting.findMany({ orderBy: { id: "asc" } }),
      prisma.inquiry.findMany({ orderBy: { id: "asc" } }),
      prisma.projectImage.findMany({ orderBy: { id: "asc" } }),
      prisma.reply.findMany({ orderBy: { id: "asc" } }),
      prisma.projectSkill.findMany({ orderBy: [{ projectId: "asc" }, { skillId: "asc" }] }),
    ]);

  const payload = {
    projects: projects.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      long_description: row.longDescription,
      project_role: row.projectRole,
      problem: row.problem,
      solution: row.solution,
      key_features: row.keyFeatures,
      impact: row.impact,
      tools: row.tools,
      category: row.category,
      status: row.status,
      thumbnail: row.thumbnail,
      demo_url: row.demoUrl,
      github_url: row.githubUrl,
      featured: row.featured,
      start_date: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      end_date: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    skills: skills.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      percentage: row.percentage,
      show_on_home: row.showOnHome,
      calculated_percentage: row.calculatedPercentage,
      project_count: row.projectCount,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    experiences: experiences.map((row) => ({
      id: row.id,
      company: row.company,
      position: row.position,
      description: row.description,
      start_date: row.startDate.toISOString().slice(0, 10),
      end_date: row.endDate ? row.endDate.toISOString().slice(0, 10) : null,
      is_current: row.isCurrent,
      certificate: row.certificate,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    certificates: certificates.map((row) => ({
      id: row.id,
      title: row.title,
      issuer: row.issuer,
      description: row.description,
      date: row.date ? row.date.toISOString().slice(0, 10) : null,
      expires_date: row.expiresDate ? row.expiresDate.toISOString().slice(0, 10) : null,
      credential_url: row.credentialUrl,
      image: row.image,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    settings: settings.map((row) => ({
      id: row.id,
      site_name: row.siteName,
      tagline: row.tagline,
      name: row.name,
      title: row.title,
      email: row.email,
      whatsapp: row.whatsapp,
      bio: row.bio,
      about_me: row.aboutMe,
      profile_image: row.profileImage,
      resume: row.resume,
      github: row.github,
      linkedin: row.linkedin,
      instagram: row.instagram,
      completed_projects: row.completedProjects,
      tech_stack_count: row.techStackCount,
      gpa: row.gpa,
      auto_update_skill_badges: row.autoUpdateSkillBadges,
      show_learning_curve: row.showLearningCurve,
      show_github_activity: row.showGithubActivity,
      meta_title: row.metaTitle,
      meta_description: row.metaDescription,
      meta_keywords: row.metaKeywords,
      og_title: row.ogTitle,
      og_description: row.ogDescription,
      og_image: row.ogImage,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    inquiries: inquiries.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      category: row.category,
      message: row.message,
      is_read: row.isRead,
      is_replied: row.isReplied,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    project_images: projectImages.map((row) => ({
      id: row.id,
      project_id: row.projectId,
      image: row.image,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    replies: replies.map((row) => ({
      id: row.id,
      inquiry_id: row.inquiryId,
      message: row.message,
      sent_at: row.sentAt ? row.sentAt.toISOString() : null,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    })),
    project_skill: projectSkill.map((row) => ({
      project_id: row.projectId,
      skill_id: row.skillId,
    })),
    exported_at: new Date().toISOString(),
    version: "1.0",
  };

  const filename = `portfolio-backup-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.json`;

  return json(payload, 200, {
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
}

async function importBackup(ctx: Ctx): Promise<Response> {
  const upload = file(ctx, "backup");

  if (!upload) {
    throw ApiError.validation("The backup field is required.", {
      backup: ["The backup field is required."],
    });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await upload.text());
  } catch {
    return json({ message: "Invalid backup file" }, 400);
  }

  let payload: Record<string, unknown>;
  try {
    payload = parseBackupPayload(raw);
  } catch (error) {
    if (error instanceof BackupFormatError) {
      return json({ message: error.message }, 400);
    }
    throw error;
  }

  await importBackupData(payload);

  return json({ message: "Backup imported successfully" });
}

export const backupRoutes: RouteDefinition[] = [
  { method: "GET", pattern: "admin/backup/export", handler: exportBackup, auth: true },
  { method: "POST", pattern: "admin/backup/import", handler: importBackup, auth: true },
];
