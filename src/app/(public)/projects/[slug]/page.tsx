import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, GitBranch } from "lucide-react";
import ProjectGallery from "@/components/public/ProjectGallery";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

async function getProject(slug: string) {
    const response = await fetch(`${BACKEND_API_URL}/projects/${slug}`, {
        next: { revalidate: 60 },
    });

    if (!response.ok) {
        throw new Error("Project not found");
    }

    const json = await response.json();
    return json.data ?? json;
}

function formatDate(value?: string | null) {
    if (!value) return "Present";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export async function generateStaticParams() {
    try {
        const response = await fetch(`${BACKEND_API_URL}/projects`, {
            next: { revalidate: 60 },
        });
        if (!response.ok) return [];
        const json = await response.json();
        const projects = json.data ?? json;
        return (projects ?? []).map((project: any) => ({
            slug: project.slug,
        }));
    } catch {
        return [];
    }
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    let project: any;
    const resolvedParams = await params;

    try {
        project = await getProject(resolvedParams.slug);
    } catch (error) {
        notFound();
    }

    return (
        <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">
            <div className="mb-10">
                <div className="text-left">
                    <p className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3">
                        Project Detail
                    </p>
                    <h1 className="font-sans text-2xl sm:text-3xl lg:text-4xl text-on-background font-extrabold tracking-tight mb-4">
                        {project.title}
                    </h1>
                    <p className="font-sans text-body-lg text-on-surface-variant">
                        {project.category || "General"}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7">
                    {/* Image Slider */}
                    <ProjectGallery mainImage={project.image} screenshots={project.images} />

                    <div className="mt-8 space-y-6">
                        <div className="glass-card p-6 rounded-2xl border border-white/10">
                            <h2 className="font-sans text-body-lg text-on-background font-bold mb-3">Overview</h2>
                            <p className="font-sans text-body-md text-on-surface-variant leading-relaxed">
                                {project.longDescription || project.description}
                            </p>
                        </div>
                    </div>
                </div>

                <aside className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                        <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Project Details</h3>
                        <div className="space-y-4 text-on-surface-variant font-sans text-body-md">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Category</span>
                                <span>{project.category || "N/A"}</span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Status</span>
                                <span>{project.status ?? "Published"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Featured</span>
                                <span>{project.featured ? "Yes" : "No"}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-label-mono text-on-surface-variant">Timeline</span>
                                <span>
                                    {formatDate(project.startDate) || "N/A"} - {project.endDate ? formatDate(project.endDate) : "Present"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {project.skillNames?.length ? (
                        <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                            <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Skills Used</h3>
                            <div className="flex flex-wrap gap-3">
                                {project.skillNames.map((skill: string) => (
                                    <span key={skill} className="bg-tertiary/10 border border-tertiary/30 px-4 py-2.5 rounded-xl text-sm font-semibold text-tertiary">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {project.keyFeatures?.length ? (
                        <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                            <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Key Features</h3>
                            <ul className="grid gap-3">
                                {project.keyFeatures.map((feature: string) => (
                                    <li key={feature} className="flex items-start gap-3 text-on-surface-variant text-sm">
                                        <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">check_circle</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {(project.githubUrl || project.demoUrl) && (
                        <div className="glass-card p-8 rounded-[2rem] border border-white/10">
                            <h3 className="font-sans text-headline-sm font-bold text-primary mb-4">Links</h3>
                            <div className="flex flex-col gap-3">
                                {project.githubUrl && (
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 font-semibold transition-all"
                                    >
                                        <GitBranch size={18} />
                                        <span>View on GitHub</span>
                                    </a>
                                )}
                                {project.demoUrl && (
                                    <a
                                        href={project.demoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/30 hover:bg-tertiary/20 hover:border-tertiary/50 font-semibold transition-all"
                                    >
                                        <ExternalLink size={18} />
                                        <span>View Live Demo</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
