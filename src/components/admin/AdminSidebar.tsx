"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCMS } from "@/services/cmsContext";
import { clearAuthStorage, logout as backendLogout } from "@/services/backendApi";
import { useEffect, useState } from "react";

export default function AdminSidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen?: boolean; setIsMobileMenuOpen?: (open: boolean) => void } = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { messages, settings } = useCMS();
  const [mounted, setMounted] = useState(false);
  const [localMobileMenuOpen, setLocalMobileMenuOpen] = useState(false);

  // Use prop if provided, otherwise use local state
  const mobileMenuOpen = isMobileMenuOpen !== undefined ? isMobileMenuOpen : localMobileMenuOpen;
  const setMobileMenuOpen = setIsMobileMenuOpen || setLocalMobileMenuOpen;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate unread messages count dynamically
  const unreadCount = messages.filter((m) => !m.read).length;

  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: "dashboard" },
    { name: "Projects", path: "/admin/projects", icon: "work" },
    { name: "Skills", path: "/admin/skills", icon: "bolt" },
    { name: "Experience", path: "/admin/experiences", icon: "history" },
    { name: "Certificates", path: "/admin/certificates", icon: "workspace_premium" },
    {
      name: "Inbox",
      path: "/admin/inbox",
      icon: "mail",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { name: "Settings", path: "/admin/settings", icon: "settings" },
    { name: "Backup", path: "/admin/backup", icon: "backup" },
  ];

  const handleLogout = async () => {
    if (!mounted) return;
    try {
      await backendLogout();
    } catch (error) {
      console.warn("Backend logout failed, clearing local session anyway.", error);
    }

    clearAuthStorage();
    router.push("/admin-login");
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`h-[90vh] w-64 fixed left-4 md:left-6 top-[5vh] rounded-3xl bg-surface/80 backdrop-blur-xl border border-outline-variant/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col py-8 z-50 shrink-0 transition-colors duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >

      {/* Brand Header */}
      <div className="px-12 mb-10 select-none">
        <h1 className="font-sans text-[24px] font-extrabold leading-none tracking-tighter">
          <span className="text-on-background">Deva</span> <span className="text-gradient-primary">Gitisari</span>
        </h1>
        <p className="text-on-surface-variant font-mono text-[12px] tracking-widest uppercase mt-1.5 font-medium opacity-80">
          Portofolio Admin
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3.5 px-10 py-3.5 transition-all duration-300 ease-out active:scale-98 relative group ${isActive
                ? "bg-primary/10 text-primary border-r-2 border-primary"
                : "text-on-surface-variant hover:text-on-background hover:bg-surface-variant hover:shadow-[0_0_20px_rgba(255,105,180,0.08)]"
                }`}
            >
              <span className="material-symbols-outlined text-[18px] select-none" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="font-sans text-sm font-semibold flex-grow">
                {item.name}
              </span>

              {/* Dynamic Notification Badge */}
              {item.badge !== undefined && (
                <span className="bg-error-container text-on-error-container text-[8px] px-2 py-0.5 rounded-full font-mono font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-10 mt-auto flex flex-col gap-2">
        {/* View Portofolio Button */}
        <Link href="/" target="_blank">
          <button className="w-full py-2.5 bg-gradient-to-r from-primary to-tertiary text-white font-semibold text-xs rounded-lg hover:shadow-[0_0_20px_rgba(255,105,180,0.25)] transition-all duration-300 active:scale-95 cursor-pointer">
            View Portofolio
          </button>
        </Link>

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-surface-variant text-on-surface-variant font-semibold text-xs rounded-lg hover:shadow-[0_0_20px_rgba(255,105,180,0.08)] transition-all duration-300 active:scale-95 cursor-pointer"
        >
          Log Out
        </button>
      </div>

    </aside>
    </>
  );
}
