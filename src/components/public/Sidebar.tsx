"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, GitBranch, Share2, Mail, Menu, X } from "lucide-react";
import { useCMS } from "@/services/cmsContext";

export default function Sidebar() {
    const { settings } = useCMS();
    const [open, setOpen] = useState(false);

    const socialLinks = [
        {
            name: "GitHub",
            icon: GitBranch,
            url: settings.github || "https://github.com",
            color: "hover:text-primary hover:shadow-[0_0_15px_rgba(165,231,255,0.4)]",
        },
        {
            name: "LinkedIn",
            icon: Briefcase,
            url: settings.linkedin || "https://linkedin.com",
            color: "hover:text-secondary hover:shadow-[0_0_15px_rgba(237,177,255,0.4)]",
        },
        {
            name: "Share",
            icon: Share2,
            url: "#",
            color: "hover:text-tertiary hover:shadow-[0_0_15px_rgba(0,247,232,0.4)]",
        },
        {
            name: "Email",
            icon: Mail,
            url: settings.email ? `mailto:${settings.email}` : "mailto:deva.gitisari@example.com",
            color: "hover:text-primary hover:shadow-[0_0_15px_rgba(165,231,255,0.4)]",
        },
    ];

    const handleShare = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
        if (url === "#") {
            e.preventDefault();
            if (navigator.share) {
                navigator.share({
                    title: "Deva Gitisari | Portofolio",
                    text: "Check out Deva Gitisari's modern portofolio website!",
                    url: window.location.href,
                }).catch((err) => console.log(err));
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Website link copied to clipboard!");
            }
        }
    };

    const toggle = (e?: React.MouseEvent) => {
        e?.preventDefault();
        setOpen(v => !v);
    };

    return (
        <>
            {/* Floating toggle button visible when sidebar is hidden */}
            {!open && (
                <button
                    onClick={toggle}
                    aria-label="Open sidebar"
                    className="fixed left-4 bottom-20 z-50 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary shadow-lg focus:outline-none"
                >
                    <Menu size={16} />
                </button>
            )}

            <aside
                className={`fixed left-6 bottom-20 rounded-full py-4 bg-surface-container/40 backdrop-blur-md border border-white/10 shadow-2xl z-40 hidden lg:flex flex-col gap-4 items-center px-3 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
                aria-hidden={!open}
            >
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={toggle}
                        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
                        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-lg focus:outline-none"
                    >
                        {open ? <X size={16} /> : <Menu size={16} />}
                    </button>

                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-lg select-none">
                        D
                    </div>

                    {socialLinks.map((link, idx) => {
                        const linkProps =
                            link.url === "#"
                                ? { href: "#" }
                                : { href: link.url, target: "_blank", rel: "noopener noreferrer" };

                        return (
                            <motion.a
                                key={link.name}
                                {...linkProps}
                                onClick={(e) => handleShare(e as any, link.url)}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + idx * 0.06, type: "spring" }}
                                className={`flex items-center justify-center w-10 h-10 rounded-full text-on-surface-variant opacity-80 hover:opacity-100 hover:scale-125 transition-all duration-300 cursor-pointer ${link.color}`}
                                title={link.name}
                            >
                                <link.icon size={18} />
                            </motion.a>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
