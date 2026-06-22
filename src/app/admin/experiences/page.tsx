"use client";

import React, { useState } from "react";
import { useCMS, Experience } from "@/services/cmsContext";

export default function AdminExperiencesPage() {
    const { experiences, addExperience, updateExperience, deleteExperience } = useCMS();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Omit<Experience, "id">>({
        company: "",
        position: "",
        description: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
    });
    const [certificateFile, setCertificateFile] = useState<File | null>(null);

    const startAdd = () => {
        setEditingId(null);
        setForm({ company: "", position: "", description: "", startDate: "", endDate: "", isCurrent: false });
        setCertificateFile(null);
        setShowForm(true);
    };

    const startEdit = (exp: Experience) => {
        setEditingId(exp.id);
        const formatDateForInput = (dateString?: string | null) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        setForm({
            company: exp.company,
            position: exp.position,
            description: exp.description,
            startDate: formatDateForInput(exp.startDate),
            endDate: formatDateForInput(exp.endDate),
            isCurrent: exp.isCurrent,
        });
        setCertificateFile(null);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
        setCertificateFile(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            await updateExperience(editingId, { ...form, certificateFile });
        } else {
            await addExperience({ ...form, certificateFile });
        }
        cancelForm();
    };

    const formatDate = (d?: string | null) => {
        if (!d) return "Present";
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    return (
        <section className="select-none pb-16">

            {/* Page Header */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="font-sans text-[32px] font-extrabold text-on-surface mb-2 tracking-tight">
                        Experience Management
                    </h2>
                    <p className="text-on-surface-variant text-sm max-w-xl">
                        Manage your professional journey and career milestones. Changes reflect instantly on your public portofolio.
                    </p>
                </div>
                <button
                    onClick={startAdd}
                    className="hidden lg:flex group items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-[0_0_30px_rgba(255,105,180,0.3)] transition-all active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
                    <span>Add Experience</span>
                </button>
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <div className="admin-glass-card rounded-2xl p-8 border-dashed border-2 border-primary/30 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8 select-none">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-[28px]">
                                    {editingId ? "edit_note" : "add_circle"}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-sans text-[22px] font-extrabold text-on-surface">
                                    {editingId ? "Edit Experience" : "Add New Experience"}
                                </h3>
                                <p className="text-on-surface-variant text-sm">Fill in your professional or academic experience details.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 md:col-span-6 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Company / Institution</label>
                                <input
                                    required
                                    type="text"
                                    value={form.company}
                                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                    placeholder="e.g. PT. Tech Solutions"
                                />
                            </div>

                            <div className="col-span-12 md:col-span-6 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Position / Role</label>
                                <input
                                    required
                                    type="text"
                                    value={form.position}
                                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                    placeholder="e.g. Frontend Developer Intern"
                                />
                            </div>

                            <div className="col-span-12 md:col-span-4 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Start Date</label>
                                <input
                                    required
                                    type="date"
                                    value={form.startDate}
                                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                />
                            </div>

                            <div className="col-span-12 md:col-span-4 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">End Date</label>
                                <input
                                    type="date"
                                    value={form.endDate ?? ""}
                                    disabled={form.isCurrent}
                                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors disabled:opacity-40"
                                />
                            </div>

                            <div className="col-span-12 md:col-span-4 flex items-end pb-1">
                                <label className="flex items-center gap-3 cursor-pointer select-none group">
                                    <div
                                        onClick={() => setForm({ ...form, isCurrent: !form.isCurrent, endDate: !form.isCurrent ? "" : form.endDate })}
                                        className={`w-10 h-5 rounded-full transition-all duration-300 relative ${form.isCurrent ? "bg-primary" : "bg-surface-container-highest"}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-300 ${form.isCurrent ? "left-5" : "left-0.5"}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Currently Working Here</span>
                                </label>
                            </div>

                            <div className="col-span-12 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Certificate (PDF/Image)</label>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2 text-sm text-on-surface outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {editingId && experiences.find((e) => e.id === editingId)?.certificate && (
                                    <p className="text-[10px] text-on-surface-variant mt-1">Current: <a href={experiences.find((e) => e.id === editingId)?.certificate!} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Certificate</a> (Uploading a new file will replace this)</p>
                                )}
                            </div>

                            <div className="col-span-12 space-y-2">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Description</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors resize-none"
                                    placeholder="Describe your responsibilities and achievements. Use new lines for bullet points."
                                />
                                <p className="text-[10px] text-on-surface-variant font-mono">Tip: Use new lines to create bullet points on the public portofolio.</p>
                            </div>

                            <div className="col-span-12 flex justify-end gap-4 border-t border-outline-variant/20 pt-6">
                                <button
                                    type="button"
                                    onClick={cancelForm}
                                    className="px-8 py-3 rounded-xl bg-surface-container text-on-surface font-bold hover:bg-surface-container-high transition-all active:scale-95 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-12 py-3 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-sm hover:shadow-[0_0_30px_rgba(255,105,180,0.3)] transition-all active:scale-95 cursor-pointer"
                                >
                                    {editingId ? "Save Changes" : "Add Experience"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Experience List */}
            {experiences.length === 0 ? (
                <div className="admin-glass-card rounded-2xl p-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[64px] opacity-30 mb-4 block">history</span>
                    <p className="font-sans text-lg font-bold text-on-surface mb-2">No experiences yet</p>
                    <p className="text-sm">Click "Add Experience" to add your first entry.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-6 top-4 bottom-4 border-l-2 border-primary/20 z-0" />
                    <div className="space-y-6">
                        {experiences.map((exp, idx) => (
                            <div key={exp.id} className="relative pl-16 group">
                                {/* Timeline dot */}
                                <div className={`absolute left-[15px] top-6 w-5 h-5 rounded-full z-10 transition-transform group-hover:scale-125 duration-300 ${idx % 2 === 0 ? "bg-primary shadow-[0_0_12px_rgba(255,105,180,0.6)]" : "bg-tertiary shadow-[0_0_12px_rgba(0,247,232,0.6)]"}`} />

                                <div className="admin-glass-card p-6 rounded-2xl hover:border-primary/20 transition-all duration-300">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-sans text-lg font-extrabold text-on-surface group-hover:text-primary transition-colors mb-1">
                                                    {exp.position}
                                                </h3>
                                                <p className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">{exp.company}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => startEdit(exp)}
                                                    className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(`Delete "${exp.position}" at ${exp.company}?`)) deleteExperience(exp.id); }}
                                                    className="p-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="bg-surface-container-high border border-outline-variant/20 text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold font-mono">
                                                {formatDate(exp.startDate)} — {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                                            </span>
                                            {exp.isCurrent && (
                                                <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold font-mono animate-pulse">
                                                    CURRENT
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {exp.description.split("\n").filter(Boolean).map((line, lIdx) => (
                                                <div key={lIdx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                                                    <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">arrow_right</span>
                                                    <span>{line}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {exp.certificate && (
                                            <a
                                                href={exp.certificate}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-tertiary text-xs font-bold font-mono hover:underline"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">description</span>
                                                View Certificate
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
