"use client";

import React, { useState, useRef } from "react";
import { useCMS, Certificate } from "@/services/cmsContext";
import PDFPreview from "@/components/PDFPreview";


export default function AdminCertificatesPage() {
    const { certificates, addCertificate, updateCertificate, deleteCertificate } = useCMS();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<{
        title: string;
        issuer: string;
        description: string;
        date: string;
        expiresDate: string;
        credentialUrl: string;
        imageFile: File | null;
        imagePreview: string | null;
    }>({
        title: "",
        issuer: "",
        description: "",
        date: "",
        expiresDate: "",
        credentialUrl: "",
        imageFile: null,
        imagePreview: null,
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const resetForm = () => ({
        title: "",
        issuer: "",
        description: "",
        date: "",
        expiresDate: "",
        credentialUrl: "",
        imageFile: null,
        imagePreview: null,
    });

    const startAdd = () => {
        setEditingId(null);
        setForm(resetForm());
        setShowForm(true);
    };

    const startEdit = (cert: Certificate) => {
        setEditingId(cert.id);
        setForm({
            title: cert.title,
            issuer: cert.issuer,
            description: cert.description ?? "",
            date: cert.date ? new Date(cert.date).toISOString().split('T')[0] : "",
            expiresDate: cert.expiresDate ? new Date(cert.expiresDate).toISOString().split('T')[0] : "",
            credentialUrl: cert.credentialUrl ?? "",
            imageFile: null,
            imagePreview: cert.image ?? null,
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;
        setForm(prev => ({
            ...prev,
            imageFile: file,
            imagePreview: file.type === "application/pdf" ? null : URL.createObjectURL(file),
        }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: any = {
                title: form.title,
                issuer: form.issuer,
                description: form.description || null,
                date: form.date || null,
                expiresDate: form.expiresDate || null,
                credentialUrl: form.credentialUrl || null,
            };
            if (form.imageFile) {
                payload.imageFile = form.imageFile;
            }

            if (editingId) {
                await updateCertificate(editingId, payload);
            } else {
                await addCertificate(payload);
            }
            cancelForm();
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (d?: string | null) => {
        if (!d) return "—";
        const parsed = new Date(d);
        return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    };

    const getCertImageUrl = (cert: Certificate) => {
        return cert.image || null;
    };

    return (
        <section className="select-none pb-16">
            {/* Page Header */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h2 className="font-sans text-[32px] font-extrabold text-on-surface mb-2 tracking-tight">
                        Certificate Management
                    </h2>
                    <p className="text-on-surface-variant text-sm max-w-xl">
                        Manage your certifications and accreditations. Upload badge images and add credential links for public display.
                    </p>
                </div>
                <button
                    onClick={startAdd}
                    className="hidden lg:flex group items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-[0_0_30px_rgba(255,105,180,0.3)] transition-all active:scale-95 cursor-pointer"
                >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
                    <span>Add Certificate</span>
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
                                    {editingId ? "Edit Certificate" : "Add New Certificate"}
                                </h3>
                                <p className="text-on-surface-variant text-sm">Fill in the certificate details and upload a badge image.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="grid grid-cols-12 gap-6">
                            {/* Image Upload */}
                            <div className="col-span-12 md:col-span-4">
                                <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold mb-2">Certificate Image</label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    className={`relative w-full aspect-[4/3] rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex items-center justify-center group ${dragActive
                                        ? "border-primary bg-primary/10"
                                        : "border-outline-variant/30 bg-surface-container-low hover:border-primary/50"
                                        }`}
                                >
                                    {form.imagePreview ? (
                                        <>
                                            <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-[32px]">swap_horiz</span>
                                            </div>
                                        </>
                                    ) : form.imageFile?.type === "application/pdf" ? (
                                        <>
                                            <div className="w-full h-full flex items-center justify-center bg-surface-container-high">
                                                <div className="text-center">
                                                    <span className="material-symbols-outlined text-[48px] text-tertiary">picture_as_pdf</span>
                                                    <p className="text-xs text-on-surface-variant mt-2 font-mono font-bold">{form.imageFile.name}</p>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-[32px]">swap_horiz</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                                            <span className="material-symbols-outlined text-[40px] opacity-40">cloud_upload</span>
                                            <span className="text-xs font-mono">Drop image or PDF or click</span>
                                            <span className="text-[10px] opacity-50">JPG, PNG, WEBP, PDF · max 2MB</span>
                                        </div>
                                    )}
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="col-span-12 md:col-span-8 grid grid-cols-12 gap-6">
                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Certificate Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                        placeholder="e.g. Cloud Fundamentals"
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-6 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Issuing Organization</label>
                                    <input
                                        required
                                        type="text"
                                        value={form.issuer}
                                        onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                        placeholder="e.g. Google / AWS"
                                    />
                                </div>

                                <div className="col-span-12 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors min-h-[100px]"
                                        placeholder="Describe what you learned or achieved..."
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-4 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Issue Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                    />
                                </div>

                                <div className="col-span-12 md:col-span-4 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Expires Date</label>
                                    <input
                                        type="date"
                                        value={form.expiresDate}
                                        onChange={(e) => setForm({ ...form, expiresDate: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                    />
                                    <p className="text-[10px] text-on-surface-variant font-mono">Optional. Leave empty if no expiration.</p>
                                </div>

                                <div className="col-span-12 space-y-2">
                                    <label className="block font-mono text-[11px] uppercase text-on-surface-variant tracking-wider font-bold">Credential URL</label>
                                    <input
                                        type="url"
                                        value={form.credentialUrl}
                                        onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
                                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none transition-colors"
                                        placeholder="https://www.credential.net/..."
                                    />
                                    <p className="text-[10px] text-on-surface-variant font-mono">Optional. Link to verify your credential online.</p>
                                </div>
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
                                    disabled={saving}
                                    className="px-12 py-3 rounded-xl bg-gradient-to-r from-primary to-tertiary text-white font-extrabold text-sm hover:shadow-[0_0_30px_rgba(255,105,180,0.3)] transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : editingId ? "Save Changes" : "Add Certificate"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Certificate Grid */}
            {certificates.length === 0 ? (
                <div className="admin-glass-card rounded-2xl p-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[64px] opacity-30 mb-4 block">workspace_premium</span>
                    <p className="font-sans text-lg font-bold text-on-surface mb-2">No certificates yet</p>
                    <p className="text-sm">Click &quot;Add Certificate&quot; to add your first certification.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => {
                        const imgUrl = getCertImageUrl(cert);
                        return (
                            <div
                                key={cert.id}
                                className="admin-glass-card rounded-2xl overflow-hidden group hover:border-primary/20 transition-all duration-300"
                            >
                                {/* Image Section */}
                                <div className="relative w-full aspect-[16/10] bg-surface-container-highest overflow-hidden">
                                    {imgUrl ? (
                                        imgUrl.toLowerCase().endsWith('.pdf') ? (
                                            <PDFPreview url={imgUrl} />
                                        ) : (
                                            <img
                                                src={imgUrl}
                                                alt={cert.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">image</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                    {/* Sort order badge */}
                                    {/* Removed - sort_order field is no longer used */}

                                    {/* Action buttons */}
                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {imgUrl?.toLowerCase().endsWith('.pdf') && (
                                            <a
                                                href={imgUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 rounded-lg bg-black/50 backdrop-blur-md text-white hover:text-tertiary hover:bg-black/70 transition-all active:scale-95 cursor-pointer"
                                                title="View PDF"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => startEdit(cert)}
                                            className="p-2 rounded-lg bg-black/50 backdrop-blur-md text-white hover:text-primary hover:bg-black/70 transition-all active:scale-95 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => { if (confirm(`Delete "${cert.title}"?`)) deleteCertificate(cert.id); }}
                                            className="p-2 rounded-lg bg-black/50 backdrop-blur-md text-white hover:text-error hover:bg-black/70 transition-all active:scale-95 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="p-5">
                                    <h3 className="font-sans text-base font-extrabold text-on-surface group-hover:text-primary transition-colors mb-1 truncate">
                                        {cert.title}
                                    </h3>
                                    <p className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-3 truncate">
                                        {cert.issuer}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <span className="bg-surface-container-high border border-outline-variant/20 text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                                            {formatDate(cert.date)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {imgUrl?.toLowerCase().endsWith('.pdf') && (
                                                <a
                                                    href={imgUrl}
                                                    download
                                                    className="flex items-center gap-1 text-tertiary text-[11px] font-bold font-mono hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Download PDF"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">download</span>
                                                    PDF
                                                </a>
                                            )}
                                            {cert.credentialUrl && (
                                                <a
                                                    href={cert.credentialUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary text-[11px] font-bold font-mono hover:underline"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                                    Verify
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
