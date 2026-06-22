"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { trackPageView } from "@/services/backendApi";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    const trackView = async () => {
      try {
        await trackPageView(window.location.pathname || pathname || '/', pathname || '');
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    trackView();
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Public Content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Glowing Footer */}
      <Footer />
    </div>
  );
}
