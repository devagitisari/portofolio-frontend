import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Award } from "lucide-react";
import { getCertificate, getCertificates } from "@/services/backendApi";
import PDFPreview from "@/components/PDFPreview";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export async function generateStaticParams() {
    try {
        const response = await fetch(`${BACKEND_API_URL}/certificates`, {
            next: { revalidate: 60 },
        });
        if (!response.ok) return [];
        const json = await response.json();
        const certificates = json.data ?? json;
        return (certificates ?? []).map((cert: any) => ({
            id: String(cert.id),
        }));
    } catch {
        return [];
    }
}

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    let cert: any;

    try {
        cert = await getCertificate(resolvedParams.id);
        console.log("Certificate data:", cert);
    } catch (error) {
        notFound();
    }

    const imgUrl = cert.image || null;

    return (
        <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">
            <div className="mb-10">
                <div className="text-left">
                    <p className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3">
                        Certification Detail
                    </p>
                    <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-on-background font-extrabold tracking-tight mb-4">
                        {cert.title}
                    </h1>
                    <p className="font-sans text-body-lg text-on-surface-variant">
                        {cert.issuer}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7">
                    <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-surface-container-lowest shadow-xl">
                        {imgUrl ? (
                            imgUrl.toLowerCase().endsWith('.pdf') ? (
                                <PDFPreview url={imgUrl} />
                            ) : (
                                <img src={imgUrl} alt={cert.title} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-3 w-full h-full">
                                <Award size={64} className="opacity-30" />
                                <span className="font-mono text-sm opacity-30">No Image Available</span>
                            </div>
                        )}
                    </div>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                        <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Certificate Info</h3>
                        <div className="space-y-4 text-on-surface-variant font-sans text-body-md">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Issuing Organization</span>
                                <span className="font-semibold text-on-surface">{cert.issuer}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Issue Date</span>
                                <span className="font-semibold text-on-surface">
                                    {(cert.date || cert.date_issue) ? new Date(cert.date || cert.date_issue).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                                </span>
                            </div>
                            {(cert.expires_date || cert.expiresDate) && (
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-label-mono text-on-surface-variant">Expires</span>
                                    <span className="font-semibold text-on-surface">
                                        {new Date(cert.expires_date || cert.expiresDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {cert.description && (
                        <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                            <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Description</h3>
                            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                                {cert.description}
                            </p>
                        </div>
                    )}

                    {cert.credential_url && (
                        <div className="glass-card p-8 rounded-[2rem] border border-white/10 space-y-4">
                            <h3 className="font-sans text-headline-sm font-bold text-primary">Verification</h3>
                            <a href={cert.credential_url || cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-3xl border border-white/10 bg-tertiary/10 px-5 py-4 text-tertiary hover:bg-tertiary/20 transition-all">
                                <ExternalLink size={18} />
                                <span>Verify Credential</span>
                            </a>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
