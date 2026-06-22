"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCMS } from "@/services/cmsContext";
import { Send, Check } from "lucide-react";

export default function ContactPage() {
  const { settings, addMessage } = useCMS();

  // Local states
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", category: "General", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    // Simulate dynamic CMS write
    addMessage({
      name: formData.name,
      email: formData.email,
      subject: formData.subject || "Website Inquiry",
      category: formData.category || "General",
      message: formData.message
    });

    setFormSubmitted(true);
    setFormData({ name: "", email: "", subject: "", category: "General", message: "" });
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">

      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3 block">
          Get In Touch
        </span>
        <h1 className="font-sans text-5xl lg:text-6xl text-on-background font-extrabold tracking-tighter mb-4 leading-none">
          Contact <span className="text-primary">Me</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary mx-auto rounded-full mb-6"></div>
        <p className="font-sans text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          Have an exciting project idea, a freelance inquiry, or an internship opportunity? Send me a message below!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">

        {/* Left Side: Contact Shortcuts (5 columns) */}
        <div className="md:col-span-5 space-y-6">

          <h2 className="font-sans text-body-lg font-bold text-on-background select-none mb-4">
            Contact Channels
          </h2>

          {/* LinkedIn Card */}
          <motion.a
            href={settings.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-6 glass-card p-5 rounded-2xl group cursor-pointer hover:border-primary/50 transition-all select-none"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest font-bold">LINKEDIN</p>
              <p className="font-sans text-body-md font-bold group-hover:text-primary transition-colors">
                Connect on LinkedIn
              </p>
            </div>
          </motion.a>

          {/* GitHub Card */}
          <motion.a
            href={settings.github}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-6 glass-card p-5 rounded-2xl group cursor-pointer hover:border-tertiary/50 transition-all select-none"
          >
            <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest font-bold">GITHUB</p>
              <p className="font-sans text-body-md font-bold group-hover:text-tertiary transition-colors">
                View GitHub Profile
              </p>
            </div>
          </motion.a>

        </div>

        {/* Right Side: Message Form (7 columns) */}
        <div className="md:col-span-7">
          <div className="glass-card p-10 rounded-3xl relative overflow-hidden">

            <AnimatePresence>
              {formSubmitted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-surface-container/95 rounded-3xl flex flex-col items-center justify-center text-center p-8 z-20"
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 shadow-[0_0_20px_rgba(0,210,255,0.2)]">
                    <Check size={36} />
                  </div>
                  <h3 className="font-sans text-headline-md font-bold text-on-background mb-2">Message Logged!</h3>
                  <p className="text-on-surface-variant font-sans text-body-md max-w-sm">
                    Thank you! Your inquiry was successfully recorded into my administrative inbox. I will review it and reply as soon as possible.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Your Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Your Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background text-body-md transition-colors"
                >
                  <option value="General">General</option>
                  <option value="Project">Project</option>
                  <option value="Job">Job</option>
                  <option value="Collaboration">Collaboration</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="Project inquiry / Collaboration"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-on-surface-variant uppercase mb-2 font-bold select-none">Your Message</label>
                <textarea
                  required
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  className="w-full bg-surface-container-high border-none border-b-2 border-outline-variant/30 focus:border-primary focus:ring-0 rounded-t-lg px-4 py-3.5 text-on-background placeholder-on-surface-variant/30 text-body-md transition-colors"
                  placeholder="Hello, I'd like to discuss a project..."
                  rows={5}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-[0_10px_20px_-10px_rgba(165,231,255,0.4)] flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <Send size={16} />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
