"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getProjects as apiGetProjects,
  getSkills as apiGetSkills,
  getExperiences as apiGetExperiences,
  getCertificates as apiGetCertificates,
  getSettings as apiGetSettings,
  getInquiries as apiGetInquiries,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  createProjectFormData as apiCreateProjectFormData,
  updateProjectFormData as apiUpdateProjectFormData,
  createExperience as apiCreateExperience,
  updateExperience as apiUpdateExperience,
  createExperienceFormData as apiCreateExperienceFormData,
  updateExperienceFormData as apiUpdateExperienceFormData,
  deleteExperience as apiDeleteExperience,
  createCertificateFormData as apiCreateCertificateFormData,
  updateCertificateFormData as apiUpdateCertificateFormData,
  deleteCertificate as apiDeleteCertificate,
  createSkill as apiCreateSkill,
  updateSkill as apiUpdateSkill,
  deleteSkill as apiDeleteSkill,
  updateSettings as apiUpdateSettings,
  setInquiryRead as apiSetInquiryRead,
  setInquiryReplied as apiSetInquiryReplied,
  sendReply as apiSendReply,
  deleteInquiry as apiDeleteInquiry,
  postContact as apiPostContact,
  isAdminLogged,
  BACKEND_API_URL,
} from "@/services/backendApi";

const BACKEND_URL = BACKEND_API_URL.replace(/\/api\/?$/, "");

const formatImageUrl = (url?: string | null): string => {
  if (!url) return "";
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
};

// Types definition
export interface Project {
  id: string;
  slug?: string;
  title: string;
  category: string;
  description: string;
  skillIds?: string[];
  skillNames?: string[];
  image: string; // URL
  images?: { id?: string | number; image: string }[];
  imageUrls?: string[];
  longDescription?: string;
  projectRole?: string;
  problem?: string;
  solution?: string;
  keyFeatures?: string[];
  impact?: string;
  githubUrl?: string;
  demoUrl?: string;
  status?: string;
  featured?: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Skill {
  id: string;
  name: string;
  percentage: number;
  calculatedPercentage?: number;
  projectCount?: number;
  category: "Language" | "Framework" | "Other";
  show_on_home?: boolean;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  certificate?: string | null;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  description?: string | null;
  date?: string | null; // YYYY-MM-DD
  expiresDate?: string | null; // YYYY-MM-DD
  credentialUrl?: string | null;
  image?: string | null;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  category?: string;
  message: string;
  date: string;
  read: boolean;
  replied: boolean;
}

export interface Settings {
  id?: number;
  name: string;
  title: string;
  email: string;
  whatsapp: string;
  github: string;
  linkedin: string;
  gpa: string;
  completedProjects: number;
  techStackCount: number;
  autoUpdateSkillBadges: boolean;
  showGitHubActivity: boolean;
  bio: string;
  aboutMe: string;
  profileImage?: string | null;
  resumeUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

interface CMSContextType {
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  certificates: Certificate[];
  addExperience: (e: Omit<Experience, "id"> & { certificateFile?: File | null }) => Promise<void>;
  updateExperience: (id: string, e: Partial<Experience> & { certificateFile?: File | null }) => Promise<void>;
  deleteExperience: (id: string) => Promise<void>;
  addCertificate: (c: Omit<Certificate, "id">) => Promise<void>;
  updateCertificate: (id: string, c: Partial<Certificate>) => Promise<void>;
  deleteCertificate: (id: string) => Promise<void>;
  messages: Message[];
  settings: Settings;
  loading: boolean;
  addProject: (p: Omit<Project, "id">) => Promise<void>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addSkill: (s: Omit<Skill, "id">) => Promise<void>;
  updateSkill: (id: string, s: Partial<Skill>) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  addMessage: (m: Omit<Message, "id" | "date" | "read" | "replied">) => void;
  markMessageRead: (id: string) => void;
  markMessageReplied: (id: string) => void;
  sendReply: (inquiryId: string, message: string) => Promise<void>;
  deleteMessage: (id: string) => void;
  updateSettings: (s: Partial<Settings>, skipApi?: boolean) => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children }: { children: React.ReactNode }) {
  // 1. Initial State Setup
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>({
    name: "Deva Gitisari",
    title: "Informatics Student",
    email: "deva.gitisari@example.com",
    whatsapp: "+62 812 3456 7890",
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    gpa: "3.9",
    completedProjects: 15,
    techStackCount: 12,
    autoUpdateSkillBadges: true,
    showGitHubActivity: true,
    bio: "A forward-thinking Software Engineer & Informatics student specializing in Web Development, IoT ecosystems, and Data Science applications.",
    aboutMe: "Aku Deva, mahasiswa Informatika yang antusias dalam pengembangan web, Internet of Things, dan pengolahan data. Aku suka eksplor teknologi baru dan membangun project yang bukan cuma terlihat rapi, tapi juga punya alur yang jelas di belakangnya.\n\nSaat ini aku banyak belajar Laravel, Flutter, ESP32, dan data analysis. Aku terbiasa bekerja bertahap: memahami kebutuhan, membuat versi kecil, lalu memperbaiki detailnya sampai lebih nyaman digunakan.",
    resumeUrl: undefined,
  });

  const [loaded, setLoaded] = useState(false); // Start with loading state

  const mapInquiryToMessage = (inquiry: any): Message => ({
    id: String(inquiry.id),
    name: inquiry.name,
    email: inquiry.email,
    subject: inquiry.subject,
    category: inquiry.category,
    message: inquiry.message,
    date: inquiry.created_at ?? new Date().toISOString(),
    read: Boolean(inquiry.is_read),
    replied: Boolean(inquiry.is_replied),
  });

  const persistProjects = (items: Project[]) => localStorage.setItem("deva_projects", JSON.stringify(items));
  const persistSkills = (items: Skill[]) => localStorage.setItem("deva_skills", JSON.stringify(items));
  const persistExperiences = (items: Experience[]) => localStorage.setItem("deva_experiences", JSON.stringify(items));
  const persistCertificates = (items: Certificate[]) => localStorage.setItem("deva_certificates", JSON.stringify(items));
  const persistMessages = (items: Message[]) => localStorage.setItem("deva_messages", JSON.stringify(items));
  const persistSettings = (item: Settings) => localStorage.setItem("deva_settings", JSON.stringify(item));

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const loadLocalStorage = () => {
      const storedProjects = localStorage.getItem("deva_projects");
      const storedSkills = localStorage.getItem("deva_skills");
      const storedMessages = localStorage.getItem("deva_messages");
      const storedSettings = localStorage.getItem("deva_settings");

      if (storedProjects) {
        setProjects(JSON.parse(storedProjects));
      }

      // Clear skills cache to force refresh with calculated_percentage
      if (storedSkills) {
        localStorage.removeItem("deva_skills");
      }

      const storedExperiences = localStorage.getItem("deva_experiences");
      if (storedExperiences) {
        setExperiences(JSON.parse(storedExperiences));
      }

      const storedCertificates = localStorage.getItem("deva_certificates");
      if (storedCertificates) {
        setCertificates(JSON.parse(storedCertificates));
      }

      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // Filter out locally-generated messages (msg- prefix) that don't exist in backend
        const validMessages = parsedMessages.filter((m: any) => !m.id.startsWith('msg-'));
        // Ensure all messages have the replied field
        const messagesWithReplied = validMessages.map((m: any) => ({
          ...m,
          replied: m.replied ?? false,
        }));
        setMessages(messagesWithReplied);
      }

      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    };

