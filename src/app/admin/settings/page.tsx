"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCMS } from "@/services/cmsContext";
import { User } from "lucide-react";
import {
  updateSettingsFormData,
  getSettings as apiGetSettings,
  updatePassword,
  revokeSessions,
  getActiveSessions,
  revokeSession,
  toggleTwoFactor,
} from "@/services/backendApi";
// Settings page config

export default function AdminSettingsPage() {
  const { settings, updateSettings, skills, projects } = useCMS();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Calculate percentage based on project usage
  const calculatePercentage = (skillName: string): number => {
    const projectsUsingSkill = projects.filter(p =>
      (p.skillNames ?? []).some(s => s.toLowerCase() === skillName.toLowerCase())
    ).length;
    return Math.min(projectsUsingSkill * 20, 100);
  };

  // Local states for inputs
  const [name, setName] = useState(settings.name || "");
  const [email, setEmail] = useState(settings.email || "");
  const [title, setTitle] = useState(settings.title || "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || "");
  const [github, setGithub] = useState(settings.github || "");
  const [linkedin, setLinkedin] = useState(settings.linkedin || "");
  const [profileImage, setProfileImage] = useState(settings.profileImage || "");
  const [resumeUrl, setResumeUrl] = useState(settings.resumeUrl || "");
  const [gpa, setGpa] = useState(settings.gpa || "");
  const [autoUpdateSkillBadges, setAutoUpdateSkillBadges] = useState(settings.autoUpdateSkillBadges);
  const [showGitHubActivity, setShowGitHubActivity] = useState(settings.showGitHubActivity);
  const [bio, setBio] = useState(settings.bio || "");
  const [aboutMe, setAboutMe] = useState(settings.aboutMe || "");

  // SEO Settings
  const [metaTitle, setMetaTitle] = useState(settings.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(settings.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(settings.metaKeywords || "");
  const [ogTitle, setOgTitle] = useState(settings.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(settings.ogDescription || "");
  const [ogImage, setOgImage] = useState(settings.ogImage || "");

  // Tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Files & Previews states
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [resumePreview, setResumePreview] = useState<string | null>(null);

  // Status states
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityProcessing, setSecurityProcessing] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorProcessing, setTwoFactorProcessing] = useState(false);

  // Sync state values when settings context loads
  useEffect(() => {
    setName(settings.name || "");
    setEmail(settings.email || "");
    setTitle(settings.title || "");
    setWhatsapp(settings.whatsapp || "");
    setGithub(settings.github || "");
    setLinkedin(settings.linkedin || "");
    setProfileImage(settings.profileImage || "");
    setResumeUrl(settings.resumeUrl || "");
    setGpa(settings.gpa || "");
    setAutoUpdateSkillBadges(settings.autoUpdateSkillBadges);
    setShowGitHubActivity(settings.showGitHubActivity);
    setBio(settings.bio || "");
    setAboutMe(settings.aboutMe || "");
  }, [settings]);

  const loadSecurityData = async () => {
    setSessionsLoading(true);
    setSessionsError(null);

    try {
      const response = await getActiveSessions();
      const sessionData = response?.sessions ?? [];
      const currentId = response?.currentTokenId;
      setActiveSessions(
        sessionData.map((session: any) => ({
          ...session,
          isCurrent: session.id === currentId,
          lastUsedAt: session.last_used_at,
          createdAt: session.created_at,
        }))
      );
      setTwoFactorEnabled(Boolean(response?.twoFactorEnabled));
    } catch (error: any) {
      console.error(error);
      setSessionsError(error?.message || "Unable to load active sessions.");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    loadSecurityData();
  }, []);

  // Handle files change and create local previews
  useEffect(() => {
    let profileUrl: string | null = null;
    let resumeUrlLocal: string | null = null;

    if (profileFile) {
      profileUrl = URL.createObjectURL(profileFile);
      setProfilePreview(profileUrl);
    } else {
      setProfilePreview(profileImage || null);
    }

    if (resumeFile) {
      resumeUrlLocal = URL.createObjectURL(resumeFile);
      setResumePreview(resumeUrlLocal);
    } else {
      setResumePreview(resumeUrl || null);
    }

    return () => {
      if (profileUrl) URL.revokeObjectURL(profileUrl);
      if (resumeUrlLocal) URL.revokeObjectURL(resumeUrlLocal);
    };
  }, [profileFile, resumeFile, profileImage, resumeUrl]);

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setResumeFile(null);
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      const proceed = confirm("File bukan PDF. Disarankan upload PDF. Jika Anda upload .docx, server akan mencoba mengonversi ke PDF. Lanjutkan?");
      if (!proceed) {
        e.currentTarget.value = "";
        setResumeFile(null);
        return;
      }
    }

    setResumeFile(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(null);
    setSaveError(null);

    try {
      if ((profileFile || resumeFile) && settings.id != null) {
        const fd = new FormData();
        fd.append("name", name);
        fd.append("email", email);
        fd.append("title", title);
        fd.append("whatsapp", whatsapp);
        fd.append("github", github);
        fd.append("linkedin", linkedin);
        fd.append("bio", bio);
        fd.append("about_me", aboutMe);
        fd.append("gpa", String(gpa));
        fd.append("auto_update_skill_badges", autoUpdateSkillBadges ? "1" : "0");
        fd.append("show_github_activity", showGitHubActivity ? "1" : "0");
        if (profileFile) fd.append("profile_image", profileFile);
        if (resumeFile) fd.append("resume", resumeFile);

        await updateSettingsFormData(settings.id, fd);

        // Refresh settings from backend
        try {
          const s = await apiGetSettings();
          await updateSettings({
            name: s.name ?? s.site_name,
            title: s.title ?? s.tagline,
            email: s.email,
            whatsapp: s.whatsapp,
            github: s.github,
            linkedin: s.linkedin,
            profileImage: s.profileImage,
            resumeUrl: s.resumeUrl,
            gpa: s.gpa,
            completedProjects: Number(s.completedProjects ?? s.completed_projects ?? 0),
            autoUpdateSkillBadges: Boolean(s.autoUpdateSkillBadges ?? s.auto_update_skill_badges ?? true),
            showGitHubActivity: Boolean(s.showGitHubActivity ?? s.show_github_activity ?? true),
            bio: s.bio,
            aboutMe: s.aboutMe ?? s.about_me,
          }, true);
        } catch (err) {
          console.warn("Failed to refresh settings after upload", err);
        }
        setSavedMessage("Profile successfully synchronized with file uploads.");
      } else {
        await updateSettings({
          name,
          email,
          title,
          whatsapp,
          github,
          linkedin,
          profileImage,
          resumeUrl,
          gpa,
          autoUpdateSkillBadges,
          showGitHubActivity,
          bio,
          aboutMe,
          metaTitle,
          metaDescription,
          metaKeywords,
          ogTitle,
          ogDescription,
          ogImage,
        });
        setSavedMessage("Profile successfully updated in database.");
      }

      setTimeout(() => setSavedMessage(null), 4000);
    } catch (error) {
      console.error(error);
      setSaveError("Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setSecurityStatus(null);
    setSecurityError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityError("Please fill out all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityError("New password and confirmation do not match.");
      return;
    }

    setSecurityProcessing(true);

    try {
      const response = await updatePassword(currentPassword, newPassword, confirmPassword);
      setSecurityStatus(response.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error(error);
      setSecurityError(error?.message || "Failed to update password.");
    } finally {
      setSecurityProcessing(false);
    }
  };

  const handleRevokeSessions = async () => {
    setSecurityStatus(null);
    setSecurityError(null);
    setSecurityProcessing(true);

    try {
      const response = await revokeSessions();
      setSecurityStatus(response.message || "All other sessions have been signed out.");
      await loadSecurityData();
    } catch (error: any) {
      console.error(error);
      setSecurityError(error?.message || "Failed to sign out of other devices.");
    } finally {
      setSecurityProcessing(false);
    }
  };

  const handleToggleTwoFactor = async () => {
    setSecurityStatus(null);
    setSecurityError(null);
    setTwoFactorProcessing(true);

    try {
      const response = await toggleTwoFactor(!twoFactorEnabled);
      setTwoFactorEnabled(response.twoFactorEnabled);
      setSecurityStatus(response.message || "Two-factor authentication setting updated.");
    } catch (error: any) {
      console.error(error);
      setSecurityError(error?.message || "Unable to update two-factor authentication.");
    } finally {
      setTwoFactorProcessing(false);
    }
  };

  const handleRevokeSession = async (tokenId: string) => {
    setSecurityStatus(null);
    setSecurityError(null);
    setSecurityProcessing(true);

    try {
      const response = await revokeSession(tokenId);
      setSecurityStatus(response.message || "Session revoked successfully.");
      await loadSecurityData();
    } catch (error: any) {
      console.error(error);
      setSecurityError(error?.message || "Unable to revoke session.");
    } finally {
      setSecurityProcessing(false);
    }
  };




  return (
    <section className="select-none pb-16">

      {/* Page Header */}
      <div className="flex justify-between items-end mb-8 select-none">
        <div>
          <h2 className="font-sans text-[32px] font-extrabold text-on-surface mb-2 tracking-tight">
            Account Settings
          </h2>
          <p className="text-on-surface-variant text-sm">
            Manage your professional presence, security protocols, and portofolio preferences.
          </p>
        </div>
      </div>

      {saveError && (
        <div className="p-4 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-xl mb-6">
          <div className="font-bold mb-2 text-sm">❌ Error:</div>
          <div className="text-xs whitespace-pre-wrap font-mono bg-black/40 p-2 rounded">
            {saveError}
          </div>
        </div>
      )}
      {savedMessage && (
        <div className="p-4 bg-tertiary/10 border border-tertiary/30 text-tertiary rounded-xl mb-6 text-sm font-bold">
          {savedMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-outline-variant/20 pb-4">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(255,105,180,0.3)]"
              : "bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/10"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab("seo")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            activeTab === "seo"
              ? "bg-tertiary text-on-tertiary shadow-[0_0_15px_rgba(0,255,255,0.3)]"
              : "bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/10"
          }`}
        >
          SEO
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-12 gap-8">
        {activeTab === "profile" && (
          <>
          <div className="col-span-12 lg:col-span-8 space-y-8">

          <form onSubmit={handleSave} className="admin-glass-card rounded-xl p-8 hover:border-primary/30 transition-all duration-300">
            <div className="flex items-center gap-4 mb-8 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-primary text-3xl">person</span>
              <h3 className="font-sans text-[22px] font-extrabold text-on-surface">Profile Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Avatar Display */}
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative group shrink-0 mx-auto md:mx-0 cursor-pointer"
                  title="Click to upload new avatar"
                >
                  {profilePreview ? (
                    <img
                      alt="Deva Gitisari large portrait"
                      className="w-32 h-32 rounded-2xl border-2 border-outline-variant/20 group-hover:border-primary/60 transition-all duration-300 object-cover"
                      src={profilePreview}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl border-2 border-outline-variant/20 group-hover:border-primary/60 transition-all duration-300 bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary/70" />
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-1.5 rounded-lg shadow-xl active:scale-95 transition-transform flex items-center justify-center border-0">
                    <span className="material-symbols-outlined text-sm font-bold">edit</span>
                  </div>
                </div>

                {/* Name & Title fields */}
                <div className="flex-1 w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="settings_name" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Full Name</label>
                      <input
                        id="settings_name"
                        required
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings_title" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Title</label>
                      <input
                        id="settings_title"
                        required
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="settings_bio" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold font-sans">Professional Bio</label>
                    <textarea
                      id="settings_bio"
                      required
                      className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors resize-none leading-relaxed"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="settings_aboutme" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold font-sans">About Me</label>
                    <textarea
                      id="settings_aboutme"
                      className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors resize-none leading-relaxed"
                      rows={8}
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      placeholder="Tell your story in detail. This will be displayed on your About page."
                    />
                  </div>
                </div>
              </div>

              {/* Advanced info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-outline-variant/20 pt-6">
                <div className="space-y-2">
                  <label htmlFor="settings_whatsapp" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">WhatsApp</label>
                  <input
                    id="settings_whatsapp"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_email" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Email Address</label>
                  <input
                    id="settings_email"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="settings_github" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">GitHub</label>
                  <input
                    id="settings_github"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_linkedin" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">LinkedIn</label>
                  <input
                    id="settings_linkedin"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Tech Stack Used</span>
                  <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface flex items-center min-h-[44px]">
                    <span className="font-semibold">{skills.filter(s => calculatePercentage(s.name) > 0).length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_gpa" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">GPA Score</label>
                  <input
                    id="settings_gpa"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                  />
                </div>
              </div>

              {/* Automatic Stats Display */}
              <div className="pt-4 border-t border-outline-variant/20">
                <p className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold mb-4">Automatic Statistics (Read-Only)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Total Projects</span>
                    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface flex items-center min-h-[44px]">
                      <span className="font-semibold">{projects?.length ?? 0}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Full-Stack Projects</span>
                    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-4 py-2.5 text-sm text-on-surface flex items-center min-h-[44px]">
                      <span className="font-semibold">{projects?.filter((p: any) => {
                        const skillNames = p.skillNames ?? [];
                        const hasLanguage = skills.some((s: any) => skillNames.some((sn: string) => sn.toLowerCase() === s.name.toLowerCase()) && s.category === "Language");
                        const hasFramework = skills.some((s: any) => skillNames.some((sn: string) => sn.toLowerCase() === s.name.toLowerCase()) && s.category === "Framework");
                        const hasOther = skills.some((s: any) => skillNames.some((sn: string) => sn.toLowerCase() === s.name.toLowerCase()) && s.category === "Other");
                        return hasLanguage && hasFramework && hasOther;
                      }).length ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files Upload for Profile and Resume */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/20">
                <div className="space-y-2">
                  <label htmlFor="settings_profile_file" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Upload Custom Profile Avatar</label>
                  <input
                    id="settings_profile_file"
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileFile(e.target.files?.[0] ?? null)}
                    value=""
                    className="text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-outline-variant/10 file:text-on-surface hover:file:bg-outline-variant/20 cursor-pointer"
                  />
                  {!profileFile && (
                    <div className="pt-1.5">
                      <label htmlFor="settings_profile_url" className="block text-[9px] font-mono uppercase text-on-surface-variant">Or Avatar Image Link</label>
                      <input
                        id="settings_profile_url"
                        type="text"
                        value={profileImage}
                        onChange={(e) => setProfileImage(e.target.value)}
                        className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-1.5 text-xs text-on-surface"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="settings_resume_file" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Upload Professional Resume (PDF)</label>
                  <input
                    id="settings_resume_file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeFileChange}
                    className="text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-outline-variant/10 file:text-on-surface hover:file:bg-outline-variant/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">Prefer PDF for inline display. Uploading .docx will attempt server-side conversion to PDF.</p>
                  {!resumeFile && (
                    <div className="pt-1.5">
                      <label htmlFor="settings_resume_url" className="block text-[9px] font-mono uppercase text-on-surface-variant">Or PDF URL Link</label>
                      <input
                        id="settings_resume_url"
                        type="text"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-1.5 text-xs text-on-surface"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-outline-variant/20 flex justify-end gap-3 select-none">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-12 py-3.5 bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-sm rounded-lg hover:shadow-[0_0_20px_rgba(255,105,180,0.25)] transition-all duration-300 active:scale-95 disabled:opacity-50 select-none cursor-pointer border-none"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>

            </div>
          </form>

        </div>

        {/* Security & Support Section (4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8 select-none">

          {/* Security details */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">security</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Security Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-on-surface">Credentials Password</h4>
                <p className="text-xs text-on-surface-variant">Last updated: 3 months ago</p>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                  className="w-full py-2.5 rounded-lg border border-outline-variant/20 text-xs font-semibold hover:bg-outline-variant/5 transition-all duration-200 active:scale-95 cursor-pointer bg-transparent"
                >
                  {showPasswordForm ? "Hide Password Form" : "Update Password"}
                </button>

                {showPasswordForm && (
                  <div className="space-y-4 mt-4 rounded-xl bg-surface-container-low border border-outline-variant/30 p-4">
                    <div className="space-y-2">
                      <label htmlFor="settings_current_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Current Password</label>
                      <input
                        id="settings_current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings_new_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">New Password</label>
                      <input
                        id="settings_new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings_confirm_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Confirm New Password</label>
                      <input
                        id="settings_confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordUpdate}
                      disabled={securityProcessing}
                      className="w-full py-2.5 bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-xs rounded-lg hover:shadow-[0_0_15px_rgba(255,105,180,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer border-none"
                    >
                      {securityProcessing ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}
              </div>

              {securityError && (
                <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs">
                  {securityError}
                </div>
              )}
              {securityStatus && (
                <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-xs font-bold">
                  {securityStatus}
                </div>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">devices</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Active Sessions</h3>
            </div>

            {sessionsLoading ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">Loading sessions...</div>
            ) : sessionsError ? (
              <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs mb-4">
                {sessionsError}
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.slice(0, showAllDevices ? undefined : 3).map((session: any) => (
                  <div key={session.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary">computer</span>
                        <span className="text-xs font-semibold text-on-surface">{session.device_type || 'Unknown Device'}</span>
                      </div>
                      {session.isCurrent && (
                        <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-mono font-bold">CURRENT</span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      {session.ip_address || 'Unknown IP'} • {new Date(session.last_used_at).toLocaleDateString()}
                    </div>
                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={securityProcessing}
                        className="mt-2 text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Revoke Session
                      </button>
                    )}
                  </div>
                ))}
                {activeSessions.length > 3 && !showAllDevices && (
                  <button
                    type="button"
                    onClick={() => setShowAllDevices(true)}
                    className="text-[10px] text-secondary hover:text-secondary/80 font-semibold cursor-pointer"
                  >
                    Show All Devices ({activeSessions.length - 3} more)
                  </button>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-outline-variant/20 mt-4">
              <button
                type="button"
                onClick={handleRevokeSessions}
                disabled={securityProcessing}
                className="w-full py-2.5 rounded-lg border border-outline-variant/20 text-xs font-semibold hover:bg-outline-variant/5 transition-all duration-200 active:scale-95 cursor-pointer bg-transparent"
              >
                Sign Out of All Other Devices
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">shield</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Two-Factor Authentication</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-on-surface">Enable 2FA</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTwoFactor}
                  disabled={twoFactorProcessing}
                  className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${twoFactorEnabled ? "bg-secondary/20 border-secondary/40" : "bg-outline-variant/10 border-outline-variant/20"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${twoFactorEnabled ? "right-0.5 bg-secondary" : "left-0.5 bg-on-surface-variant opacity-60"}`} />
                </button>
              </div>

              {securityError && (
                <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs">
                  {securityError}
                </div>
              )}
              {securityStatus && (
                <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-xs font-bold">
                  {securityStatus}
                </div>
              )}
            </div>
          </div>

        </div>
        </>
        )}

        {activeTab === "seo" && (
          <>
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <form onSubmit={handleSave} className="admin-glass-card rounded-xl p-8 hover:border-tertiary/30 transition-all duration-300">
              <div className="flex items-center gap-4 mb-8 select-none border-b border-outline-variant/20 pb-4">
                <span className="material-symbols-outlined text-tertiary text-3xl">search</span>
                <h3 className="font-sans text-[22px] font-extrabold text-on-surface">SEO Settings</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="settings_meta_title" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Meta Title</label>
                  <input
                    id="settings_meta_title"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Default meta title for your portfolio"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_meta_description" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Meta Description</label>
                  <textarea
                    id="settings_meta_description"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors resize-none leading-relaxed"
                    rows={3}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Meta description for search engines"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_meta_keywords" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">Meta Keywords</label>
                  <input
                    id="settings_meta_keywords"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                    type="text"
                    value={metaKeywords}
                    onChange={(e) => setMetaKeywords(e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="settings_og_title" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">OG Title</label>
                    <input
                      id="settings_og_title"
                      className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      type="text"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                      placeholder="Open Graph title"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="settings_og_image" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">OG Image URL</label>
                    <input
                      id="settings_og_image"
                      className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      type="text"
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder="Open Graph image URL"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="settings_og_description" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant pl-1 font-bold">OG Description</label>
                  <textarea
                    id="settings_og_description"
                    className="w-full bg-transparent border border-outline-variant/30 focus:border-tertiary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors resize-none leading-relaxed"
                    rows={2}
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="Open Graph description"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/20 flex justify-end gap-3 select-none">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-12 py-3.5 bg-gradient-to-r from-tertiary to-primary text-white font-extrabold text-sm rounded-lg hover:shadow-[0_0_20px_rgba(0,255,255,0.25)] transition-all duration-300 active:scale-95 disabled:opacity-50 select-none cursor-pointer border-none"
                >
                  {saving ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>

        {/* Security & Support Section (4 columns) */}
        <div className="col-span-12 lg:col-span-4 space-y-8 select-none">

          {/* Security details */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-8 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">security</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Security Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-extrabold text-on-surface">Credentials Password</h4>
                <p className="text-xs text-on-surface-variant">Last updated: 3 months ago</p>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                  className="w-full py-2.5 rounded-lg border border-outline-variant/20 text-xs font-semibold hover:bg-outline-variant/5 transition-all duration-200 active:scale-95 cursor-pointer bg-transparent"
                >
                  {showPasswordForm ? "Hide Password Form" : "Update Password"}
                </button>

                {showPasswordForm && (
                  <div className="space-y-4 mt-4 rounded-xl bg-surface-container-low border border-outline-variant/30 p-4">
                    <div className="space-y-2">
                      <label htmlFor="settings_seo_current_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Current Password</label>
                      <input
                        id="settings_seo_current_password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings_seo_new_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">New Password</label>
                      <input
                        id="settings_seo_new_password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="settings_seo_confirm_password" className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Confirm New Password</label>
                      <input
                        id="settings_seo_confirm_password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-transparent border border-outline-variant/30 focus:border-primary/50 rounded-lg px-4 py-2.5 text-sm text-on-surface focus:ring-0 outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handlePasswordUpdate}
                      disabled={securityProcessing}
                      className="w-full py-2.5 bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-xs rounded-lg hover:shadow-[0_0_15px_rgba(255,105,180,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-50 cursor-pointer border-none"
                    >
                      {securityProcessing ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                )}
              </div>

              {securityError && (
                <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs">
                  {securityError}
                </div>
              )}
              {securityStatus && (
                <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-xs font-bold">
                  {securityStatus}
                </div>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">devices</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Active Sessions</h3>
            </div>

            {sessionsLoading ? (
              <div className="text-center py-8 text-on-surface-variant text-sm">Loading sessions...</div>
            ) : sessionsError ? (
              <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs mb-4">
                {sessionsError}
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.slice(0, showAllDevices ? undefined : 3).map((session: any) => (
                  <div key={session.id} className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-secondary">computer</span>
                        <span className="text-xs font-semibold text-on-surface">{session.device_type || 'Unknown Device'}</span>
                      </div>
                      {session.isCurrent && (
                        <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-mono font-bold">CURRENT</span>
                      )}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      {session.ip_address || 'Unknown IP'} • {new Date(session.last_used_at).toLocaleDateString()}
                    </div>
                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={securityProcessing}
                        className="mt-2 text-[10px] text-red-400 hover:text-red-300 font-semibold cursor-pointer disabled:opacity-50"
                      >
                        Revoke Session
                      </button>
                    )}
                  </div>
                ))}
                {activeSessions.length > 3 && !showAllDevices && (
                  <button
                    type="button"
                    onClick={() => setShowAllDevices(true)}
                    className="text-[10px] text-secondary hover:text-secondary/80 font-semibold cursor-pointer"
                  >
                    Show All Devices ({activeSessions.length - 3} more)
                  </button>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-outline-variant/20 mt-4">
              <button
                type="button"
                onClick={handleRevokeSessions}
                disabled={securityProcessing}
                className="w-full py-2.5 rounded-lg border border-outline-variant/20 text-xs font-semibold hover:bg-outline-variant/5 transition-all duration-200 active:scale-95 cursor-pointer bg-transparent"
              >
                Sign Out of All Other Devices
              </button>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="admin-glass-card rounded-xl p-8 hover:border-secondary/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6 select-none border-b border-outline-variant/20 pb-4">
              <span className="material-symbols-outlined text-secondary text-2xl">shield</span>
              <h3 className="font-sans text-[20px] font-extrabold text-on-surface">Two-Factor Authentication</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-on-surface">Enable 2FA</p>
                  <p className="text-on-surface-variant text-[11px] mt-0.5">Add an extra layer of security to your account</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTwoFactor}
                  disabled={twoFactorProcessing}
                  className={`w-12 h-6 rounded-full relative cursor-pointer border transition-colors ${twoFactorEnabled ? "bg-secondary/20 border-secondary/40" : "bg-outline-variant/10 border-outline-variant/20"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${twoFactorEnabled ? "right-0.5 bg-secondary" : "left-0.5 bg-on-surface-variant opacity-60"}`} />
                </button>
              </div>

              {securityError && (
                <div className="p-3 bg-[#93000a]/20 border border-[#93000a]/40 text-[#ffdad6] rounded-lg text-xs">
                  {securityError}
                </div>
              )}
              {securityStatus && (
                <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-lg text-xs font-bold">
                  {securityStatus}
                </div>
              )}
            </div>
          </div>

        </div>
        </>
        )}

      </div>

    </section>
  );
}