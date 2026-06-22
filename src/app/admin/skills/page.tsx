"use client";

import React, { useState } from "react";
import { useCMS, Skill } from "@/services/cmsContext";
import { useToast } from "@/services/toastContext";

function ToggleControl({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative cursor-pointer border transition-colors ${active ? "bg-primary/10 border-primary/30" : "bg-outline-variant/10 border-outline-variant/20"
        }`}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${active ? "right-0.5 bg-primary" : "left-0.5 bg-on-surface-variant opacity-60"
          }`}
      />
    </button>
  );
}

export default function AdminSkillsPage() {
  const { skills, settings, addSkill, deleteSkill, updateSkill, updateSettings } = useCMS();
  const { showSuccess, showError } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Skill>>({
    name: "",
    category: "Language"
  });
  const [searchQuery, setSearchQuery] = useState("");



  const startEdit = (s: Skill) => {
    setEditingId(s.id);
    setForm({ ...s });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;

    const payload = {
      name: form.name.trim(),
      percentage: 50, // Default percentage since it will be auto-calculated
      category: form.category ?? "Language"
    };

    try {
      if (editingId) {
        await updateSkill(editingId, payload);
        showSuccess("Skill updated successfully!");
        setEditingId(null);
      } else {
        await addSkill(payload);
        showSuccess("Skill added successfully!");
      }

      setForm({
        name: "",
        category: "Language"
      });
    } catch (error) {
      showError("Failed to save skill. Please try again.");
      console.error("Error saving skill:", error);
    }
  };

  const discardForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      category: "Language"
    });
  };

  // Group skills by category (only show skills used in projects)
  const languageSkills = skills.filter((s) => s.category === "Language" && (s.calculatedPercentage ?? 0) > 0 && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const frameworkSkills = skills.filter((s) => s.category === "Framework" && (s.calculatedPercentage ?? 0) > 0 && s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const infraSkills = skills.filter((s) => s.category === "Other" && (s.calculatedPercentage ?? 0) > 0 && s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleSetting = (key: "autoUpdateSkillBadges" | "showGitHubActivity") => {
    void updateSettings({ [key]: !settings[key] });
  };

  return (
    <section className="select-none pb-16">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12 select-none">
        <div>
          <h2 className="font-sans text-[32px] font-extrabold text-on-surface mb-2 tracking-tight">
            Skills Management
          </h2>
          <p className="text-on-surface-variant text-sm max-w-xl">
            Fine-tune your technical proficiency levels and roadmap exposure. Changes here reflect instantly across your live portofolio ecosystem.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 select-none">

        {/* Languages Glass Card */}
        <div className="admin-glass-card rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 hover:scale-105 transition-all duration-300 admin-neon-glow border-t-4 border-t-primary">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 md:pb-4 select-none">
            <div>
              <h3 className="font-sans text-[16px] md:text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] md:text-xl">code</span> Languages
              </h3>
              <p className="text-[9px] md:text-[10px] text-on-surface-variant font-mono mt-1">Auto-calculated from projects</p>
            </div>
            <span className="text-[10px] md:text-xs font-mono text-primary font-bold bg-primary/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full">{languageSkills.length}</span>
          </div>
          <div className="space-y-2 md:space-y-3">
            {languageSkills.map((s) => (
              <div key={s.id} className="group bg-surface-container-lowest rounded-xl p-2.5 md:p-3 hover:bg-primary/5 transition-all duration-200 border border-transparent hover:border-primary/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[12px] md:text-sm">terminal</span>
                    </div>
                    <div>
                      <span className="text-[12px] md:text-sm font-semibold text-on-surface block">{s.name}</span>
                      <span className="text-[9px] md:text-[10px] text-primary font-mono">{s.calculatedPercentage || s.percentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(s)} className="text-on-surface-variant hover:text-primary transition-colors p-1 md:p-1.5 rounded-lg hover:bg-primary/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">edit</span>
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { deleteSkill(s.id).then(() => showSuccess("Skill deleted successfully!")).catch(() => showError("Failed to delete skill.")); } }} className="text-on-surface-variant hover:text-red-400 transition-colors p-1 md:p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 md:mt-2 h-1 md:h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-white via-primary to-primary rounded-full shadow-[0_0_10px_rgba(165,231,255,0.5)]" style={{ width: `${s.calculatedPercentage || s.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {languageSkills.length === 0 && (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">
                No languages added yet
              </div>
            )}
          </div>
        </div>

        {/* Frameworks Glass Card */}
        <div className="admin-glass-card rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 hover:scale-105 transition-all duration-300 admin-neon-glow border-t-4 border-t-tertiary">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 md:pb-4 select-none">
            <div>
              <h3 className="font-sans text-[16px] md:text-lg font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] md:text-xl">layers</span> Frameworks
              </h3>
              <p className="text-[9px] md:text-[10px] text-on-surface-variant font-mono mt-1">Auto-calculated from projects</p>
            </div>
            <span className="text-[10px] md:text-xs font-mono text-tertiary font-bold bg-tertiary/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full">{frameworkSkills.length}</span>
          </div>
          <div className="space-y-2 md:space-y-3">
            {frameworkSkills.map((s) => (
              <div key={s.id} className="group bg-surface-container-lowest rounded-xl p-2.5 md:p-3 hover:bg-tertiary/5 transition-all duration-200 border border-transparent hover:border-tertiary/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-gradient-to-br from-tertiary/20 to-tertiary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-tertiary text-[12px] md:text-sm">widgets</span>
                    </div>
                    <div>
                      <span className="text-[12px] md:text-sm font-semibold text-on-surface block">{s.name}</span>
                      <span className="text-[9px] md:text-[10px] text-tertiary font-mono">{s.calculatedPercentage || s.percentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(s)} className="text-on-surface-variant hover:text-tertiary transition-colors p-1 md:p-1.5 rounded-lg hover:bg-tertiary/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">edit</span>
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { deleteSkill(s.id).then(() => showSuccess("Skill deleted successfully!")).catch(() => showError("Failed to delete skill.")); } }} className="text-on-surface-variant hover:text-red-400 transition-colors p-1 md:p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 md:mt-2 h-1 md:h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-white via-tertiary to-tertiary rounded-full shadow-[0_0_10px_rgba(255,105,180,0.5)]" style={{ width: `${s.calculatedPercentage || s.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {frameworkSkills.length === 0 && (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">
                No frameworks added yet
              </div>
            )}
          </div>
        </div>

        {/* Infrastructure/Other Glass Card */}
        <div className="admin-glass-card rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4 hover:scale-105 transition-all duration-300 admin-neon-glow border-t-4 border-t-secondary">
          <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3 md:pb-4 select-none">
            <div>
              <h3 className="font-sans text-[16px] md:text-lg font-bold text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] md:text-xl">dns</span> Other Skills
              </h3>
              <p className="text-[9px] md:text-[10px] text-on-surface-variant font-mono mt-1">Auto-calculated from projects</p>
            </div>
            <span className="text-[10px] md:text-xs font-mono text-secondary font-bold bg-secondary/10 px-2 md:px-3 py-0.5 md:py-1 rounded-full">{infraSkills.length}</span>
          </div>
          <div className="space-y-2 md:space-y-3">
            {infraSkills.map((s) => (
              <div key={s.id} className="group bg-surface-container-lowest rounded-xl p-2.5 md:p-3 hover:bg-secondary/5 transition-all duration-200 border border-transparent hover:border-secondary/20">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-6 md:w-8 h-6 md:h-8 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[12px] md:text-sm">settings</span>
                    </div>
                    <div>
                      <span className="text-[12px] md:text-sm font-semibold text-on-surface block">{s.name}</span>
                      <span className="text-[9px] md:text-[10px] text-secondary font-mono">{s.calculatedPercentage || s.percentage}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(s)} className="text-on-surface-variant hover:text-secondary transition-colors p-1 md:p-1.5 rounded-lg hover:bg-secondary/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">edit</span>
                    </button>
                    <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { deleteSkill(s.id).then(() => showSuccess("Skill deleted successfully!")).catch(() => showError("Failed to delete skill.")); } }} className="text-on-surface-variant hover:text-red-400 transition-colors p-1 md:p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer">
                      <span className="material-symbols-outlined text-[12px] md:text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 md:mt-2 h-1 md:h-1.5 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-white via-secondary-container to-secondary-container rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${s.calculatedPercentage || s.percentage}%` }}></div>
                </div>
              </div>
            ))}
            {infraSkills.length === 0 && (
              <div className="text-center py-6 md:py-8 text-on-surface-variant text-xs md:text-sm">
                No other skills added yet
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Interaction & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Quick Entry Form (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="admin-glass-card rounded-xl p-6 space-y-6">
            <h3 className="font-sans text-[20px] font-extrabold text-on-surface">
              {editingId ? "Modify Roadmap Skill" : "Add Skill to Roadmap"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Skill Name</label>
                <input
                  required
                  className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 py-2 text-sm text-on-surface outline-none transition-colors"
                  type="text"
                  placeholder="e.g. Go Lang"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider">Category</label>
                <select
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  value={form.category || "Language"}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Skill['category'] })}
                >
                  <option value="Language">Languages</option>
                  <option value="Framework">Frameworks</option>
                  <option value="Other">Other Skills</option>
                </select>
              </div>

              {(() => {
                const categoryColor = form.category === "Language" ? "primary" : form.category === "Framework" ? "tertiary" : "secondary";
                const badgeIcon = form.category === "Language" ? "terminal" : form.category === "Framework" ? "layers" : "dns";

                return (
                  <>
                    <div className="space-y-1 pt-2 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                      <div className="text-[10px] font-mono text-on-surface-variant uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs">info</span>
                        Auto-calculated percentage
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Percentages are now automatically calculated based on how many projects use this skill. The more projects that use a skill, the higher the percentage. You no longer need to manually set proficiency levels.
                      </p>
                    </div>
                  </>
                );
              })()}

              <div className="flex gap-2 pt-4 select-none">
                {editingId && (
                  <button
                    onClick={discardForm}
                    type="button"
                    className="flex-1 py-2.5 bg-surface-container border border-outline-variant/20 rounded-lg text-xs font-bold text-on-surface hover:bg-outline-variant/10 transition-all active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-xs rounded-lg hover:shadow-[0_0_20px_rgba(255,105,180,0.2)] transition-all active:scale-95 cursor-pointer"
                >
                  {editingId ? "Save Changes" : "Add to Roadmap"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Skill Distribution Chart (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="admin-glass-card rounded-xl p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8 border-b border-outline-variant/20 pb-4 select-none">
                <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Skill Proficiency Overview</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono font-bold">{skills.length} Skills</span>
                  <span className="px-3 py-1 rounded bg-outline-variant/5 border border-outline-variant/20 text-[10px] text-on-surface-variant font-mono font-bold">FROM DATABASE</span>
                </div>
              </div>

              {/* Dynamic Chart Visualization */}
              <div className="relative h-56 w-full flex items-end justify-between gap-3 pt-10 px-4 select-none">
                {/* Chart Background Lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-5 pointer-events-none">
                  <div className="border-t border-on-surface w-full"></div>
                  <div className="border-t border-on-surface w-full"></div>
                  <div className="border-t border-on-surface w-full"></div>
                  <div className="border-t border-on-surface w-full"></div>
                </div>
                {skills.length > 0 ? (
                  [...skills].filter((s) => (s.calculatedPercentage ?? 0) > 0).sort((a, b) => (b.calculatedPercentage || b.percentage) - (a.calculatedPercentage || a.percentage)).slice(0, 8).map((skill) => {
                    const gradient = skill.category === "Language"
                      ? "from-primary/40 to-primary"
                      : skill.category === "Framework"
                        ? "from-tertiary/40 to-tertiary"
                        : "from-secondary/40 to-secondary";
                    const displayPercentage = skill.calculatedPercentage || skill.percentage;
                    return (
                      <div
                        key={skill.id}
                        className={`flex-1 bg-gradient-to-t ${gradient} rounded-t-lg group relative transition-all duration-300 hover:opacity-90`}
                        style={{ height: `${displayPercentage}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-container text-on-surface px-2 py-1 rounded text-[10px] border border-outline-variant/20 font-mono whitespace-nowrap">
                          {skill.name}: {displayPercentage}%
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
                    No skills data available. Add skills above.
                  </div>
                )}
              </div>
            </div>

            {skills.length > 0 && (
              <div className="flex justify-between mt-4 text-[10px] font-mono text-on-surface-variant px-6 border-t border-outline-variant/20 pt-4 select-none">
                {[...skills].sort((a, b) => b.percentage - a.percentage).slice(0, 8).map((skill) => (
                  <span key={skill.id} className="truncate max-w-[80px] text-center">{skill.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Visibility settings */}
      <div className="max-w-xl mt-8">
        <div className="admin-glass-card rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3 mb-6 select-none border-b border-outline-variant/20 pb-4">
            <span className="material-symbols-outlined text-secondary text-[20px]">visibility</span>
            <h3 className="font-sans text-sm font-bold text-on-surface">Roadmap Visibility Settings</h3>
          </div>
          <div className="space-y-4 font-sans text-xs text-on-surface select-none">

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Auto-update Skill Badges</p>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Sync levels across all portofolio pages</p>
              </div>
              <ToggleControl
                active={settings.autoUpdateSkillBadges}
                onClick={() => toggleSetting("autoUpdateSkillBadges")}
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">Show GitHub Contributions</p>
                <p className="text-on-surface-variant text-[11px] mt-0.5">Display the GitHub contribution graph on home</p>
              </div>
              <ToggleControl
                active={settings.showGitHubActivity}
                onClick={() => toggleSetting("showGitHubActivity")}
              />
            </div>

          </div>
        </div>
      </div>

    </section>
  );
}
