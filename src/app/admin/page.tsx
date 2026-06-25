"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCMS } from "@/services/cmsContext";
import { getAnalyticsOverview } from "@/services/backendApi";

export default function AdminDashboard() {
  const { projects, skills, messages, certificates } = useCMS();
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [systemOnline, setSystemOnline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getAnalyticsOverview();
        setAnalytics(data);
        setSystemOnline(true);
        setLastSyncTime(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to load analytics:", error);
        setSystemOnline(false);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    loadAnalytics();

    // Sync every 30 seconds
    const syncInterval = setInterval(loadAnalytics, 30000);

    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  // Dynamic calculations
  const unreadMessagesCount = messages.filter((m) => !m.read).length;

  // Get top 3 projects for the dashboard preview table
  const recentProjects = projects.slice(0, 3);

  // Get top 3 messages for system activity
  const recentMessages = messages.slice(0, 3);

  // Calculate percentage based on project usage (max 5 projects = 100%)
  const calculatePercentage = (skillName: string): number => {
    const projectsUsingSkill = projects.filter(p =>
      (p.skillNames ?? []).some(s => s.toLowerCase() === skillName.toLowerCase())
    ).length;
    return Math.min(projectsUsingSkill * 20, 100);
  };

  // Get top 8 skills based on calculated percentage for trending skills
  // Only show skills that are used in projects (project_count > 0)
  const topSkills = [...skills]
    .filter(skill => (skill.projectCount ?? 0) > 0)
    .map(skill => ({
      ...skill,
      calculatedPercentage: calculatePercentage(skill.name)
    }))
    .sort((a, b) => b.calculatedPercentage - a.calculatedPercentage)
    .slice(0, 8);

  return (
    <section>

      {/* Header Section */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="font-sans text-[32px] font-extrabold tracking-tight text-on-surface">
            Dashboard
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Welcome back! Here's your portfolio overview.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <p className={`font-mono text-[12px] tracking-wider uppercase font-semibold ${systemOnline ? 'text-tertiary' : 'text-primary'}`}>
              {systemOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
            </p>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-1">
            {lastSyncTime ? `Last sync: ${lastSyncTime}` : 'Syncing...'}
          </p>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">

        {/* Total Projects Card */}
        <div className="admin-glass-card p-3 md:p-4 rounded-xl admin-neon-glow transition-all duration-300 group hover:scale-105 hover:shadow-lg">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-[16px] md:text-[20px]">folder_open</span>
            </div>
            <span className="text-primary font-mono text-[9px] md:text-[11px] font-bold bg-primary/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
              Active
            </span>
          </div>
          <p className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider mb-1">
            Total Projects
          </p>
          <h3 className="text-[20px] md:text-[28px] font-extrabold text-on-surface mt-1 leading-none">
            {projects.length}
          </h3>
          <p className="text-[9px] md:text-[10px] text-on-surface-variant mt-2">
            {projects.filter((p: any) => p.status === 'published').length} published
          </p>
        </div>

        {/* Core Skills Card */}
        <div className="admin-glass-card p-3 md:p-4 rounded-xl admin-neon-glow transition-all duration-300 group hover:scale-105 hover:shadow-lg">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-2 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl text-secondary">
              <span className="material-symbols-outlined text-[16px] md:text-[20px]">psychology</span>
            </div>
            <span className="text-secondary font-mono text-[9px] md:text-[11px] font-bold bg-secondary/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
              Updated
            </span>
          </div>
          <p className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider mb-1">
            Core Skills
          </p>
          <h3 className="text-[20px] md:text-[28px] font-extrabold text-on-surface mt-1 leading-none">
            {skills.filter(s => (s.projectCount ?? 0) > 0).length}
          </h3>
          <p className="text-[9px] md:text-[10px] text-on-surface-variant mt-2">
            Across {new Set(skills.filter((s: any) => (s.projectCount ?? 0) > 0).map((s: any) => s.category)).size} categories
          </p>
        </div>

        {/* Recent Inquiries Card */}
        <div className="admin-glass-card p-3 md:p-4 rounded-xl admin-neon-glow transition-all duration-300 group hover:scale-105 hover:shadow-lg">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-2 bg-gradient-to-br from-tertiary/20 to-tertiary/10 rounded-xl text-tertiary">
              <span className="material-symbols-outlined text-[16px] md:text-[20px]">chat_bubble</span>
            </div>
            {unreadMessagesCount > 0 ? (
              <span className="text-red-400 font-mono text-[9px] md:text-[11px] font-bold bg-red-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full animate-pulse">
                {unreadMessagesCount} New
              </span>
            ) : (
              <span className="text-on-surface-variant font-mono text-[9px] md:text-[11px] font-bold bg-surface-variant/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                0 New
              </span>
            )}
          </div>
          <p className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider mb-1">
            Total Inquiries
          </p>
          <h3 className="text-[20px] md:text-[28px] font-extrabold text-on-surface mt-1 leading-none">
            {messages.length}
          </h3>
          <p className="text-[9px] md:text-[10px] text-on-surface-variant mt-2">
            {messages.filter((m: any) => m.replied).length} replied
          </p>
        </div>

        {/* Certificates Card */}
        <div className="admin-glass-card p-3 md:p-4 rounded-xl admin-neon-glow transition-all duration-300 group hover:scale-105 hover:shadow-lg">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl text-primary">
              <span className="material-symbols-outlined text-[16px] md:text-[20px]">workspace_premium</span>
            </div>
            <span className="text-primary font-mono text-[9px] md:text-[11px] font-bold bg-primary/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
              Verified
            </span>
          </div>
          <p className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider mb-1">
            Certificates
          </p>
          <h3 className="text-[20px] md:text-[28px] font-extrabold text-on-surface mt-1 leading-none">
            {certificates.length}
          </h3>
          <p className="text-[9px] md:text-[10px] text-on-surface-variant mt-2">
            Professional credentials
          </p>
        </div>

      </div>

      {/* Main Dashboard Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

        {/* Analytics Overview */}
        <div className="col-span-12 lg:col-span-4 admin-glass-card rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h4 className="font-sans text-[16px] md:text-[18px] font-extrabold text-on-surface">
              Analytics Overview
            </h4>
            <span className="material-symbols-outlined text-tertiary text-[20px]">analytics</span>
          </div>

          <div className="space-y-3 md:space-y-4">
            {analyticsLoading ? (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">Loading analytics...</div>
            ) : analytics ? (
              <>
                <div className="bg-surface-container-lowest rounded-xl p-3 md:p-4">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-[10px] md:text-xs font-mono text-on-surface-variant uppercase">Total Page Views</span>
                    <span className="text-[10px] md:text-xs font-bold text-secondary">Last 30d</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-on-surface">{analytics.pageViewsLast30Days}</p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-3 md:p-4">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-[10px] md:text-xs font-mono text-on-surface-variant uppercase">Unique Visitors</span>
                    <span className="text-[10px] md:text-xs font-bold text-tertiary">All time</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-on-surface">{analytics.uniqueVisitors}</p>
                </div>

                <div className="bg-surface-container-lowest rounded-xl p-3 md:p-4">
                  <div className="flex justify-between items-center mb-1 md:mb-2">
                    <span className="text-[10px] md:text-xs font-mono text-on-surface-variant uppercase">Contact Form</span>
                    <span className="text-[10px] md:text-xs font-bold text-primary">New</span>
                  </div>
                  <p className="text-xl md:text-2xl font-extrabold text-on-surface">{messages.length}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">No analytics data</div>
            )}
          </div>
        </div>

        {/* Recent Projects Table */}
        <div className="col-span-12 lg:col-span-8 admin-glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 md:p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <h4 className="font-sans text-[16px] md:text-[20px] font-extrabold text-on-surface">
                Recent Projects
              </h4>
              <Link href="/admin/projects" className="text-primary font-mono text-[11px] md:text-[12px] hover:underline font-bold">
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-on-surface-variant font-mono text-[10px] md:text-[11px] border-b border-outline-variant/10 uppercase tracking-wider select-none">
                    <th className="px-4 md:px-6 py-3 md:py-4">Project Name</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Category</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Tags Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentProjects.length > 0 ? (
                    recentProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-outline-variant/5 transition-colors">
                        <td className="px-4 md:px-6 py-3 md:py-4 font-semibold text-xs md:text-sm text-on-surface">{p.title}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-on-surface-variant">{p.category}</td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <span className={`px-2 md:px-3 py-1 ${p.status === "draft" ? "bg-secondary/10 text-secondary border-secondary/20" : "bg-tertiary/10 text-tertiary border-tertiary/20"} border text-[10px] md:text-[11px] rounded-full font-medium select-none capitalize`}>
                            {p.status || "live"}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <span className="text-xs md:text-sm font-mono text-on-surface-variant bg-outline-variant/10 px-2 md:px-2.5 py-1 rounded-lg">
                            {p.skillIds?.length || 0} Tags
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 md:px-6 py-6 md:py-8 text-center text-on-surface-variant font-medium text-xs md:text-sm">
                        No projects available yet. Click "View All" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="col-span-12 lg:col-span-4 admin-glass-card rounded-2xl p-4 md:p-6">
          <h4 className="font-sans text-[16px] md:text-[20px] font-extrabold text-on-surface mb-4 md:mb-6">
            Quick Actions
          </h4>
          <div className="space-y-3 md:space-y-4">

            <Link href="/admin/projects" className="w-full flex items-center justify-between p-3 md:p-4 bg-outline-variant/5 rounded-xl border border-outline-variant/20 hover:border-primary/50 hover:bg-outline-variant/10 transition-all group cursor-pointer">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">add_box</span>
                </div>
                <span className="font-semibold text-xs md:text-sm">Add New Project</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all">chevron_right</span>
            </Link>

            <Link href="/admin/skills" className="w-full flex items-center justify-between p-3 md:p-4 bg-outline-variant/5 rounded-xl border border-outline-variant/20 hover:border-tertiary/50 hover:bg-outline-variant/10 transition-all group cursor-pointer">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-tertiary/10 rounded-lg text-tertiary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">edit_square</span>
                </div>
                <span className="font-semibold text-xs md:text-sm">Manage Skills</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary transition-all">chevron_right</span>
            </Link>

            <Link href="/admin/inbox" className="w-full flex items-center justify-between p-3 md:p-4 bg-outline-variant/5 rounded-xl border border-outline-variant/20 hover:border-secondary/50 hover:bg-outline-variant/10 transition-all group cursor-pointer select-none">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-secondary/10 rounded-lg text-secondary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">mail</span>
                </div>
                <span className="font-semibold text-xs md:text-sm">Check Inbox</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-all">chevron_right</span>
            </Link>

            <Link href="/admin/backup" className="w-full flex items-center justify-between p-3 md:p-4 bg-outline-variant/5 rounded-xl border border-outline-variant/20 hover:border-primary/50 hover:bg-outline-variant/10 transition-all group cursor-pointer select-none">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px] md:text-[20px]">backup</span>
                </div>
                <span className="font-semibold text-xs md:text-sm">Backup Data</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all">chevron_right</span>
            </Link>

          </div>
        </div>

        {/* Trending Skills Card */}
        <div className="col-span-12 lg:col-span-4 admin-glass-card rounded-2xl p-4 md:p-6">
          <h4 className="font-mono text-[10px] md:text-[11px] uppercase tracking-wider text-on-surface-variant mb-3 md:mb-4 font-bold select-none">
            Top Core Skills
          </h4>
          <div className="flex flex-wrap gap-2 md:gap-2.5">
            {topSkills.length > 0 ? (
              topSkills.map((skill, index) => {
                const styles = [
                  "border-primary/30 bg-primary/10 text-primary",
                  "border-secondary/30 bg-secondary/10 text-secondary",
                  "border-tertiary/30 bg-tertiary/10 text-tertiary",
                  "border-outline-variant/20 bg-outline-variant/5 text-on-surface-variant",
                  "border-primary/20 bg-primary/5 text-primary",
                  "border-secondary/20 bg-secondary/5 text-secondary",
                  "border-tertiary/20 bg-tertiary/5 text-tertiary",
                  "border-outline-variant/30 bg-outline-variant/10 text-on-surface"
                ];
                return (
                  <span key={skill.id} className={`px-3 md:px-3.5 py-1 md:py-1.5 rounded-full border text-[11px] md:text-[12px] font-semibold hover:scale-105 transition-transform duration-200 cursor-default ${styles[index] || styles[3]}`}>
                    {skill.name} ({skill.calculatedPercentage}%)
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-on-surface-variant">No skills added yet.</span>
            )}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="col-span-12 lg:col-span-4 admin-glass-card rounded-2xl p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6 border-b border-outline-variant/20 pb-3 md:pb-4 select-none">
            <h4 className="font-sans text-[16px] md:text-[18px] font-extrabold text-on-surface">
              Recent Activity
            </h4>
            <div className="flex gap-2 items-center">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-tertiary shadow-[0_0_8px_var(--color-tertiary)] animate-pulse"></span>
              <span className="font-mono text-[9px] md:text-[10px] text-tertiary uppercase font-bold tracking-wider">Live</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {recentMessages.length > 0 ? (
              recentMessages.slice(0, 3).map((msg, idx) => {
                const colors = [
                  "text-on-surface bg-primary/10 border-primary/20",
                  "text-on-surface bg-tertiary/10 border-tertiary/20",
                  "text-on-surface bg-secondary/10 border-secondary/20"
                ];
                const colorTheme = colors[idx] || colors[0];
                return (
                  <div key={msg.id} className={`p-2.5 md:p-3 rounded-lg border ${colorTheme}`}>
                    <div className="flex justify-between items-start mb-1 md:mb-2">
                      <span className="font-semibold text-[10px] md:text-xs">{msg.name}</span>
                      <span className="text-[9px] md:text-[10px] opacity-70">{new Date().toLocaleDateString()}</span>
                    </div>
                    <p className="text-[10px] md:text-xs opacity-80 line-clamp-2">{msg.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">
                No recent activity
              </div>
            )}
          </div>
        </div>

      </div>

    </section>
  );
}
