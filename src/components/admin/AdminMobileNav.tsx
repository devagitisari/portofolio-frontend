"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCMS } from "@/services/cmsContext";
import { useTheme } from "@/services/themeContext";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMobileNav() {
  const pathname = usePathname();
  const { messages, settings } = useCMS();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = messages.filter((m) => !m.read).length;

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Projects", path: "/admin/projects", icon: "work" },
    { name: "Skills", path: "/admin/skills", icon: "bolt" },
    { name: "Experience", path: "/admin/experiences", icon: "history" },
    { name: "Certificates", path: "/admin/certificates", icon: "workspace_premium" },
    { name: "Inbox", path: "/admin/inbox", icon: "mail", badge: unreadCount > 0 ? unreadCount : undefined },
    { name: "Settings", path: "/admin/settings", icon: "settings" },
    { name: "Backup", path: "/admin/backup", icon: "backup" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-20 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/20 z-50">
        <nav className="flex justify-between items-center px-3 h-full">
          {/* Logo */}
          <Link href="/admin" className="select-none cursor-pointer">
            <h1 className="font-sans text-[24px] font-extrabold leading-none tracking-tighter">
              <span className="text-on-background">Deva</span> <span className="text-gradient-primary">Gitisari</span>
            </h1>
          </Link>

          {/* Right Side Icons */}
          <div className="flex items-center gap-1">
            {/* Notification Icon */}
            <Link href="/admin/inbox" className="relative p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-[20px]">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Mobile Menu Toggler */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden fixed top-20 left-0 right-0 z-40 border-t border-outline-variant/20 bg-surface-container/95 backdrop-blur-xl"
          >
            <div className="px-3 py-6 flex flex-col gap-4">
              {/* Profile Section */}
              <div className="flex items-center gap-3 py-3 px-4 bg-surface-variant/30 rounded-xl mb-2">
                <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center overflow-hidden bg-surface-container-low shrink-0">
                  {settings.profileImage ? (
                    <img
                      alt="Profile"
                      className="w-full h-full object-cover"
                      src={settings.profileImage}
                    />
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      person
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">
                    {settings.name || "Admin"}
                  </p>
                  <p className="text-[10px] font-mono text-on-surface-variant uppercase">
                    Super Admin
                  </p>
                </div>
              </div>

              {menuItems.map((link, idx) => {
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
                      className={`flex justify-between items-center py-3 px-4 rounded-xl transition-all ${isActive
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-on-surface-variant hover:bg-white/5 hover:text-primary"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[20px]">
                          {link.icon}
                        </span>
                        <span className="text-sm">{link.name}</span>
                      </div>
                      {link.badge !== undefined && (
                        <span className="bg-error text-on-error text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
              <div className="border-t border-outline-variant/20 mt-4 pt-4">
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-between items-center py-3 px-4 rounded-xl transition-all text-on-surface-variant hover:bg-white/5 hover:text-primary"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">
                      open_in_new
                    </span>
                    <span className="text-sm">View Portofolio</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    // Handle logout - will need to be passed as prop or use context
                    window.location.href = "/admin-login";
                  }}
                  className="w-full flex justify-between items-center py-4 md:py-5 px-5 md:px-6 rounded-2xl transition-all text-error hover:bg-error/10"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="material-symbols-outlined text-[24px] md:text-[28px]">
                      logout
                    </span>
                    <span className="text-base md:text-lg font-medium">Log Out</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
