"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCMS } from "@/services/cmsContext";

import { login as apiLogin, setAuthToken } from "@/services/backendApi";
import {
  Code2,
  Braces,
  Terminal,
  Cpu,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { settings } = useCMS();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mounted) return;
    if (email && password) {
      try {
        const res = await apiLogin(email, password);
        if (res.token) {
          setAuthToken(res.token);
          router.push("/admin");
        } else {
          setError("Failed to retrieve authentication token.");
        }
      } catch (err: any) {
        setError(err?.message || "The credentials provided are incorrect.");
      }
    } else {
      setError("Please provide both email and password.");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden px-4">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-primary/10 blur-[120px] rounded-full animate-blob" />

      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-tertiary/10 blur-[120px] rounded-full animate-blob" />
      {/* Floating Coding Icons */}
      <div className="absolute inset-0 pointer-events-none">

        <Code2
          className="absolute top-12 left-8 md:top-16 md:left-20 w-12 h-12 md:w-20 md:h-20 text-pink-400/30 rotate-12 animate-floating"
        />

        <Terminal
          className="absolute top-32 right-8 md:top-40 md:right-24 w-14 h-14 md:w-24 md:h-24 text-cyan-300/30 -rotate-12 animate-floating-delay"
        />

        <Braces
          className="absolute bottom-24 left-8 md:bottom-32 md:left-28 w-12 h-12 md:w-20 md:h-20 text-purple-300/25 rotate-[25deg] animate-floating-fast"
        />

        <Cpu
          className="absolute bottom-12 right-8 md:bottom-20 md:right-20 w-14 h-14 md:w-24 md:h-24 text-emerald-300/25 rotate-6 animate-floating-slow"
        />

      </div>
      <div className="relative z-10 admin-glass-card p-6 md:p-8 w-full max-w-md rounded-3xl border border-white/10 backdrop-blur-xl shadow-[0_0_60px_rgba(255,105,180,.15)] animate-fade-up">
        <h2 className="text-2xl font-extrabold text-on-surface mb-4 text-center">
          Sign In
        </h2>
        {error && (
          <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
        )}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full p-3 border border-outline-variant/20 rounded bg-surface-container-low text-on-surface focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full p-3 pr-11 border border-outline-variant/20 rounded bg-surface-container-low text-on-surface focus:ring-1 focus:ring-primary outline-none"
              />

              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">

            <label htmlFor="login_remember_me" className="flex items-center gap-2 cursor-pointer">
              <input
                id="login_remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="cursor-pointer"
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="text-primary hover:underline"
            >
              Forgot Password?
            </button>

          </div>
          <button
            type="submit"
            className="mt-2 py-3 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors font-medium"
          >
            Sign In
          </button>
        </form>
      </div>
    </section>
  );
}
