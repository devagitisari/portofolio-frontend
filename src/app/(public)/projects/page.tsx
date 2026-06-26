"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCMS } from "@/services/cmsContext";
import { GitBranch, ExternalLink, Filter } from "lucide-react";

export default function ProjectsPage() {
  const { projects } = useCMS();
  const [activeTab, setActiveTab] = useState<string>("All");

  // Generate categories dynamically from projects
  const uniqueCategories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));
  const categories = ["All", ...uniqueCategories];

  // Filter projects dynamically
  const filteredProjects = (activeTab === "All"
    ? projects
    : projects.filter(p => p.category && p.category.toLowerCase().trim() === activeTab.toLowerCase().trim()))
    .sort((a, b) => {
      const dateA = a.startDate || a.endDate || '';
      const dateB = b.startDate || b.endDate || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

  const formatProjectDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 relative z-10 max-w-7xl mx-auto">

      {/* Page Header */}
      <div className="text-center mb-12 select-none px-4">
        <span className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3 block">
          Showcase
        </span>
        <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl text-on-background font-extrabold tracking-tighter mb-4 leading-none">
          My <span className="text-primary">Projects</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary mx-auto rounded-full mb-6"></div>
        <p className="font-sans text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          An exploration of academic, professional, and personal engineering achievements, showcasing my full-stack capabilities.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center items-center gap-1.5 mb-16 select-none bg-surface-container/30 border border-white/5 p-1.5 rounded-2xl mx-auto backdrop-blur-md shadow-2xl relative z-20 w-fit">
        <Filter size={16} className="text-on-surface-variant/40 ml-2 shrink-0" />
        {categories.map((cat) => {
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${isActive ? "text-white" : "text-on-surface-variant hover:text-primary"
                }`}
            >
              <span className="relative z-10">{cat}</span>
              {isActive && (
                <motion.div
                  layoutId="activeFilterIndicator"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Projects Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.4 }}
                className="glass-card rounded-3xl overflow-hidden group flex flex-col h-[560px] hover:border-primary/20 transition-all duration-300 relative shadow-lg"
              >

                {/* Image Cover */}
                <div className="relative w-full h-[200px] overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10 pointer-events-none"></div>
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                  />
                  <div className="absolute top-4 left-4 z-10 bg-surface-container-lowest/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-semibold text-tertiary uppercase select-none">
                    {project.category}
                  </div>
                  {project.featured && (
                    <div className="absolute top-4 right-4 z-10 bg-primary/10 backdrop-blur-md border border-primary/30 px-3.5 py-1.5 rounded-xl font-mono text-[10px] font-semibold text-primary uppercase select-none">
                      Featured
                    </div>
                  )}
                </div>

                {/* Card details */}
                <div className="p-6 lg:p-8 flex flex-col justify-between flex-grow">

                  <div>
                    {(project.startDate || project.endDate) && (
                      <p className="font-mono text-[10px] uppercase tracking-wider text-tertiary mb-2">
                        {formatProjectDate(project.startDate) || "Started"} - {formatProjectDate(project.endDate) || "Present"}
                      </p>
                    )}
                    <h3 className="font-sans text-headline-md font-extrabold text-on-background mb-3 group-hover:text-primary transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="font-sans text-body-md text-on-surface-variant leading-relaxed line-clamp-4">
                      {project.description}
                    </p>
                  </div>

                  <div>
                    {/* Skills Used */}
                    <div className="flex flex-wrap gap-3 mb-6 select-none">
                      {(project.skillNames ?? []).slice(0, 2).map(skill => (
                        <span key={skill} className="bg-tertiary/10 border border-tertiary/30 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-tertiary">
                          {skill}
                        </span>
                      ))}
                      {(project.skillNames ?? []).length > 2 && (
                        <span className="bg-tertiary/10 border border-tertiary/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-tertiary">
                          +{(project.skillNames ?? []).length - 2}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 relative z-10">
                      <Link
                        href={project.slug ? `/projects/${project.slug}` : '#'}
                        className="flex items-center justify-center gap-2 border border-white/10 hover:border-secondary/30 hover:bg-secondary/5 text-on-background px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        <span>Details</span>
                      </Link>
                    </div>
                  </div>

                </div>

              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center select-none">
              <p className="text-on-surface-variant font-sans text-body-lg">
                No projects found in category &quot;{activeTab}&quot;.
              </p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
