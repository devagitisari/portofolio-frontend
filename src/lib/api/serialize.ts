import type {
  Certificate,
  Experience,
  Inquiry,
  Project,
  ProjectImage,
  ProjectSkill,
  Reply,
  Setting,
  Skill,
} from "@prisma/client";

/** Formats a date-only column as `Y-m-d` (matches Laravel's date cast). */
export function formatDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : url;
}

type ProjectWithRelations = Project & {
  images?: ProjectImage[];
  projectSkills?: (ProjectSkill & { skill: Skill })[];
};

export function serializeProject(project: ProjectWithRelations) {
  const images = project.images ?? [];
  const skills = (project.projectSkills ?? []).map((entry) => entry.skill);
  const firstGalleryImage = images[0]?.image ?? null;

  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    longDescription: project.longDescription,
    projectRole: project.projectRole,
    problem: project.problem,
    solution: project.solution,
    keyFeatures: Array.isArray(project.keyFeatures) ? project.keyFeatures : [],
    impact: project.impact,
    category: project.category,
    status: project.status,
    image: resolveUrl(project.thumbnail) ?? resolveUrl(firstGalleryImage),
    skillIds: skills.map((skill) => String(skill.id)),
    skillNames: skills.map((skill) => skill.name),
    demoUrl: project.demoUrl,
    githubUrl: project.githubUrl,
    featured: project.featured,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    images: images.map((image) => ({
      id: image.id,
      image: resolveUrl(image.image),
      created_at: formatDateTime(image.createdAt),
    })),
    created_at: formatDateTime(project.createdAt),
    updated_at: formatDateTime(project.updatedAt),
  };
}

export function serializeCertificate(certificate: Certificate) {
  return {
    id: certificate.id,
    title: certificate.title,
    issuer: certificate.issuer,
    description: certificate.description,
    date: formatDate(certificate.date),
    expires_date: formatDate(certificate.expiresDate),
    credential_url: certificate.credentialUrl,
    image: resolveUrl(certificate.image),
    created_at: formatDateTime(certificate.createdAt),
    updated_at: formatDateTime(certificate.updatedAt),
  };
}

export function serializeExperience(experience: Experience) {
  return {
    id: experience.id,
    company: experience.company,
    position: experience.position,
    description: experience.description,
    start_date: formatDate(experience.startDate),
    end_date: formatDate(experience.endDate),
    is_current: experience.isCurrent,
    certificate: resolveUrl(experience.certificate),
    // Laravel exposes the soft-delete column on the model — keep the same shape.
    deleted_at: formatDateTime(experience.deletedAt),
    created_at: formatDateTime(experience.createdAt),
    updated_at: formatDateTime(experience.updatedAt),
  };
}

export function serializeSkill(skill: Skill & { projects_count?: number }) {
  return {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    percentage: skill.percentage,
    calculated_percentage: skill.calculatedPercentage ?? 0,
    project_count: skill.projectCount ?? skill.projects_count ?? 0,
    show_on_home: skill.showOnHome,
    created_at: formatDateTime(skill.createdAt),
    updated_at: formatDateTime(skill.updatedAt),
  };
}

export function serializeInquiry(inquiry: Inquiry) {
  return {
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    subject: inquiry.subject,
    category: inquiry.category,
    message: inquiry.message,
    is_read: inquiry.isRead,
    is_replied: inquiry.isReplied,
    created_at: formatDateTime(inquiry.createdAt),
    updated_at: formatDateTime(inquiry.updatedAt),
  };
}

export function serializeReply(reply: Reply) {
  return {
    id: reply.id,
    inquiry_id: reply.inquiryId,
    message: reply.message,
    sent_at: formatDateTime(reply.sentAt),
    created_at: formatDateTime(reply.createdAt),
    updated_at: formatDateTime(reply.updatedAt),
  };
}

/**
 * Mirrors SettingController@index — the payload the public website relies on.
 */
export function serializeSettings(settings: Setting | null) {
  return {
    id: settings?.id ?? null,
    name: settings?.name ?? settings?.siteName ?? null,
    title: settings?.title ?? settings?.tagline ?? null,
    email: settings?.email ?? null,
    whatsapp: settings?.whatsapp ?? null,
    github: settings?.github ?? null,
    linkedin: settings?.linkedin ?? null,
    instagram: settings?.instagram ?? null,
    bio: settings?.bio ?? null,
    aboutMe: settings?.aboutMe ?? null,
    gpa: settings?.gpa ?? null,
    completedProjects: settings?.completedProjects ?? 0,
    techStackCount: settings?.techStackCount ?? 0,
    autoUpdateSkillBadges: settings?.autoUpdateSkillBadges ?? true,
    showLearningCurve: settings?.showLearningCurve ?? true,
    showGitHubActivity: settings?.showGithubActivity ?? true,
    profileImage: settings?.profileImage ? resolveUrl(settings.profileImage) : null,
    resumeUrl: settings?.resume
      ? settings.resume.startsWith("http")
        ? settings.resume
        : `/api/resume?v=${settings.resume.split("/").pop()}`
      : null,
    metaTitle: settings?.metaTitle ?? null,
    metaDescription: settings?.metaDescription ?? null,
    metaKeywords: settings?.metaKeywords ?? null,
    ogTitle: settings?.ogTitle ?? null,
    ogDescription: settings?.ogDescription ?? null,
    ogImage: settings?.ogImage ? resolveUrl(settings.ogImage) : null,
  };
}
