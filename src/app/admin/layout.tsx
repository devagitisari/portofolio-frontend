"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { Loader2, User } from "lucide-react";
import { useCMS } from "@/services/cmsContext";
import { useTheme } from "@/services/themeContext";
import { ToastProvider } from "@/services/toastContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { settings, messages } = useCMS();
  const { theme, toggleTheme } = useTheme();

  // Calculate unread messages count
  const unreadCount = messages.filter((m) => !m.read).length;

  // Initialize directly from storage to avoid flicker on navigation
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const isLogged =
      sessionStorage.getItem("deva_admin_logged") === "true" ||
      !!localStorage.getItem("deva_auth_token");

    if (!isLogged) {
      router.push("/admin-login");
    } else {
      if (!sessionStorage.getItem("deva_admin_logged")) {
        sessionStorage.setItem("deva_admin_logged", "true");
      }
      setAuthChecked(true);
    }
    // Run only once on mount — do NOT include pathname or router in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading state during auth checks to prevent flash content
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-on-surface-variant">
        <Loader2 size={36} className="animate-spin text-primary mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Validating Session...</p>
      </div>
    );
  }

  // Dashboard layout with SideNav & Top Header
  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-on-background font-sans antialiased">
        {/* CMS Administrative Navigation Sidebar - Desktop Only */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

      {/* Top Header Navigation - Desktop Only */}
      <header className="hidden md:flex fixed top-0 right-0 left-64 h-16 bg-background/60 backdrop-blur-md border-b border-outline-variant/20 justify-between items-center px-8 z-40 select-none transition-colors duration-300">
        {/* Search Panel */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              className="bg-surface-container-low border-none rounded-full pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-primary w-64 transition-all text-on-surface placeholder-on-surface-variant/30"
              placeholder="Search data..."
              type="text"
            />
          </div>
        </div>

        {/* Right side Profile & Icons */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-on-surface-variant select-none">
            {/* Notification Button */}
            <Link href="/admin/inbox" className="relative cursor-pointer hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </Link>
            <button
              onClick={toggleTheme}
              className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors text-[20px] focus:outline-none border-none bg-transparent"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </button>
          </div>

          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right">
              <p className="text-sm font-semibold text-on-surface leading-none group-hover:text-primary transition-colors">
                {settings.name || "Deva Gitisari"}
              </p>
              <p className="text-[10px] font-mono text-on-surface-variant uppercase mt-1">
                Super Admin
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border border-outline-variant/30 group-hover:border-primary transition-colors flex items-center justify-center overflow-hidden bg-surface-container-low shrink-0">
              {settings.profileImage ? (
                <img
                  alt="Deva Gitisari Profile"
                  className="w-full h-full object-cover"
                  src={settings.profileImage ?? undefined}
                />
              ) : (
                <User className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="ml-0 md:ml-64 pt-20 md:pt-24 px-4 md:px-8 pb-16 max-w-7xl mx-auto admin-mesh-bg min-h-screen transition-colors duration-300">
        <div className="pb-12">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <AdminMobileNav />
    </div>
    </ToastProvider>
  );
}
