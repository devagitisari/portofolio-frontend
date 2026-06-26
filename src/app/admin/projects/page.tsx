"use client";

import React, { useState, useEffect } from "react";
import { useCMS, Project } from "@/services/cmsContext";

export default function AdminProjectsPage() {
  const { projects, skills, addProject, deleteProject, updateProject } = useCMS();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // Forms states
  const [form, setForm] = useState<Partial<Project>>({});
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [galleryFileMap, setGalleryFileMap] = useState<Record<string, File[]>>({});
  const [galleryPreviewMap, setGalleryPreviewMap] = useState<Record<string, string[]>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string | null>>({});
  const [deletedImageIds, setDeletedImageIds] = useState<Set<string>>(new Set());


  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(previewMap).forEach((u) => {
        if (u) {
          try { URL.revokeObjectURL(u); } catch { }
        }
      });
      Object.values(galleryPreviewMap).flat().forEach((u) => {
        try { URL.revokeObjectURL(u); } catch { }
      });
    };
  }, [previewMap, galleryPreviewMap]);

  const startAdd = () => {
    setShowAddForm(true);
    setEditingId(null);
    setForm({
      title: "",
      category: "Web Development",
      description: "",
      skillIds: [],
      image: "",
      longDescription: "",
      githubUrl: "",
      demoUrl: "",
      startDate: "",
      endDate: "",
      status: "published",
      featured: false,
      projectRole: "",
      keyFeatures: [],
      imageUrls: [],
    });
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setShowAddForm(false);
    setForm({ ...p });
    setGalleryFileMap({});
    setGalleryPreviewMap({});
    setDeletedImageIds(new Set());
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setForm({});
    setGalleryFileMap({});
    setGalleryPreviewMap({});
    setDeletedImageIds(new Set());
  };


  const saveFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Omit<Project, "id"> = {
      title: form.title ?? "Untitled Project",
      category: form.category ?? "Web Development",
      description: form.description ?? "",
      skillIds: form.skillIds ?? [],
      image: form.image ?? "",
      longDescription: form.longDescription ?? "",
      githubUrl: form.githubUrl ?? "",
      demoUrl: form.demoUrl ?? "",
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      status: form.status ?? "published",
      featured: Boolean(form.featured),
      projectRole: form.projectRole ?? "",
      keyFeatures: form.keyFeatures ?? [],
      imageUrls: form.imageUrls ?? [],
    };

    if (editingId) {
      const f = fileMap[editingId];
      if (f) (payload as any).thumbnailFile = f;
      (payload as any).galleryFiles = galleryFileMap[editingId] ?? [];
      (payload as any).deletedImageIds = Array.from(deletedImageIds);
      await updateProject(editingId, payload);
    } else {
      const f = fileMap["new_file"];
      if (f) (payload as any).thumbnailFile = f;
      (payload as any).galleryFiles = galleryFileMap["new_file"] ?? [];
      await addProject(payload);
    }

    cancelForm();
  };

  const formatProjectDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) =>
    project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Sort by start date (newest first)
    const dateA = new Date(a.startDate || 0);
    const dateB = new Date(b.startDate || 0);
    return dateB.getTime() - dateA.getTime();
  });

  // Toggle project selection
  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Select all visible projects
  const toggleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map((p) => p.id)));
    }
  };

  // Bulk delete projects
  const handleBulkDelete = () => {
    if (selectedProjects.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedProjects.size} project(s)?`)) {
      selectedProjects.forEach((id) => deleteProject(id));
      setSelectedProjects(new Set());
    }
  };

  return (
    <section className="select-none pb-16">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12 select-none">
        <div>
          <h2 className="font-sans text-[32px] font-extrabold text-on-surface mb-2 tracking-tight">
            Projects Management
          </h2>
          <p className="text-on-surface-variant text-sm">
            Oversee and update your technical portofolio deployments.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button
            onClick={startAdd}
            className="hidden lg:flex group items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-[0_0_20px_rgba(255,105,180,0.25)] transition-all active:scale-95 select-none cursor-pointer border-none whitespace-nowrap"
          >
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">
              add
            </span>
            <span>Add New Project</span>
          </button>
        </div>
      </div>

      {/* Statistics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 select-none">
        <div className="admin-glass-card p-3 md:p-4 rounded-xl">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-1.5 rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">rocket_launch</span>
            </div>
            <span className="text-primary font-mono text-[9px] md:text-[10px] font-bold">Active</span>
          </div>
          <h4 className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider">Total Projects</h4>
          <p className="text-[20px] md:text-[24px] font-extrabold text-on-surface mt-1">{projects.length}</p>
        </div>

        <div className="admin-glass-card p-3 md:p-4 rounded-xl">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-1.5 rounded-lg bg-tertiary/10 text-tertiary">
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">category</span>
            </div>
            <span className="text-tertiary font-mono text-[9px] md:text-[10px] font-bold">Synced</span>
          </div>
          <h4 className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider">Categories</h4>
          <p className="text-[20px] md:text-[24px] font-extrabold text-on-surface mt-1">{new Set(projects.map(p => p.category)).size}</p>
        </div>

        <div className="admin-glass-card p-3 md:p-4 rounded-xl">
          <div className="flex justify-between items-start mb-1 md:mb-2">
            <div className="p-1 md:p-1.5 rounded-lg bg-secondary/10 text-secondary">
              <span className="material-symbols-outlined text-[16px] md:text-[18px]">label</span>
            </div>
            <span className="text-secondary font-mono text-[9px] md:text-[10px] font-bold">Total</span>
          </div>
          <h4 className="text-on-surface-variant font-mono text-[9px] md:text-[10px] uppercase tracking-wider">Tech Stack Used</h4>
          <p className="text-[20px] md:text-[24px] font-extrabold text-on-surface mt-1">{new Set(projects.flatMap(p => p.skillIds ?? [])).size}</p>
        </div>
      </div>

      {/* Add / Edit Form Panel Overlay */}
      {(showAddForm || editingId) && (
        <div className="admin-glass-card rounded-2xl p-8 border-dashed border-2 border-primary/30 mb-12 relative overflow-hidden transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8 select-none">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  {editingId ? "edit_note" : "cloud_upload"}
                </span>
              </div>
              <div>
                <h3 className="font-sans text-[22px] font-extrabold text-on-surface">
                  {editingId ? "Modify Deployment Details" : "Upload New Deployment"}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  Configure details for your portofolio showcases.
                </p>
              </div>
            </div>

            <form onSubmit={saveFormSubmit} className="grid grid-cols-12 gap-8">
              {/* Left Column (Inputs) */}
              <div className="col-span-12 md:col-span-6 space-y-6">
                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Project Title
                  </label>
                  <input
                    required
                    type="text"
                    value={form.title || ""}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-on-surface focus:ring-0 transition-all text-sm placeholder:text-neutral-700"
                    placeholder="e.g., Quantum Ledger Dashboard"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Category
                  </label>
                  <select
                    value={form.category || ""}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Internet of Things">Internet of Things</option>
                    <option value="Data Science">Data Science</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Status
                    </label>
                    <select
                      value={form.status || "published"}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-3 py-2 text-sm text-on-surface focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Featured Project
                    </label>
                    <label className="flex items-center gap-3 rounded-lg border border-outline-variant/20 bg-surface-container px-3 py-2 text-sm text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(form.featured)}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="font-bold">Mark as Featured</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Project Role
                  </label>
                  <input
                    type="text"
                    value={form.projectRole || ""}
                    onChange={(e) => setForm({ ...form, projectRole: e.target.value })}
                    className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-sm text-on-surface focus:ring-0"
                    placeholder="e.g., Fullstack Developer, UI/UX Designer"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Short Description
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-on-surface focus:ring-0 transition-all text-sm placeholder:text-neutral-700 resize-none"
                    placeholder="Brief description of the challenge and solution..."
                  />
                </div>

                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Long Detailed Description
                    </label>
                    <textarea
                      rows={4}
                      value={form.longDescription || ""}
                      onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                      className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-on-surface focus:ring-0 transition-all text-sm placeholder:text-neutral-700 resize-none"
                      placeholder="Full project case study details, stack architecture, features..."
                    />
                  </div>
              </div>

              {/* Right Column (Upload & Tags) */}
              <div className="col-span-12 md:col-span-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Demo URL
                    </label>
                    <input
                      type="url"
                      value={form.demoUrl || ""}
                      onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                      className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-sm text-on-surface focus:ring-0"
                      placeholder="https://demo..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      {form.category === "Data Science" ? "Journal Link" : form.category === "Internet of Things" ? "Documentation Link" : form.category === "UI/UX Design" ? "Figma Link" : "Github Link"}
                    </label>
                    <input
                      type="url"
                      value={form.githubUrl || ""}
                      onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                      className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-sm text-on-surface focus:ring-0"
                      placeholder={form.category === "Data Science" ? "https://journal..." : form.category === "Internet of Things" ? "https://docs..." : form.category === "UI/UX Design" ? "https://figma..." : "https://github..."}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={form.startDate || ""}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-sm text-on-surface focus:ring-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate || ""}
                      min={form.startDate || undefined}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-3 text-sm text-on-surface focus:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Thumbnail Upload
                  </label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-grow">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          const key = editingId ?? "new_file";
                          setFileMap({ ...fileMap, [key]: file });
                          if (file) {
                            const u = URL.createObjectURL(file);
                            setPreviewMap({ ...previewMap, [key]: u });
                          }
                        }}
                        className="text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-outline-variant/10 file:text-on-surface hover:file:bg-outline-variant/20 cursor-pointer"
                      />
                    </div>
                    {previewMap[editingId ?? "new_file"] ? (
                      <img src={previewMap[editingId ?? "new_file"] as string} className="w-16 h-12 object-cover rounded-lg border border-outline-variant/30" alt="Preview" />
                    ) : form.image ? (
                      <img src={form.image} className="w-16 h-12 object-cover rounded-lg border border-outline-variant/30" alt="Current" />
                    ) : null}
                  </div>
                  {!fileMap[editingId ?? "new_file"] && (
                    <div className="pt-2">
                      <label className="block font-mono text-[10px] uppercase text-on-surface-variant select-none">Or Image URL</label>
                      <input
                        type="text"
                        value={form.image || ""}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-2 text-xs text-on-surface"
                        placeholder="Paste image link directly..."
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Project Screenshots Gallery
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const key = editingId ?? "new_file";
                      const existingFiles = galleryFileMap[key] ?? [];
                      const existingPreviews = galleryPreviewMap[key] ?? [];
                      setGalleryFileMap({ ...galleryFileMap, [key]: [...existingFiles, ...files] });
                      setGalleryPreviewMap({
                        ...galleryPreviewMap,
                        [key]: [...existingPreviews, ...files.map((file) => URL.createObjectURL(file))],
                      });
                    }}
                    className="text-xs text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-outline-variant/10 file:text-on-surface hover:file:bg-outline-variant/20 cursor-pointer"
                  />
                  <textarea
                    rows={3}
                    value={(form.imageUrls ?? []).join("\n")}
                    onChange={(e) => setForm({
                      ...form,
                      imageUrls: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    })}
                    className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-2 text-xs text-on-surface resize-none"
                    placeholder="Optional: paste multiple image URLs, one per line"
                  />
                  <div className="grid grid-cols-4 gap-2">
                    {(galleryPreviewMap[editingId ?? "new_file"] ?? []).map((src, idx) => (
                      <div key={src} className="relative group">
                        <img src={src} className="h-16 w-full rounded-lg object-cover border border-outline-variant/30" alt="Gallery preview" />
                        <button
                          type="button"
                          onClick={() => {
                            const key = editingId ?? "new_file";
                            const newFiles = (galleryFileMap[key] ?? []).filter((_, i) => i !== idx);
                            const newPreviews = (galleryPreviewMap[key] ?? []).filter((_, i) => i !== idx);
                            setGalleryFileMap({ ...galleryFileMap, [key]: newFiles });
                            setGalleryPreviewMap({ ...galleryPreviewMap, [key]: newPreviews });
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}
                    {(form.images ?? [])
                      .filter((image) => !deletedImageIds.has(String(image.id)))
                      .slice(0, 4)
                      .map((image) => (
                      <div key={String(image.id ?? image.image)} className="relative group">
                        <img src={image.image} className="h-16 w-full rounded-lg object-cover border border-outline-variant/30" alt="Existing gallery" />
                        <button
                          type="button"
                          onClick={() => {
                            if (image.id) {
                              setDeletedImageIds(new Set([...deletedImageIds, String(image.id)]));
                            }
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>


                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                    Key Features
                  </label>
                  <textarea
                    rows={4}
                    value={(form.keyFeatures ?? []).join("\n")}
                    onChange={(e) => setForm({
                      ...form,
                      keyFeatures: e.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                    })}
                    className="w-full bg-transparent border-b border-outline-variant/30 focus:border-primary/50 border-t-0 border-x-0 outline-none px-0 py-2 text-xs text-on-surface resize-none"
                    placeholder="Realtime dashboard&#10;Admin CMS&#10;Responsive UI"
                  />
                </div>

                {/* Skills Multi-Select */}
                {skills.length > 0 && (
                  <div className="space-y-2">
                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold select-none">
                      Skills Used in This Project
                    </label>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {skills.map((skill) => {
                        const isSelected = (form.skillIds ?? []).includes(String(skill.id));
                        return (
                          <button
                            key={skill.id}
                            type="button"
                            onClick={() => {
                              const currentIds = form.skillIds ?? [];
                              const sid = String(skill.id);
                              if (isSelected) {
                                setForm({ ...form, skillIds: currentIds.filter((id) => id !== sid) });
                              } else {
                                setForm({ ...form, skillIds: [...currentIds, sid] });
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer select-none whitespace-nowrap ${isSelected
                              ? "bg-tertiary/20 text-tertiary border-tertiary/40 shadow-[0_0_8px_rgba(139,92,246,0.15)]"
                              : "bg-surface-container text-on-surface-variant border-outline-variant/20 hover:border-tertiary/30 hover:text-tertiary"
                              }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">
                                {isSelected ? "check_circle" : "radio_button_unchecked"}
                              </span>
                              {skill.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {(form.skillIds ?? []).length > 0 && (
                      <p className="text-[10px] text-on-surface-variant pt-1">
                        {(form.skillIds ?? []).length} skill(s) selected
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="col-span-12 flex justify-end gap-4 mt-6 border-t border-outline-variant/20 pt-6 select-none">
                <button
                  onClick={cancelForm}
                  type="button"
                  className="px-8 py-3 rounded-xl bg-outline-variant/10 text-on-surface font-bold hover:bg-outline-variant/20 transition-all duration-200 active:scale-95 cursor-pointer border-none"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-12 py-3 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-sm hover:shadow-[0_0_20px_rgba(255,105,180,0.25)] transition-all duration-300 active:scale-95 cursor-pointer border-none"
                >
                  {editingId ? "Save Modifications" : "Publish Deployment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Grid Container */}
      <div className="grid grid-cols-12 gap-8 select-none">
        {filteredProjects.length > 0 ? (
          <>
            {/* Select All Checkbox */}
            {filteredProjects.length > 0 && (
              <div className="col-span-12 flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  checked={selectedProjects.size === filteredProjects.length}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 accent-primary cursor-pointer"
                />
                <span className="text-sm text-on-surface-variant">
                  {selectedProjects.size === filteredProjects.length ? "Deselect All" : "Select All"} ({filteredProjects.length} projects)
                </span>
              </div>
            )}
            {filteredProjects.map((p) => (
          <div
            key={p.id}
            className={`col-span-12 lg:col-span-6 admin-glass-card rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-[0_0_40px_rgba(255,105,180,0.1)] border transition-all duration-300 ${selectedProjects.has(p.id) ? "border-primary/50 bg-primary/5" : "border-outline-variant/20 hover:border-primary/30"}`}
          >
            {/* Card Thumbnail */}
            <div className="h-56 relative overflow-hidden shrink-0 select-none border-b border-outline-variant/20">
              <input
                type="checkbox"
                checked={selectedProjects.has(p.id)}
                onChange={() => toggleProjectSelection(p.id)}
                className="absolute top-4 left-4 z-10 h-5 w-5 accent-primary cursor-pointer"
              />
              <img
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                alt={p.title}
                src={p.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-65"></div>
              <div className="absolute top-4 left-12">
                <span className="px-3 py-1 rounded-full bg-tertiary/10 text-tertiary border border-tertiary/30 text-xs font-bold backdrop-blur-md">
                  {p.status === "draft" ? "Draft" : "Published"}
                </span>
              </div>
              {p.featured && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 text-xs font-bold backdrop-blur-md">
                    Featured
                  </span>
                </div>
              )}
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div>
                    <span className="text-tertiary font-mono text-[10px] uppercase tracking-wider font-semibold">
                      {p.category}
                    </span>
                    <h3 className="font-sans text-xl font-extrabold text-on-surface group-hover:text-primary transition-colors leading-tight">
                      {p.title}
                    </h3>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 shrink-0 select-none">
                    <button
                      onClick={() => startEdit(p)}
                      className="p-1.5 rounded-lg bg-outline-variant/10 text-on-surface-variant hover:text-primary hover:bg-outline-variant/20 transition-all active:scale-95 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => { if (confirm("Are you sure you want to delete this project?")) deleteProject(p.id); }}
                      className="p-1.5 rounded-lg bg-outline-variant/10 text-on-surface-variant hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95 cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-on-surface-variant text-xs leading-relaxed mb-6 line-clamp-3">
                  {p.description}
                </p>
              </div>

              {/* Skills Cloud & Timestamp Footer */}
              <div className="flex flex-col gap-4 border-t border-outline-variant/20 pt-4">
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {(p.skillNames ?? []).slice(0, 5).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/20 text-on-surface-variant font-mono text-[9px] select-none whitespace-nowrap">
                      {skill}
                    </span>
                  ))}
                  {(p.skillNames ?? []).length > 5 && (
                    <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/20 text-on-surface-variant font-mono text-[9px] select-none">
                      +{(p.skillNames ?? []).length - 5}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant select-none">
                  <span>
                    {(p.startDate || p.endDate)
                      ? `${formatProjectDate(p.startDate) || "Started"} - ${formatProjectDate(p.endDate) || "Present"}`
                      : "TIMELINE: NOT SET"}
                  </span>
                  <span>2h ago</span>
                </div>
              </div>
            </div>

          </div>
        ))}
          </>
        ) : (
          <div className="col-span-12 text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">search_off</span>
              <p className="text-on-surface-variant font-medium">No projects found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-bold hover:shadow-[0_0_15px_rgba(255,105,180,0.3)] transition-all cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) - Mobile & Tablet Only */}
      <button
        onClick={startAdd}
        className="lg:hidden fixed bottom-4 right-4 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-on-primary flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 cursor-pointer border-0"
      >
        <span className="material-symbols-outlined text-[28px] font-bold">add</span>
      </button>

    </section>
  );
}
