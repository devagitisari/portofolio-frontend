"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  FileText
} from "lucide-react";
import { useCMS } from "@/services/cmsContext";

export default function ExperiencePage() {
  const { experiences } = useCMS();


  const formatDate = (date?: string | null) => {
    if (!date) return "Present";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const timelineItems = experiences.length > 0 ? experiences.map((exp, idx) => {
    const nodeColor = idx % 2 === 0 ? "bg-primary shadow-[0_0_15px_#ff69b4]" : "bg-tertiary shadow-[0_0_15px_#00f7e8]";
    const badgeBg = idx % 2 === 0 ? "bg-primary/10 text-primary" : "bg-tertiary/10 text-tertiary";
    return {
      id: exp.id,
      role: exp.position,
      company: exp.company,
      period: `${formatDate(exp.startDate)} — ${exp.isCurrent ? "Present" : formatDate(exp.endDate)}`,
      color: "border-l-primary",
      nodeColor: nodeColor,
      badgeBg: badgeBg,
      icon: <Briefcase className="text-primary-fixed-dim" size={16} />,
      points: exp.description.split("\n").filter(Boolean),
      certificate: exp.certificate,
    };
  }) : [];

  return (
    <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">

      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3 block">
          Timeline
        </span>
        <h1 className="font-sans text-5xl lg:text-6xl text-on-background font-extrabold tracking-tighter mb-4 leading-none">
          My <span className="text-primary">Journey</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary mx-auto rounded-full mb-6"></div>
        <p className="font-sans text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          An interactive record of my academic milestones, corporate internship experiences, and certified qualifications.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:gap-16 items-start max-w-3xl mx-auto">

        {/* Experience Timeline (Full Width) */}
        <div className="relative">
          <div className="absolute border-l-2 border-primary/20 left-3 sm:left-6 top-4 bottom-4 z-0"></div>

          <div className="space-y-8 sm:space-y-12">
            {timelineItems.length > 0 ? (
              timelineItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="relative pl-10 sm:pl-16 group"
                >
                  {/* Node dot */}
                  <div className={`absolute left-[7px] sm:left-[15px] top-6 w-5 h-5 rounded-full z-10 transition-transform group-hover:scale-125 duration-300 ${item.nodeColor}`}></div>

                  {/* Timeline Card */}
                  <div className={`glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-l-4 ${item.color} hover:shadow-2xl transition-shadow duration-300`}>
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 sm:mb-5 gap-2 select-none">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-white/5 rounded-lg sm:rounded-xl flex items-center justify-center border border-white/10 shrink-0 mt-1">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-sans text-sm sm:text-body-lg font-bold text-on-background group-hover:text-primary transition-colors truncate">
                            {item.role}
                          </h3>
                          <p className="font-mono text-[10px] sm:text-label-mono text-on-surface-variant truncate">
                            {item.company}
                          </p>
                        </div>
                      </div>
                      <span className={`${item.badgeBg} px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold font-mono whitespace-nowrap`}>
                        {item.period}
                      </span>
                    </div>

                    <ul className="space-y-2 sm:space-y-4 text-on-surface-variant font-sans text-sm sm:text-body-md leading-relaxed">
                      {item.points.map((pt, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-2 sm:gap-3.5">
                          <ArrowRight size={14} className="text-primary mt-0.5 sm:mt-1 shrink-0 group-hover:translate-x-1 transition-transform hidden sm:block" />
                          <ArrowRight size={12} className="text-primary mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform sm:hidden" />
                          <span className="text-xs sm:text-base">{pt}</span>
                        </li>
                      ))}
                    </ul>

                    {item.certificate && (
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-primary/30 flex justify-end">
                        <a
                          href={item.certificate}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/30 hover:border-primary/50 font-semibold text-xs sm:text-sm group/link"
                        >
                          <FileText size={14} className="hidden sm:block" />
                          <FileText size={12} className="sm:hidden" />
                          <span>View Certificate</span>
                          <ArrowRight size={12} className="group-hover/link:translate-x-1 transition-transform hidden sm:block" />
                          <ArrowRight size={10} className="group-hover/link:translate-x-0.5 transition-transform sm:hidden" />
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="py-16 text-center text-on-surface-variant font-sans text-body-lg">
                No experience entries found yet.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
