"use client";

import React from "react";
import { motion } from "framer-motion";
import { useCMS } from "@/services/cmsContext";
import { groupSkills, resolveSkillPercentage, skillGroup } from "@/services/skillUtils";
import { Code, Layers, Palette, HelpCircle } from "lucide-react";

export default function SkillsPage() {
  const { skills, projects } = useCMS();

  // Calculate percentage based on project usage (max 5 projects = 100%)
  const calculatePercentage = (skillName: string): number => {
    const projectsUsingSkill = projects.filter(p =>
      (p.skillNames ?? []).some(s => s.toLowerCase() === skillName.toLowerCase())
    ).length;

    // Map: 1 project = 20%, 2 = 40%, 3 = 60%, 4 = 80%, 5+ = 100%
    return Math.min(projectsUsingSkill * 20, 100);
  };

  // Helper function to check if a project is full-stack
  // Full-stack = has at least 1 language + 1 framework + 1 other/infrastructure skill
  const isFullStackProject = (projectSkills: string[]): boolean => {
    const groups = new Set<string>();

    for (const name of projectSkills) {
      const skill = skills.find(item => item.name.toLowerCase() === name.toLowerCase());
      const group = skillGroup(skill?.category);
      if (group) groups.add(group);
    }

    return groups.has("language") && groups.has("framework") && groups.has("other");
  };

  // Enrich skills with the percentage that should be displayed:
  // project usage first, the manually configured value as fallback.
  const enrichedSkills = skills.map(s => {
    const usagePercentage = calculatePercentage(s.name);

    return {
      ...s,
      calculatedPercentage: resolveSkillPercentage(
        { ...s, calculatedPercentage: usagePercentage },
        projects
      ),
    };
  });

  // Group skills by category (matched by keyword so any category naming works)
  const { languages, frameworks, others } = groupSkills(enrichedSkills, projects);

  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, type: "spring" as const, stiffness: 100 }
    }
  };

  return (
    <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">

      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3 block">
          Specialization
        </span>
        <h1 className="font-sans text-5xl lg:text-6xl text-on-background font-extrabold tracking-tighter mb-4 leading-none">
          Technical <span className="text-gradient-primary">Skills</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent-violet mx-auto rounded-full mb-6"></div>
        <p className="font-sans text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          A comprehensive breakdown of my engineering capabilities, language fluencies, tools, and technical architectures.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >

        {/* Languages Container */}
        <motion.div
          variants={cardVariants}
          className="glass-card p-8 rounded-3xl border-t-4 border-t-primary"
        >
          <div className="flex items-center gap-3.5 mb-8 select-none">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Code size={24} />
            </div>
            <div>
              <h2 className="font-sans text-body-lg font-bold text-on-background">Languages</h2>
              <p className="text-xs text-on-surface-variant font-medium">Core scripting &amp; logic</p>
            </div>
          </div>

          <div className="space-y-6">
            {languages.length > 0 ? (
              languages.map((skill) => {
                const pct = skill.calculatedPercentage ?? 0;
                return (
                  <div key={skill.id} className="group">
                    <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-primary">
                      <span className="flex items-center gap-2">
                        {skill.name}
                        {(skill.projectCount ?? 0) > 0 && (
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            {skill.projectCount} project{(skill.projectCount ?? 0) > 1 ? "s" : ""}
                          </span>
                        )}
                      </span>
                      <span className="text-primary font-mono">{pct}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(255,105,180,0.35)]"
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-on-surface-variant">No language skills defined.</p>
            )}
          </div>
        </motion.div>

        {/* Frameworks & Tools Container — VIOLET accent */}
        <motion.div
          variants={cardVariants}
          className="glass-card p-8 rounded-3xl border-t-4 border-t-accent-violet"
        >
          <div className="flex items-center gap-3.5 mb-8 select-none">
            <div className="w-12 h-12 bg-accent-violet-10 rounded-2xl flex items-center justify-center text-accent-violet shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Layers size={24} />
            </div>
            <div>
              <h2 className="font-sans text-body-lg font-bold text-on-background">Frameworks</h2>
              <p className="text-xs text-on-surface-variant font-medium">Libraries &amp; environments</p>
            </div>
          </div>

          <div className="space-y-6">
            {frameworks.length > 0 ? (
              frameworks.map((skill) => (
                <div key={skill.id} className="group">
                  <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-accent-violet">
                    <span className="flex items-center gap-2">
                      {skill.name}
                      {(skill.projectCount ?? 0) > 0 && (
                        <span className="text-[10px] font-mono bg-accent-violet-10 text-accent-violet px-1.5 py-0.5 rounded-full">
                          {skill.projectCount} project{(skill.projectCount ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="text-accent-violet font-mono">{skill.calculatedPercentage ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.calculatedPercentage ?? 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-accent-violet rounded-full shadow-[0_0_10px_rgba(168,85,247,0.35)]"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant">No framework skills defined.</p>
            )}
          </div>
        </motion.div>

        {/* Other Specialties Container — VIOLET accent */}
        <motion.div
          variants={cardVariants}
          className="glass-card p-8 rounded-3xl border-t-4 border-t-accent-violet"
        >
          <div className="flex items-center gap-3.5 mb-8 select-none">
            <div className="w-12 h-12 bg-accent-violet-10 rounded-2xl flex items-center justify-center text-accent-violet shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="font-sans text-body-lg font-bold text-on-background">Other Skills</h2>
              <p className="text-xs text-on-surface-variant font-medium">IoT, Data science &amp; design</p>
            </div>
          </div>

          <div className="space-y-6">
            {others.length > 0 ? (
              others.map((skill) => (
                <div key={skill.id} className="group">
                  <div className="flex justify-between mb-2 font-sans text-body-md font-medium transition-colors group-hover:text-accent-violet">
                    <span className="flex items-center gap-2">
                      {skill.name}
                      {(skill.projectCount ?? 0) > 0 && (
                        <span className="text-[10px] font-mono bg-accent-violet-10 text-accent-violet px-1.5 py-0.5 rounded-full">
                          {skill.projectCount} project{(skill.projectCount ?? 0) > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="text-accent-violet font-mono">{skill.calculatedPercentage ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.calculatedPercentage ?? 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-accent-violet rounded-full shadow-[0_0_10px_rgba(168,85,247,0.35)]"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-on-surface-variant">No custom skills defined.</p>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* Dynamic Summary Block */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-16 glass-card p-8 rounded-3xl flex flex-col gap-8 border-white/5"
      >
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-accent-violet-10 flex items-center justify-center text-accent-violet shrink-0 select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <HelpCircle size={28} />
            </div>
            <h3 className="font-sans text-body-lg font-bold text-on-background select-none">Technical Highlights</h3>
          </div>
          <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
            I build end-to-end software solutions by combining backend development, modern web and mobile technologies, IoT systems, and data-driven approaches to create reliable, scalable, and user-focused applications.
          </p>
        </div>

        {/* Dynamic Stats from Projects */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Projects Built", value: projects.length, color: "text-primary" },
            { label: "Tech Stack Used", value: enrichedSkills.filter(s => s.calculatedPercentage > 0).length, color: "text-accent-violet" },
            { label: "Full-Stack Solutions", value: projects.filter(p => isFullStackProject(p.skillNames ?? [])).length, color: "text-primary" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="bg-surface-container-lowest/40 rounded-2xl p-4 text-center"
            >
              <div className={`font-sans text-2xl font-bold mb-1 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
