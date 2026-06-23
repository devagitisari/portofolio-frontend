"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCMS } from "@/services/cmsContext";
import { useTheme } from "@/services/themeContext";
import { BACKEND_API_URL } from "@/services/backendApi";
import PDFPreview from "@/components/PDFPreview";
import {
  Code,
  Layers,
  Palette,
  ArrowRight,
  ArrowUpRight,
  Smartphone,
  Router,
  Check,
  User,
  Award
} from "lucide-react";

export default function HomePage() {
  const { projects, skills, experiences, settings, certificates, addMessage } = useCMS();
  const { theme } = useTheme();
  const [gitHubEvents, setGitHubEvents] = useState<any[]>([]);

  // Local states for interactive copy-paste
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", category: "General", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fetch GitHub events on mount
  React.useEffect(() => {
    const fetchGitHubEvents = async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/github-activity`);
        if (response.ok) {
          const data = await response.json();
          if (data.data?.events) {
            setGitHubEvents(data.data.events);
          }
        }
      } catch (error) {
        console.error('Failed to fetch GitHub events:', error);
      }
    };

    if (settings.showGitHubActivity) {
      fetchGitHubEvents();
    }
  }, [settings.showGitHubActivity]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    // Add to CMS Context Messages list (simulating backend DB insert!)
    addMessage({
      name: formData.name,
      email: formData.email,
      subject: formData.subject || "Website Inquiry",
      category: formData.category || "General",
      message: formData.message
    });

    setFormSubmitted(true);
    setFormData({ name: "", email: "", subject: "", category: "General", message: "" });
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  // Helper function to check if a project is full-stack
  // Full-stack = has at least 1 language + 1 framework + 1 other/infrastructure skill
  const isFullStackProject = (projectSkills: string[]): boolean => {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (projectSkills.some(ps => ps.toLowerCase() === skill.name.toLowerCase())) {
        if (!acc[skill.category]) {
          acc[skill.category] = [];
        }
        acc[skill.category].push(skill.name);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Check if has at least one skill from each major category
    const hasLanguage = (skillsByCategory["Language"] ?? []).length > 0;
    const hasFramework = (skillsByCategory["Framework"] ?? []).length > 0;
    const hasOther = (skillsByCategory["Other"] ?? []).length > 0;

    return hasLanguage && hasFramework && hasOther;
  };

  // Calculate percentage based on project usage (max 5 projects = 100%)
  const calculatePercentage = (skillName: string): number => {
    const projectsUsingSkill = projects.filter(p =>
      (p.skillNames ?? []).some(s => s.toLowerCase() === skillName.toLowerCase())
    ).length;

    // Map: 1 project = 20%, 2 = 40%, 3 = 60%, 4 = 80%, 5+ = 100%
    return Math.min(projectsUsingSkill * 20, 100);
  };

  const languageSkills = skills.filter(
    s => s.category === "Language" && ((s.projectCount ?? 0) > 0 || calculatePercentage(s.name) > 0)
  );

  const frameworkSkills = skills.filter(
    s => s.category === "Framework" && ((s.projectCount ?? 0) > 0 || calculatePercentage(s.name) > 0)
  );

  const otherSkills = skills.filter(
    s => s.category === "Other" && ((s.projectCount ?? 0) > 0 || calculatePercentage(s.name) > 0)
  );

  const displayPercentage = (skill: typeof skills[number]) =>
    calculatePercentage(skill.name);

  const githubUsername = (() => {
    const value = settings.github?.trim();
    if (!value) return "";
    if (value.startsWith("@")) return value.slice(1);

    try {
      const url = new URL(value);
      return url.pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      return value.replace(/^github\.com\//, "").split("/")[0] ?? "";
    }
  })();

  // Identify featured projects (we take the first 3 for the Bento grid, sorted by date)
  const bentoProjects = [...projects]
    .sort((a, b) => {
      const dateA = a.startDate || a.endDate || '';
      const dateB = b.startDate || b.endDate || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 3);

  // Animation constants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="relative">

      {/* Background Decorative Blobs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full"></div>
      </div>

      {/* 1. Hero Section */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10 py-12" id="hero">
        <div className="max-w-3xl w-full flex flex-col items-center text-center">

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full"
          >
            <motion.span
              variants={fadeInUp}
              className="font-mono text-label-mono text-primary uppercase tracking-widest mb-4 block"
            >
              {settings.title}
            </motion.span>

            <motion.h1
              variants={fadeInUp}
              className="font-sans text-5xl lg:text-7xl text-on-background mb-6 leading-none font-extrabold tracking-tighter"
            >
              Deva <span className="text-gradient-primary">Gitisari</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="font-sans text-body-lg text-on-surface-variant mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              {settings.bio}
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link
                href="/projects"
                className="bg-gradient-to-r from-primary to-tertiary text-white px-8 py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform duration-200 shadow-[0_0_20px_rgba(255,105,180,0.24)] cursor-pointer"
              >
                View Projects
              </Link>
              <Link
                href="/contact"
                className="border border-primary/30 bg-surface/20 backdrop-blur text-primary px-8 py-4 rounded-xl font-bold hover:bg-primary/10 transition-all cursor-pointer"
              >
                Let&apos;s Talk
              </Link>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* 2. About Me Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Konten teks di kiri */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="lg:col-span-7"
            >
              <motion.span
                variants={fadeInUp}
                className="font-mono text-label-mono text-primary uppercase tracking-widest mb-4 block"
              >
                About Me
              </motion.span>

              {/* H2 Title "About Me" removed per request */}

              <motion.div
                variants={fadeInUp}
                className="space-y-5 font-sans text-body-lg text-on-surface-variant leading-relaxed max-w-3xl"
              >
                {settings.aboutMe
                  ?.split("\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap gap-3">
                {skills
                  .filter(skill => skill.show_on_home)
                  .map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full border border-secondary/20 bg-secondary/5 px-4 py-2 text-sm font-semibold text-secondary"
                    >
                      {skill.name}
                    </span>
                  ))}
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { value: `${projects.length}`, label: "Projects Built", color: "text-primary" },
                  { value: `${skills.filter(s => calculatePercentage(s.name) > 0).length}`, label: "Tech Stack Used", color: "text-tertiary" },
                  { value: settings.gpa || "N/A", label: "GPA", color: "text-secondary" },
                  { value: `${projects.filter(p => isFullStackProject(p.skillNames ?? [])).length}`, label: "Full-Stack Solutions", color: "text-primary" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="glass-card p-4 lg:p-6 rounded-2xl text-center hover:scale-105 transition-transform duration-300"
                  >
                    <div className={`${item.color} font-sans text-lg lg:text-headline-md font-bold mb-2`}>
                      {item.value}
                    </div>
                    <div className="font-mono text-[11px] lg:text-label-mono text-on-surface-variant">
                      {item.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Foto di kanan */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5 flex justify-center"
            >
              <div className="overflow-hidden rounded-3xl w-full max-w-[240px] sm:max-w-sm lg:max-w-[420px] h-auto px-4 sm:px-0">
                {settings.profileImage ? (
                  <img
                    className="w-full object-cover opacity-90 rounded-3xl"
                    alt="Developer workspace with laptop and code"
                    src={settings.profileImage}
                    style={{ aspectRatio: "3/4" }}
                  />
                ) : (
                  <div className="w-full bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center rounded-3xl" style={{ aspectRatio: "3/4" }}>
                    <User className="w-24 h-24 text-primary/70" />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Technical Expertise Marquee & Progress */}
      <section className="py-section-gap px-gutter bg-surface-container-lowest/30" id="skills">
        <div className="max-w-container-max mx-auto">

          <div className="mb-16 flex flex-col items-center">
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-gradient-primary mb-4 font-bold tracking-tight">
              Technical Expertise
            </h2>

            <div className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary rounded-full"></div>
          </div>

          {/* Endless Tech Stack Marquee */}
          {skills.length > 0 && (
            <div className="overflow-hidden mb-20 relative py-4 border-y border-white/5 bg-surface-container-lowest/50 backdrop-blur-sm rounded-2xl">
              <div className="animate-scroll gap-12 select-none">
                {/* First loop of skills */}
                <div className="flex gap-16 items-center px-6 grayscale opacity-45 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  {skills.filter(s => (s.projectCount ?? 0) > 0 || calculatePercentage(s.name) > 0).map((skill) => (
                    <span key={`1-${skill.id}`} className="font-sans text-headline-md font-extrabold tracking-tighter text-on-surface-variant whitespace-nowrap">
                      {skill.name.toUpperCase()}
                    </span>
                  ))}
                </div>
                {/* Second loop for seamless marquee */}
                <div className="flex gap-16 items-center px-6 grayscale opacity-45 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                  {skills.filter(s => (s.projectCount ?? 0) > 0 || calculatePercentage(s.name) > 0).map((skill) => (
                    <span key={`2-${skill.id}`} className="font-sans text-headline-md font-extrabold tracking-tighter text-on-surface-variant whitespace-nowrap">
                      {skill.name.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summarized Skill Categories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Programming Languages */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-2xl border-t-4 border-t-primary"
            >
              <h3 className="font-sans text-body-lg font-bold text-primary mb-6 flex items-center gap-2 select-none">
                <Code size={20} /> Languages
              </h3>
              <div className="space-y-6">
                {languageSkills.map((skill) => {
                  const percentage = displayPercentage(skill);
                  const projectCount = projects.filter(p =>
                    (p.skillNames ?? []).some(s => s.toLowerCase() === skill.name.toLowerCase())
                  ).length;

                  return (
                    <div key={skill.id} className="group">
                      <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-primary">
                        <span className="flex items-center gap-2">
                          {skill.name}
                          {projectCount > 0 && (
                            <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              {projectCount} project{projectCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        <span className="text-primary font-mono">{percentage}%</span>
                      </div>
                      <div className="h-[6px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-white via-primary to-primary rounded-full shadow-[0_0_10px_rgba(165,231,255,0.5)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Frameworks & Tools */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-2xl border-t-4 border-t-tertiary"
            >
              <h3 className="font-sans text-body-lg font-bold text-tertiary mb-6 flex items-center gap-2 select-none">
                <Layers size={20} /> Frameworks &amp; Tools
              </h3>
              <div className="space-y-6">
                {frameworkSkills.map((skill) => {
                  const percentage = displayPercentage(skill);
                  const projectCount = projects.filter(p =>
                    (p.skillNames ?? []).some(s => s.toLowerCase() === skill.name.toLowerCase())
                  ).length;

                  return (
                    <div key={skill.id} className="group">
                      <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-tertiary">
                        <span className="flex items-center gap-2">
                          {skill.name}
                          {projectCount > 0 && (
                            <span className="text-[10px] font-mono bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded-full">
                              {projectCount} project{projectCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        <span className="text-tertiary font-mono">{percentage}%</span>
                      </div>

                      <div className="h-[6px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-white via-tertiary to-tertiary rounded-full shadow-[0_0_10px_rgba(255,105,180,0.5)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Other Specialized Skills */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 rounded-2xl border-t-4 border-t-secondary"
            >
              <h3 className="font-sans text-body-lg font-bold text-secondary mb-6 flex items-center gap-2 select-none">
                <Palette size={20} /> Other Skills
              </h3>
              <div className="space-y-6">
                {otherSkills.map((skill) => {
                  const percentage = displayPercentage(skill);
                  const projectCount = projects.filter(p =>
                    (p.skillNames ?? []).some(s => s.toLowerCase() === skill.name.toLowerCase())
                  ).length;

                  return (
                    <div key={skill.id} className="group">
                      <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-secondary">
                        <span className="flex items-center gap-2">
                          {skill.name}
                          {projectCount > 0 && (
                            <span className="text-[10px] font-mono bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full">
                              {projectCount} project{projectCount > 1 ? "s" : ""}
                            </span>
                          )}
                        </span>
                        <span className="text-secondary font-mono">{percentage}%</span>
                      </div>

                      <div className="h-[6px] bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-white via-secondary-container to-secondary-container rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>
      </section >

      {/* 4. Featured Projects Section (Bento Grid) */}
      < section className="py-section-gap px-gutter" id="projects" >
        <div className="max-w-container-max mx-auto">

          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl lg:text-4xl text-gradient-primary mb-2 font-bold tracking-tight">
                Featured Projects
              </h2>
              <p className="text-on-surface-variant font-sans text-sm sm:text-body-md">
                A collection of academic and personal engineering achievements.
              </p>
            </div>
            <Link
              href="/projects"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap sm:ml-auto"
            >
              <span>All Projects</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Left: Large Project (Project A) */}
            {bentoProjects[0] && (
              <div className="md:col-span-1 lg:col-span-8">
                <Link href={`/projects/${bentoProjects[0].slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group relative overflow-hidden rounded-3xl glass-card cursor-pointer shadow-lg"
                    style={{ minHeight: '500px' }}
                  >
                    <div className="absolute inset-0">
                      <img
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                        alt={bentoProjects[0].title}
                        src={bentoProjects[0].image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
                    </div>

                    <div className="relative h-full p-8 flex flex-col justify-end z-10">
                      <div className="space-y-4">
                        <span className="inline-block text-tertiary font-mono text-xs uppercase tracking-widest font-semibold bg-black/50 px-3 py-1 rounded-lg border border-tertiary/30">
                          {bentoProjects[0].category}
                        </span>

                        <h3 className="font-sans text-2xl lg:text-3xl font-extrabold text-white leading-tight drop-shadow-lg">
                          {bentoProjects[0].title}
                          <ArrowUpRight size={24} className="inline-block ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300 text-tertiary" />
                        </h3>

                        <p className="text-gray-100 font-sans text-base leading-relaxed max-w-2xl drop-shadow-md">
                          {bentoProjects[0].description}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(bentoProjects[0].skillNames ?? []).slice(0, 4).map(skill => (
                            <span key={skill} className="bg-black/60 border border-white/30 px-3 py-1.5 rounded-lg text-xs font-mono text-white backdrop-blur-sm">
                              {skill}
                            </span>
                          ))}
                          {(bentoProjects[0].skillNames ?? []).length > 4 && (
                            <span className="bg-black/60 border border-tertiary/30 px-3 py-1.5 rounded-lg text-xs font-mono text-tertiary backdrop-blur-sm">
                              +{(bentoProjects[0].skillNames ?? []).length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </div>
            )}

            {/* Right: 2 Smaller Projects Stacked (Project B & C) */}
            <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-6">
              {bentoProjects[1] && (
                <Link href={`/projects/${bentoProjects[1].slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                    className="group relative overflow-hidden rounded-3xl glass-card cursor-pointer shadow-lg flex-1"
                    style={{ minHeight: '240px' }}
                  >
                    <div className="absolute inset-0">
                      <img
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                        alt={bentoProjects[1].title}
                        src={bentoProjects[1].image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
                    </div>

                    <div className="relative h-full p-6 flex flex-col justify-end z-10">
                      <div className="space-y-3">
                        <span className="inline-block text-primary font-mono text-xs uppercase tracking-widest font-semibold bg-black/50 px-3 py-1 rounded-lg border border-primary/30">
                          {bentoProjects[1].category}
                        </span>

                        <h3 className="font-sans text-lg font-bold text-white leading-tight drop-shadow-lg">
                          {bentoProjects[1].title}
                          <ArrowUpRight size={18} className="inline-block ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-primary" />
                        </h3>

                        <p className="text-gray-100 font-sans text-sm leading-relaxed drop-shadow-md line-clamp-2">
                          {bentoProjects[1].description}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(bentoProjects[1].skillNames ?? []).slice(0, 3).map(skill => (
                            <span key={skill} className="bg-black/60 border border-white/30 px-2.5 py-1 rounded text-xs font-mono text-white backdrop-blur-sm">
                              {skill}
                            </span>
                          ))}
                          {(bentoProjects[1].skillNames ?? []).length > 3 && (
                            <span className="bg-black/60 border border-primary/30 px-2.5 py-1 rounded text-xs font-mono text-primary backdrop-blur-sm">
                              +{(bentoProjects[1].skillNames ?? []).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {bentoProjects[2] && (
                <Link href={`/projects/${bentoProjects[2].slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 }}
                    className="group relative overflow-hidden rounded-3xl glass-card cursor-pointer shadow-lg flex-1"
                    style={{ minHeight: '240px' }}
                  >
                    <div className="absolute inset-0">
                      <img
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                        alt={bentoProjects[2].title}
                        src={bentoProjects[2].image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"></div>
                    </div>

                    <div className="relative h-full p-6 flex flex-col justify-end z-10">
                      <div className="space-y-3">
                        <span className="inline-block text-secondary font-mono text-xs uppercase tracking-widest font-semibold bg-black/50 px-3 py-1 rounded-lg border border-secondary/30">
                          {bentoProjects[2].category}
                        </span>

                        <h3 className="font-sans text-lg font-bold text-white leading-tight drop-shadow-lg">
                          {bentoProjects[2].title}
                          <ArrowUpRight size={18} className="inline-block ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-secondary" />
                        </h3>

                        <p className="text-gray-100 font-sans text-sm leading-relaxed drop-shadow-md line-clamp-2">
                          {bentoProjects[2].description}
                        </p>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {(bentoProjects[2].skillNames ?? []).slice(0, 3).map(skill => (
                            <span key={skill} className="bg-black/60 border border-white/30 px-2.5 py-1 rounded text-xs font-mono text-white backdrop-blur-sm">
                              {skill}
                            </span>
                          ))}
                          {(bentoProjects[2].skillNames ?? []).length > 3 && (
                            <span className="bg-black/60 border border-secondary/30 px-2.5 py-1 rounded text-xs font-mono text-secondary backdrop-blur-sm">
                              +{(bentoProjects[2].skillNames ?? []).length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section >

      {/* 4b. Latest Certifications Section */}
      < section className="py-section-gap px-gutter" id="latest-certifications" >
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl lg:text-4xl text-gradient-primary mb-2 font-bold tracking-tight">
                Latest Certifications
              </h2>
              <p className="text-on-surface-variant font-sans text-sm sm:text-body-md">
                Recent professional credentials and achievements.
              </p>
            </div>
            <Link
              href="/certificates"
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap sm:ml-auto"
            >
              <span>All Certificates</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const certs = certificates.slice(0, 3);

              if (certs.length === 0) {
                return (
                  <div className="col-span-1 md:col-span-3 glass-card p-8 rounded-2xl text-center">
                    <p className="text-on-surface-variant text-sm">
                      No certificates yet.
                    </p>
                  </div>
                );
              }

              return certs.map((cert, idx) => {
                const imgUrl = cert.image || null;
                return (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card rounded-2xl overflow-hidden border border-outline-variant/10 hover:border-outline-variant/30 transition-all duration-300 flex flex-col"
                  >
                    <div className="aspect-[4/3] bg-surface-container-lowest flex items-center justify-center overflow-hidden">
                      {imgUrl ? (
                        imgUrl.toLowerCase().endsWith('.pdf') ? (
                          <PDFPreview url={imgUrl} />
                        ) : (
                          <img
                            src={imgUrl}
                            alt={cert.title}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="text-center text-on-surface-variant">
                          <span className="material-symbols-outlined text-[48px] opacity-20">image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-primary/30">
                      <h3 className="font-sans text-sm font-bold text-on-background line-clamp-2 mb-1">
                        {cert.title}
                      </h3>
                      <p className="font-mono text-[11px] text-on-surface-variant">
                        {cert.issuer}
                      </p>
                      <Link
                        href={`/certificates/${cert.id}`}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:translate-x-0.5 transition-transform"
                      >
                        View Detail <ArrowRight size={12} />
                      </Link>
                    </div>
                  </motion.div>
                );
              });
            })()}
          </div>
        </div>
      </section >

      {/* 5. Experience Timeline */}
      <section className="py-section-gap px-gutter bg-surface-container-lowest/50" id="experience">
        <div>
          {/* Title centered */}
          <div className="max-w-container-max mx-auto mb-16 text-center">
            <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-gradient-primary mb-2 font-bold tracking-tight">
              Professional Journey
            </h2>
            <p className="text-on-surface-variant font-sans text-body-md">
              Milestones in my career and education.
            </p>
          </div>

          {/* Content centered */}
          <div className="max-w-3xl mx-auto">
            <div className="relative border-l-2 border-primary/20 ml-3 sm:ml-6 pl-6 sm:pl-10 space-y-8 sm:space-y-12">
              {experiences.length > 0 ? (
                experiences.map((exp, idx) => {
                  const formatDate = (d?: string | null) => {
                    if (!d) return "Present";
                    const parsed = new Date(d);
                    return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                  };
                  const nodeColor = idx % 2 === 0 ? "bg-primary shadow-[0_0_15px_#ff69b4]" : "bg-tertiary shadow-[0_0_15px_#00f7e8]";
                  const textColor = idx % 2 === 0 ? "text-primary" : "text-tertiary";
                  const badgeBg = idx % 2 === 0 ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary";
                  const hoverBorder = idx % 2 === 0 ? "hover:border-primary/30" : "hover:border-tertiary/30";
                  const points = exp.description.split("\n").filter(Boolean);
                  return (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.15 }}
                      className="relative"
                    >
                      <div className={`absolute -left-[27px] sm:-left-[51px] top-1.5 w-5 h-5 rounded-full ${nodeColor}`}></div>
                      <div className={`glass-card p-4 sm:p-8 rounded-2xl ${hoverBorder} transition-colors duration-300`}>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                          <div>
                            <h3 className={`font-sans text-sm sm:text-body-lg font-bold ${textColor}`}>{exp.position}</h3>
                            <p className="font-mono text-[10px] sm:text-label-mono text-on-surface-variant mt-1">{exp.company}</p>
                          </div>
                          <span className={`${badgeBg} px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs font-bold font-mono whitespace-nowrap`}>
                            {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                          </span>
                        </div>
                        {points.length > 1 ? (
                          <ul className="space-y-2 sm:space-y-3.5 text-on-surface-variant font-sans text-sm sm:text-body-md">
                            {points.map((pt, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2 sm:gap-3">
                                <ArrowRight size={14} className={`${textColor} mt-1 shrink-0 hidden sm:inline`} />
                                <ArrowRight size={12} className={`${textColor} mt-0.5 shrink-0 sm:hidden`} />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-on-surface-variant font-sans text-sm sm:text-body-md leading-relaxed">{exp.description}</p>
                        )}
                        {exp.certificate && (
                          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary/30 flex justify-end">
                            <a
                              href={exp.certificate}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/30 hover:border-primary/50 font-semibold text-xs sm:text-sm group/link"
                            >
                              <span className="material-symbols-outlined text-[14px] sm:text-[16px]">description</span>
                              <span>View Certificate</span>
                              <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <p className="text-on-surface-variant font-sans text-body-md text-center py-8">No experience entries yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {
        settings.showGitHubActivity && githubUsername && (
          <section className="py-section-gap px-gutter bg-surface-container-lowest/40" id="github-activity">
            <div className="max-w-container-max mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-12">
                <div>
                  <h2 className="font-sans text-xl sm:text-2xl lg:text-4xl text-gradient-primary mb-2 font-bold tracking-tight">
                    GitHub Activity
                  </h2>
                  <p className="text-on-surface-variant font-sans text-sm sm:text-body-md">
                    Recent commits and contribution graph from @{githubUsername}.
                  </p>
                </div>
                <a
                  href={`https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold hover:bg-primary/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap sm:ml-auto"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>Open GitHub</span>
                </a>
              </div>

              {/* Recent Activity Grid */}
              <div className="mb-12">
                <h3 className="font-sans text-body-lg font-bold text-on-background mb-6">Recent Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gitHubEvents && gitHubEvents.length > 0 ? (
                    gitHubEvents.map((event, idx) => (
                      <motion.a
                        key={event.id || idx}
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        className="glass-card p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="text-primary">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-sans text-body-md font-bold text-on-background group-hover:text-primary transition-colors mb-1 line-clamp-1">
                              {event.repo}
                            </h4>
                            <p className="text-on-surface-variant text-sm font-sans mb-3 line-clamp-2">
                              {event.summary}
                            </p>
                            <span className="text-xs font-mono text-on-surface-variant">
                              {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </motion.a>
                    ))
                  ) : (
                    <div className="col-span-1 md:col-span-2 glass-card p-8 rounded-2xl text-center text-on-surface-variant">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution Graph */}
              <div>
                <h3 className="font-sans text-body-lg font-bold text-on-background mb-6">Contribution Graph</h3>
                <div className="glass-card rounded-3xl p-5 sm:p-8 overflow-x-auto">
                  <iframe
                    src={`${BACKEND_API_URL}/github-contributions?v=7&theme=${theme}`}
                    title={`${githubUsername} GitHub contribution graph`}
                    className="mx-auto block h-[310px] min-w-[1010px] w-full rounded-xl border-0 bg-transparent"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </section>
        )
      }

      {/* 7. Contact Section */}
      <section className="py-section-gap px-gutter bg-surface-container/10" id="contact">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">

          <div>
            <h2 className="font-sans text-5xl lg:text-6xl text-on-background mb-6 leading-tight font-extrabold tracking-tighter">
              Let&apos;s build <br />
              <span className="text-gradient-primary">something great.</span>
            </h2>
            <p className="font-sans text-body-lg text-on-surface-variant mb-12">
              I&apos;m currently available for freelance projects or internship opportunities. Reach out and let&apos;s discuss how I can help.
            </p>

            <div className="space-y-6">

              {/* LinkedIn */}
              <a
                href={settings.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 glass-card p-4 rounded-2xl group cursor-pointer hover:border-primary/50 transition-all select-none"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest font-semibold">LINKEDIN</p>
                  <p className="font-sans text-body-md font-bold group-hover:text-primary transition-colors">
                    Connect on LinkedIn
                  </p>
                </div>
              </a>

              {/* GitHub */}
              <a
                href={settings.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-6 glass-card p-4 rounded-2xl group cursor-pointer hover:border-tertiary/50 transition-all select-none"
              >
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest font-semibold">GITHUB</p>
                  <p className="font-sans text-body-md font-bold group-hover:text-tertiary transition-colors">
                    View GitHub Profile
                  </p>
                </div>
              </a>

            </div>
          </div>

          {/* Form */}
          <div className="glass-card p-10 rounded-3xl relative">

            <AnimatePresence>
              {formSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-surface-container/95 rounded-3xl flex flex-col items-center justify-center text-center p-8 z-20"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
                    <Check size={36} />
                  </div>
                  <h3 className="font-sans text-headline-md font-bold text-on-background mb-2">Message Sent!</h3>
                  <p className="text-on-surface-variant font-sans text-body-md">
                    Thank you for reaching out. Your query has been received in my admin dashboard. I&apos;ll get back to you shortly!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label htmlFor="home_contact_name" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Name</label>
                <input
                  id="home_contact_name"
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-white/10 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="home_contact_email" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Email</label>
                <input
                  id="home_contact_email"
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-white/10 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="home_contact_category" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Category</label>
                <select
                  id="home_contact_category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-white/10 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background text-body-md transition-colors"
                >
                  <option value="General">General</option>
                  <option value="Project">Project</option>
                  <option value="Job">Job</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="home_contact_subject" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Subject</label>
                <input
                  id="home_contact_subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-white/10 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="Project inquiry / Collaboration"
                />
              </div>

              <div>
                <label htmlFor="home_contact_message" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Message</label>
                <textarea
                  id="home_contact_message"
                  required
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-white/10 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="Hello, I'd like to talk about..."
                  rows={4}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_10px_20px_-10px_rgba(165,231,255,0.4)] cursor-pointer"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

    </div >
  );
}
