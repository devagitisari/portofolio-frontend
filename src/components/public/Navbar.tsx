"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/services/themeContext";
import { useCMS } from "@/services/cmsContext";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { settings } = useCMS();

  const handleResumeClick = () => {
    if (!settings.resumeUrl) {
      alert("Resume belum tersedia.");
      return;
    }

    const win = window.open(settings.resumeUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      alert("Popup diblokir. Silakan download manual dari admin settings.");
      return;
    }
  };

  const navLinks = [
    { name: "About", path: "/" },
    { name: "Skills", path: "/skills" },
    { name: "Projects", path: "/projects" },
    { name: "Experience", path: "/experience" },
    { name: "Certificates", path: "/certificates" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
      <nav className="max-w-container-max mx-auto px-gutter flex justify-between items-center h-20">
        {/* Logo */}
        <Link
          href="/"
          className="select-none cursor-pointer"
        >
          <div className="font-sans text-lg font-bold tracking-tighter text-on-background">
            Deva <span className="text-gradient-primary">Gitisari</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex gap-8 items-center font-sans text-body-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`relative py-1 transition-all duration-300 ${isActive
                  ? "text-primary font-bold"
                  : "text-on-surface-variant hover:text-primary"
                  }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Action Buttons & Mobile Trigger */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-white/5 rounded-lg transition-all duration-300 text-on-surface-variant hover:text-primary"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={handleResumeClick}
            className="hidden sm:inline-block bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-transform duration-200 neon-glow-primary cursor-pointer"
          >
            Resume
          </button>

          {/* Mobile Menu Toggler */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden border-t border-white/10 bg-surface-container/95 backdrop-blur-xl"
          >
            <div className="px-gutter py-6 flex flex-col gap-4">
              {navLinks.map((link, idx) => {
                const isActive = pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      href={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex justify-between items-center py-2 px-4 rounded-xl transition-all ${isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-on-surface-variant hover:bg-white/5 hover:text-primary"
                        }`}
                    >
                      <span>{link.name}</span>
                      <ChevronRight size={16} className="opacity-50" />
                    </Link>
                  </motion.div>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleResumeClick();
                }}
                className="w-full mt-4 bg-primary text-on-primary py-3 rounded-xl font-bold neon-glow-primary"
              >
                Resume
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