    const loadData = async () => {
      loadLocalStorage();

      try {
        const [projectsData, skillsData, experiencesData, certificatesData, settingsData] = await Promise.all([
          apiGetProjects(),
          apiGetSkills(),
          apiGetExperiences(),
          apiGetCertificates(),
          apiGetSettings(),
        ]);

        if (Array.isArray(projectsData)) {
          const normalizedProjects = projectsData.map((proj: any) => ({
            id: String(proj.id),
            slug: proj.slug,
            title: proj.title,
            category: proj.category,
            description: proj.description,
            skillIds: (proj.skillIds ?? []).map(String),
            skillNames: (proj.skillNames ?? []),
            image: formatImageUrl(proj.image),
            images: (proj.images ?? []).map((img: any) => ({ ...img, image: formatImageUrl(img.image) })),
            longDescription: proj.longDescription ?? proj.long_description,
            projectRole: proj.projectRole ?? proj.project_role,
            problem: proj.problem,
            solution: proj.solution,
            keyFeatures: proj.keyFeatures ?? proj.key_features ?? [],
            impact: proj.impact,
            githubUrl: proj.githubUrl ?? proj.github_url,
            demoUrl: proj.demoUrl ?? proj.demo_url,
            status: proj.status,
            featured: proj.featured,
            startDate: proj.startDate ?? proj.start_date ?? null,
            endDate: proj.endDate ?? proj.end_date ?? null,
          })) as Project[];
          setProjects(normalizedProjects);
          persistProjects(normalizedProjects);
        }

        if (Array.isArray(skillsData)) {
          const normalizedSkills = skillsData.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            percentage: Number(s.percentage),
            calculatedPercentage: s.calculated_percentage != null ? Number(s.calculated_percentage) : undefined,
            projectCount: s.project_count != null ? Number(s.project_count) : undefined,
            category: s.category,
            show_on_home: s.show_on_home,
          })) as Skill[];
          setSkills(normalizedSkills);
          persistSkills(normalizedSkills);
        }

        if (Array.isArray(experiencesData)) {
          const formattedExperiences = experiencesData.map((e: any) => ({
            id: String(e.id),
            company: e.company,
            position: e.position,
            description: e.description,
            startDate: e.start_date,
            endDate: e.end_date,
            isCurrent: Boolean(e.is_current),
            certificate: e.certificate ? (e.certificate.startsWith('http') ? e.certificate : `${BACKEND_URL}/storage/${e.certificate}`) : null,
          }));
          setExperiences(formattedExperiences);
          persistExperiences(formattedExperiences);
        }

        if (Array.isArray(certificatesData)) {
          const normalizedCerts = certificatesData.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            issuer: c.issuer,
            description: c.description ?? null,
            date: c.date,
            expiresDate: c.expires_date ?? null,
            credentialUrl: c.credential_url ?? null,
            image: c.image,
          }));
          setCertificates(normalizedCerts);
          persistCertificates(normalizedCerts);
        }

        if (settingsData) {
          const normalized: Settings = {
            id: settingsData.id,
            name: settingsData.name ?? settingsData.site_name ?? settings.name,
            title: settingsData.title ?? settingsData.tagline ?? settings.title,
            email: settingsData.email ?? settings.email,
            whatsapp: settingsData.whatsapp ?? settings.whatsapp,
            github: settingsData.github ?? settings.github,
            linkedin: settingsData.linkedin ?? settings.linkedin,
            gpa: settingsData.gpa ?? settings.gpa,
            completedProjects: Number(settingsData.completedProjects ?? settingsData.completed_projects ?? settings.completedProjects),
            techStackCount: Number(settingsData.techStackCount ?? settingsData.tech_stack_count ?? settings.techStackCount),
            autoUpdateSkillBadges: Boolean(settingsData.autoUpdateSkillBadges ?? settingsData.auto_update_skill_badges ?? settings.autoUpdateSkillBadges),
            showGitHubActivity: Boolean(settingsData.showGitHubActivity ?? settingsData.show_github_activity ?? settings.showGitHubActivity),
            bio: settingsData.bio ?? settings.bio,
            aboutMe: settingsData.aboutMe ?? settingsData.about_me ?? settings.aboutMe,
            profileImage: settingsData.profileImage ? (settingsData.profileImage.startsWith('http') ? settingsData.profileImage : `${BACKEND_URL}${settingsData.profileImage}`) : settings.profileImage,
            resumeUrl: settingsData.resumeUrl ? (settingsData.resumeUrl.startsWith('http') ? settingsData.resumeUrl : `${BACKEND_URL}${settingsData.resumeUrl}`) : settings.resumeUrl,
          };
          setSettings(normalized);
          persistSettings(normalized);

          if (isAdminLogged()) {
            const inquiriesData = await apiGetInquiries();
            if (Array.isArray(inquiriesData)) {
              const backendMessages = inquiriesData.map(mapInquiryToMessage);
              setMessages(backendMessages);
              persistMessages(backendMessages);
            }
          }
        }
      } catch (error) {
        console.warn("Backend API not available, using local fallback.", error);
      } finally {
        setLoaded(true);
      }
    };

    void loadData();
  }, []);

  // 2. State modifiers and persistent Sync
  const addProject = async (p: Omit<Project, "id">) => {
    if (isAdminLogged()) {
      try {
        // support optional file upload via thumbnailFile
        if ((p as any).thumbnailFile || ((p as any).galleryFiles ?? []).length > 0) {
          const fd = new FormData();
          fd.append("title", p.title ?? "");
          fd.append("category", p.category ?? "");
          fd.append("description", p.description ?? "");
          if (p.longDescription) fd.append("long_description", p.longDescription);
          if (p.projectRole) fd.append("project_role", p.projectRole);
          if (p.problem) fd.append("problem", p.problem);
          if (p.solution) fd.append("solution", p.solution);
          (p.keyFeatures ?? []).forEach((feature) => fd.append("key_features[]", feature));
          if (p.impact) fd.append("impact", p.impact);
          fd.append("status", p.status ?? "published");
          fd.append("featured", p.featured ? "1" : "0");
          if (p.skillIds) p.skillIds.forEach((sid) => fd.append("skill_ids[]", sid));
          if (p.demoUrl) fd.append("demo_url", p.demoUrl);
          if (p.githubUrl) fd.append("github_url", p.githubUrl);
          if (p.startDate !== undefined) fd.append("start_date", p.startDate ?? "");
          if (p.endDate !== undefined) fd.append("end_date", p.endDate ?? "");
          (p.imageUrls ?? []).forEach((url) => fd.append("image_urls[]", url));
          ((p as any).galleryFiles ?? []).forEach((file: File) => fd.append("images[]", file));
          const file = (p as any).thumbnailFile as File | undefined;
          if (file) fd.append("thumbnail", file);
          else if (p.image) fd.append("thumbnail", p.image);

          const created = await apiCreateProjectFormData(fd);
          const normalized: Project = {
            id: String(created.id),
            title: created.title,
            category: created.category,
            description: created.description,
            skillIds: (created.skillIds ?? []).map(String),
            skillNames: (created.skillNames ?? []),
            image: formatImageUrl(created.image),
            images: (created.images ?? []).map((img: any) => ({ ...img, image: formatImageUrl(img.image) })),
            longDescription: created.long_description ?? created.longDescription,
            projectRole: created.projectRole ?? created.project_role,
            problem: created.problem,
            solution: created.solution,
            keyFeatures: created.keyFeatures ?? created.key_features ?? [],
            impact: created.impact,
            githubUrl: created.github_url ?? created.githubUrl,
            demoUrl: created.demo_url ?? created.demoUrl,
            status: created.status,
            featured: created.featured,
            startDate: created.startDate ?? created.start_date ?? null,
            endDate: created.endDate ?? created.end_date ?? null,
          };
          const updated = [normalized, ...projects];
          setProjects(updated);
          localStorage.setItem("deva_projects", JSON.stringify(updated));
          return;
        }

        const backendPayload: any = {
          ...p,
          thumbnail: p.image || undefined,
          long_description: p.longDescription || undefined,
          project_role: p.projectRole || undefined,
          problem: p.problem || undefined,
          solution: p.solution || undefined,
          key_features: p.keyFeatures ?? [],
          impact: p.impact || undefined,
          github_url: p.githubUrl || undefined,
          demo_url: p.demoUrl || undefined,
          start_date: p.startDate || undefined,
          end_date: p.endDate || undefined,
          featured: p.featured ?? false,
          status: p.status ?? "published",
          image_urls: p.imageUrls ?? [],
          skill_ids: p.skillIds ? p.skillIds.map(Number) : undefined,
        };
        // Remove empty string fields that would fail backend url/nullable validation
        delete backendPayload.image;
        delete backendPayload.longDescription;
        delete backendPayload.projectRole;
        delete backendPayload.keyFeatures;
        delete backendPayload.imageUrls;
        delete backendPayload.githubUrl;
        delete backendPayload.demoUrl;
        delete backendPayload.startDate;
        delete backendPayload.endDate;
        delete backendPayload.skillIds;

        const created = await apiCreateProject(backendPayload);
        const normalized: Project = {
          id: String(created.id),
          title: created.title,
          category: created.category,
          description: created.description,
          skillIds: (created.skillIds ?? []).map(String),
          skillNames: (created.skillNames ?? []),
          image: formatImageUrl(created.image),
          images: (created.images ?? []).map((img: any) => ({ ...img, image: formatImageUrl(img.image) })),
          longDescription: created.long_description ?? created.longDescription,
          projectRole: created.projectRole ?? created.project_role,
          problem: created.problem,
          solution: created.solution,
          keyFeatures: created.keyFeatures ?? created.key_features ?? [],
          impact: created.impact,
          githubUrl: created.github_url ?? created.githubUrl,
          demoUrl: created.demo_url ?? created.demoUrl,
          status: created.status,
          featured: created.featured,
          startDate: created.startDate ?? created.start_date ?? null,
          endDate: created.endDate ?? created.end_date ?? null,
        };
        const updated = [normalized, ...projects];
        setProjects(updated);
        localStorage.setItem("deva_projects", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to create project on backend, falling back to local project storage.", error);
      }
    }

    const newProj: Project = { ...p, id: `proj-${Date.now()}` };
    const updated = [newProj, ...projects];
    setProjects(updated);
    localStorage.setItem("deva_projects", JSON.stringify(updated));
  };

  const updateProject = async (id: string, p: Partial<Project>) => {
    if (isAdminLogged()) {
      try {
        // support optional file upload via thumbnailFile
        if ((p as any).thumbnailFile || ((p as any).galleryFiles ?? []).length > 0) {
          const fd = new FormData();
          if (p.title) fd.append("title", p.title);
          if (p.category) fd.append("category", p.category);
          if (p.description) fd.append("description", p.description);
          if (p.longDescription) fd.append("long_description", String(p.longDescription));
          if (p.projectRole !== undefined) fd.append("project_role", p.projectRole ?? "");
          if (p.problem !== undefined) fd.append("problem", p.problem ?? "");
          if (p.solution !== undefined) fd.append("solution", p.solution ?? "");
          if (p.keyFeatures) p.keyFeatures.forEach((feature) => fd.append("key_features[]", feature));
          if (p.impact !== undefined) fd.append("impact", p.impact ?? "");
          if (p.skillIds) p.skillIds.forEach((sid) => fd.append("skill_ids[]", sid));
          if (p.demoUrl) fd.append("demo_url", p.demoUrl);
          if (p.githubUrl) fd.append("github_url", p.githubUrl);
          if (p.startDate !== undefined) fd.append("start_date", p.startDate ?? "");
          if (p.endDate !== undefined) fd.append("end_date", p.endDate ?? "");
          if (p.status) fd.append("status", p.status);
          fd.append("featured", p.featured ? "1" : "0");
          (p.imageUrls ?? []).forEach((url) => fd.append("image_urls[]", url));
          ((p as any).galleryFiles ?? []).forEach((file: File) => fd.append("images[]", file));
          const file = (p as any).thumbnailFile as File | undefined;
          if (file) fd.append("thumbnail", file);
          else if (p.image) fd.append("thumbnail", p.image);

          const updatedProject = await apiUpdateProjectFormData(id, fd);
          const normalized: Project = {
            id: String(updatedProject.id),
            title: updatedProject.title,
            category: updatedProject.category,
            description: updatedProject.description,
            skillIds: (updatedProject.skillIds ?? []).map(String),
            skillNames: (updatedProject.skillNames ?? []),
            image: formatImageUrl(updatedProject.image),
            images: (updatedProject.images ?? []).map((img: any) => ({ ...img, image: formatImageUrl(img.image) })),
            longDescription: updatedProject.long_description ?? updatedProject.longDescription,
            projectRole: updatedProject.projectRole ?? updatedProject.project_role,
            problem: updatedProject.problem,
            solution: updatedProject.solution,
            keyFeatures: updatedProject.keyFeatures ?? updatedProject.key_features ?? [],
            impact: updatedProject.impact,
            githubUrl: updatedProject.github_url ?? updatedProject.githubUrl,
            demoUrl: updatedProject.demo_url ?? updatedProject.demoUrl,
            status: updatedProject.status,
            featured: updatedProject.featured,
            startDate: updatedProject.startDate ?? updatedProject.start_date ?? null,
            endDate: updatedProject.endDate ?? updatedProject.end_date ?? null,
          };
          const updated = projects.map(item => (item.id === id ? { ...item, ...normalized } : item));
          setProjects(updated);
          localStorage.setItem("deva_projects", JSON.stringify(updated));
          return;
        }

        const backendPayload = {
          ...p,
          thumbnail: p.image,
          long_description: p.longDescription,
          project_role: p.projectRole,
          problem: p.problem,
          solution: p.solution,
          key_features: p.keyFeatures,
          impact: p.impact,
          github_url: p.githubUrl,
          demo_url: p.demoUrl,
          start_date: p.startDate,
          end_date: p.endDate,
          featured: p.featured,
          status: p.status,
          image_urls: p.imageUrls,
          skill_ids: p.skillIds ? p.skillIds.map(Number) : undefined,
        };

        const updatedProject = await apiUpdateProject(id, backendPayload);
        const normalized: Project = {
          id: String(updatedProject.id),
          title: updatedProject.title,
          category: updatedProject.category,
          description: updatedProject.description,
          skillIds: (updatedProject.skillIds ?? []).map(String),
          skillNames: (updatedProject.skillNames ?? []),
          image: formatImageUrl(updatedProject.image),
          images: (updatedProject.images ?? []).map((img: any) => ({ ...img, image: formatImageUrl(img.image) })),
          longDescription: updatedProject.long_description ?? updatedProject.longDescription,
          projectRole: updatedProject.projectRole ?? updatedProject.project_role,
          problem: updatedProject.problem,
          solution: updatedProject.solution,
          keyFeatures: updatedProject.keyFeatures ?? updatedProject.key_features ?? [],
          impact: updatedProject.impact,
          githubUrl: updatedProject.github_url ?? updatedProject.githubUrl,
          demoUrl: updatedProject.demo_url ?? updatedProject.demoUrl,
          status: updatedProject.status,
          featured: updatedProject.featured,
          startDate: updatedProject.startDate ?? updatedProject.start_date ?? null,
          endDate: updatedProject.endDate ?? updatedProject.end_date ?? null,
        };
        const updated = projects.map(item => (item.id === id ? { ...item, ...normalized } : item));
        setProjects(updated);
        localStorage.setItem("deva_projects", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to update project on backend, falling back to local update.", error);
      }
    }

    const updated = projects.map(item => (item.id === id ? { ...item, ...p } : item));
    setProjects(updated);
    localStorage.setItem("deva_projects", JSON.stringify(updated));
  };

  const deleteProject = async (id: string) => {
    if (isAdminLogged()) {
      try {
        await apiDeleteProject(id);
      } catch (error) {
        console.warn("Failed to delete project on backend, removing locally.", error);
      }
    }

    const updated = projects.filter(item => item.id !== id);
    setProjects(updated);
    localStorage.setItem("deva_projects", JSON.stringify(updated));
  };

  const addSkill = async (s: Omit<Skill, "id">) => {
    if (isAdminLogged()) {
      try {
        const created = await apiCreateSkill(s);
        const normalized: Skill = {
          id: String(created.id),
          name: created.name,
          percentage: Number(created.percentage),
          category: created.category,
        };
        const updated = [...skills, normalized];
        setSkills(updated);
        localStorage.setItem("deva_skills", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to create skill on backend, falling back to local skill storage.", error);
      }
    }

    const newSkill = { ...s, id: `sk-${Date.now()}` };
    const updated = [...skills, newSkill];
    setSkills(updated);
    localStorage.setItem("deva_skills", JSON.stringify(updated));
  };

  const updateSkill = async (id: string, s: Partial<Skill>) => {
    if (isAdminLogged()) {
      try {
        const updatedSkill = await apiUpdateSkill(id, s);
        const normalized: Skill = {
          id: String(updatedSkill.id),
          name: updatedSkill.name,
          percentage: Number(updatedSkill.percentage),
          category: updatedSkill.category,
        };
        const updated = skills.map(item => (item.id === id ? { ...item, ...normalized } : item));
        setSkills(updated);
        localStorage.setItem("deva_skills", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to update skill on backend, falling back to local update.", error);
      }
    }

    const updated = skills.map(item => (item.id === id ? { ...item, ...s } : item));
    setSkills(updated);
    localStorage.setItem("deva_skills", JSON.stringify(updated));
  };

  const deleteSkill = async (id: string) => {
    if (isAdminLogged()) {
      try {
        await apiDeleteSkill(id);
      } catch (error) {
        console.warn("Failed to delete skill on backend, removing locally.", error);
      }
    }

    const updated = skills.filter(item => item.id !== id);
    setSkills(updated);
    localStorage.setItem("deva_skills", JSON.stringify(updated));
  };

  const addExperience = async (e: Omit<Experience, "id"> & { certificateFile?: File | null }) => {
    if (isAdminLogged()) {
      try {
        const payload: any = {
          company: e.company,
          position: e.position,
          description: e.description,
          start_date: e.startDate,
          end_date: e.endDate ?? null,
          is_current: e.isCurrent,
        };

        let created: any;
        if (e.certificateFile) {
          const fd = new FormData();
          fd.append("company", e.company);
          fd.append("position", e.position);
          fd.append("description", e.description);
          fd.append("start_date", e.startDate);
          if (e.endDate) fd.append("end_date", e.endDate);
          fd.append("is_current", e.isCurrent ? "1" : "0");
          fd.append("certificate", e.certificateFile);
          created = await apiCreateExperienceFormData(fd);
        } else {
          created = await apiCreateExperience(payload);
        }

        const normalized: Experience = {
          id: String(created.id ?? created.data?.id ?? Date.now()),
          company: created.company ?? created.data?.company ?? e.company,
          position: created.position ?? created.data?.position ?? e.position,
          description: created.description ?? created.data?.description ?? e.description,
          startDate: created.start_date ?? created.data?.start_date ?? e.startDate,
          endDate: created.end_date ?? created.data?.end_date ?? e.endDate ?? null,
          isCurrent: Boolean(created.is_current ?? created.data?.is_current ?? e.isCurrent),
          certificate: created.certificate ?? created.data?.certificate ?? null,
        };

        const updated = [normalized, ...experiences];
        setExperiences(updated);
        localStorage.setItem("deva_experiences", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to create experience on backend, falling back to local.", error);
      }
    }

    const newExp: Experience = { ...e, id: `exp-${Date.now()}` };
    const updated = [newExp, ...experiences];
    setExperiences(updated);
    localStorage.setItem("deva_experiences", JSON.stringify(updated));
  };

  const updateExperience = async (id: string, e: Partial<Experience> & { certificateFile?: File | null }) => {
    if (isAdminLogged()) {
      try {
        let updatedBackend: any;
        if (e.certificateFile) {
          const fd = new FormData();
          if (e.company !== undefined) fd.append("company", e.company);
          if (e.position !== undefined) fd.append("position", e.position);
          if (e.description !== undefined) fd.append("description", e.description);
          if (e.startDate !== undefined) fd.append("start_date", e.startDate);
          if (e.endDate !== undefined) fd.append("end_date", e.endDate ?? "");
          if (e.isCurrent !== undefined) fd.append("is_current", e.isCurrent ? "1" : "0");
          fd.append("certificate", e.certificateFile);
          updatedBackend = await apiUpdateExperienceFormData(id, fd);
        } else {
          const payload: any = {
            company: e.company,
            position: e.position,
            description: e.description,
            start_date: e.startDate,
            end_date: e.endDate ?? null,
            is_current: e.isCurrent,
          };
          updatedBackend = await apiUpdateExperience(id, payload);
        }

        const normalized: Partial<Experience> = {
          company: updatedBackend.company ?? updatedBackend.data?.company ?? e.company,
          position: updatedBackend.position ?? updatedBackend.data?.position ?? e.position,
          description: updatedBackend.description ?? updatedBackend.data?.description ?? e.description,
          startDate: updatedBackend.start_date ?? updatedBackend.data?.start_date ?? e.startDate,
          endDate: updatedBackend.end_date ?? updatedBackend.data?.end_date ?? e.endDate ?? null,
          isCurrent: Boolean(updatedBackend.is_current ?? updatedBackend.data?.is_current ?? e.isCurrent),
          certificate: updatedBackend.certificate ?? updatedBackend.data?.certificate ?? e.certificate,
        };

        const updated = experiences.map(item => (item.id === id ? { ...item, ...normalized } as Experience : item));
        setExperiences(updated);
        localStorage.setItem("deva_experiences", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to update experience on backend, falling back to local update.", error);
      }
    }

    const updated = experiences.map(item => (item.id === id ? { ...item, ...e } as Experience : item));
    setExperiences(updated);
    localStorage.setItem("deva_experiences", JSON.stringify(updated));
  };

  const deleteExperience = async (id: string) => {
    if (isAdminLogged()) {
      try {
        await apiDeleteExperience(id);
      } catch (error) {
        console.warn("Failed to delete experience on backend, removing locally.", error);
      }
    }

    const updated = experiences.filter(item => item.id !== id);
    setExperiences(updated);
    localStorage.setItem("deva_experiences", JSON.stringify(updated));
  };

  // ── Certificate CRUD ──────────────────────────────────────────────

  const addCertificate = async (c: Omit<Certificate, "id">) => {
    if (isAdminLogged()) {
      try {
        const fd = new FormData();
        fd.append("title", c.title);
        fd.append("issuer", c.issuer);
        if (c.description) fd.append("description", c.description);
        if (c.date) fd.append("date", c.date);
        if (c.expiresDate) fd.append("expires_date", c.expiresDate);
        if (c.credentialUrl) fd.append("credential_url", c.credentialUrl);
        if ((c as any).imageFile) {
          fd.append("image", (c as any).imageFile as File);
        }

        const created = await apiCreateCertificateFormData(fd);
        const normalized: Certificate = {
          id: String(created.id),
          title: created.title,
          issuer: created.issuer,
          description: created.description ?? null,
          date: created.date,
          expiresDate: created.expires_date ?? null,
          credentialUrl: created.credential_url ?? null,
          image: created.image,
        };
        const updated = [...certificates, normalized];
        setCertificates(updated);
        localStorage.setItem("deva_certificates", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to create certificate on backend, falling back to local.", error);
      }
    }

    const newCert: Certificate = { ...c, id: `cert-${Date.now()}` };
    const updated = [...certificates, newCert];
    setCertificates(updated);
    localStorage.setItem("deva_certificates", JSON.stringify(updated));
  };

  const updateCertificate = async (id: string, c: Partial<Certificate>) => {
    if (isAdminLogged()) {
      try {
        const fd = new FormData();
        if (c.title) fd.append("title", c.title);
        if (c.issuer) fd.append("issuer", c.issuer);
        if (c.description !== undefined) fd.append("description", c.description ?? "");
        if (c.date) fd.append("date", c.date);
        if (c.expiresDate !== undefined) fd.append("expires_date", c.expiresDate ?? "");
        if (c.credentialUrl !== undefined) fd.append("credential_url", c.credentialUrl ?? "");
        if ((c as any).imageFile) {
          fd.append("image", (c as any).imageFile as File);
        }

        const updatedBackend = await apiUpdateCertificateFormData(id, fd);
        const normalized: Partial<Certificate> = {
          title: updatedBackend.title ?? c.title,
          issuer: updatedBackend.issuer ?? c.issuer,
          description: updatedBackend.description ?? c.description ?? null,
          date: updatedBackend.date ?? c.date,
          expiresDate: updatedBackend.expires_date ?? c.expiresDate ?? null,
          credentialUrl: updatedBackend.credential_url ?? c.credentialUrl ?? null,
          image: updatedBackend.image ?? c.image,
        };

        const updated = certificates.map(item => (item.id === id ? { ...item, ...normalized } as Certificate : item));
        setCertificates(updated);
        localStorage.setItem("deva_certificates", JSON.stringify(updated));
        return;
      } catch (error) {
        console.warn("Failed to update certificate on backend, falling back to local.", error);
      }
    }

    const updated = certificates.map(item => (item.id === id ? { ...item, ...c } as Certificate : item));
    setCertificates(updated);
    localStorage.setItem("deva_certificates", JSON.stringify(updated));
  };

  const deleteCertificate = async (id: string) => {
    if (isAdminLogged()) {
      try {
        await apiDeleteCertificate(id);
      } catch (error) {
        console.warn("Failed to delete certificate on backend, removing locally.", error);
      }
    }

    const updated = certificates.filter(item => item.id !== id);
    setCertificates(updated);
    localStorage.setItem("deva_certificates", JSON.stringify(updated));
  };

  const addMessage = (m: Omit<Message, "id" | "date" | "read" | "replied">) => {
    const newMessage: Message = {
      ...m,
      id: `msg-${Date.now()}`,
      replied: false,
      date: new Date().toISOString(),
      read: false,
    };

    const saveMessage = async () => {
      try {
        const data = await apiPostContact({
          name: m.name,
          email: m.email,
          subject: m.subject ?? "Website Inquiry",
          category: m.category ?? "General",
          message: m.message,
        });

        const savedMessage: Message = {
          ...newMessage,
          id: data?.id ? String(data.id) : newMessage.id,
          date: data?.created_at ?? newMessage.date,
        };

        const updated = [savedMessage, ...messages];
        setMessages(updated);
        localStorage.setItem("deva_messages", JSON.stringify(updated));
      } catch (error) {
        console.warn("Falling back to local message store because backend contact request failed.", error);
        const updated = [newMessage, ...messages];
        setMessages(updated);
        localStorage.setItem("deva_messages", JSON.stringify(updated));
      }
    };

    void saveMessage();
  };

  const markMessageRead = (id: string) => {
    const updated = messages.map(item => (item.id === id ? { ...item, read: true } : item));
    setMessages(updated);
    localStorage.setItem("deva_messages", JSON.stringify(updated));

    if (isAdminLogged()) {
      void apiSetInquiryRead(id, true).catch(error => {
        console.warn("Failed to mark inquiry as read on backend.", error);
      });
    }
  };

  const markMessageReplied = (id: string) => {
    const updated = messages.map(item => (item.id === id ? { ...item, replied: true } : item));
    setMessages(updated);
    localStorage.setItem("deva_messages", JSON.stringify(updated));

    if (isAdminLogged()) {
      void apiSetInquiryReplied(id, true).catch(error => {
        console.warn("Failed to mark inquiry as replied on backend.", error);
      });
    }
  };

  const sendReply = async (inquiryId: string, message: string) => {
    if (isAdminLogged()) {
      // Prevent sending replies to locally-generated message IDs
      if (inquiryId.startsWith('msg-')) {
        throw new Error('Cannot reply to unsaved message. This message was created locally and not synced with the server.');
      }
      try {
        await apiSendReply(inquiryId, message);
        // Refresh inquiries from backend to get updated status (both read and replied)
        const inquiriesData = await apiGetInquiries();
        if (Array.isArray(inquiriesData)) {
          const backendMessages = inquiriesData.map(mapInquiryToMessage);
          setMessages(backendMessages);
          persistMessages(backendMessages);
        }
      } catch (error) {
        console.error("Failed to send reply:", error);
        throw error;
      }
    }
  };

  const deleteMessage = (id: string) => {
    const updated = messages.filter(item => item.id !== id);
    setMessages(updated);
    localStorage.setItem("deva_messages", JSON.stringify(updated));

    if (isAdminLogged()) {
      void apiDeleteInquiry(id).catch(error => {
        console.warn("Failed to delete inquiry on backend.", error);
      });
    }
  };

  const updateSettings = async (s: Partial<Settings>, skipApi = false) => {
    // Format URLs if they are relative
    const formattedProfileImage = s.profileImage ? (s.profileImage.startsWith('http') ? s.profileImage : `${BACKEND_URL}${s.profileImage}`) : s.profileImage;
    const formattedResumeUrl = s.resumeUrl ? (s.resumeUrl.startsWith('http') ? s.resumeUrl : `${BACKEND_URL}${s.resumeUrl}`) : s.resumeUrl;

    const updated = { 
      ...settings, 
      ...s,
      ...(s.profileImage !== undefined && { profileImage: formattedProfileImage }),
      ...(s.resumeUrl !== undefined && { resumeUrl: formattedResumeUrl }),
    };
    
    setSettings(updated);
    localStorage.setItem("deva_settings", JSON.stringify(updated));

    if (!skipApi && isAdminLogged() && updated.id != null) {
      try {
        await apiUpdateSettings(updated.id, {
          name: updated.name,
          title: updated.title,
          email: updated.email,
          whatsapp: updated.whatsapp,
          github: updated.github,
          linkedin: updated.linkedin,
          gpa: updated.gpa,
          completed_projects: updated.completedProjects,
          tech_stack_count: updated.techStackCount,
          auto_update_skill_badges: updated.autoUpdateSkillBadges,
          show_github_activity: updated.showGitHubActivity,
          bio: updated.bio,
          about_me: updated.aboutMe,
          profile_image: updated.profileImage,
          resume: updated.resumeUrl,
        });
      } catch (error) {
        console.warn("Failed to update settings on backend.", error);
        throw error;
      }
    }
  };

  return (
    <CMSContext.Provider
      value={{
        projects,
        skills,
        experiences,
        certificates,
        messages,
        settings,
        loading: !loaded,
        addProject,
        updateProject,
        deleteProject,
        addSkill,
        updateSkill,
        deleteSkill,
        addExperience,
        updateExperience,
        deleteExperience,
        addCertificate,
        updateCertificate,
        deleteCertificate,
        addMessage,
        markMessageRead,
        markMessageReplied,
        sendReply,
        deleteMessage,
        updateSettings,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
