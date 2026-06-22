"use client";

import { useCMS } from "@/services/cmsContext";
import { User } from "lucide-react";

export default function Home() {
  const { settings, skills } = useCMS();

  return (
    <main className="min-h-screen bg-surface text-on-background overflow-hidden">
      {/* Background Blur */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full" />

      {/* Navbar */}
      <header className="fixed top-0 left-0 w-full z-50 border-b border-white/10 -webkit-backdrop-filter-blur -webkit-backdrop-filter-blur-md backdrop-blur-md bg-surface-container/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gradient-primary">
            {settings.name}
          </h1>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm text-on-surface-variant">
            <a href="#" className="text-primary border-b-2 border-primary pb-1">
              About
            </a>
            <a href="#" className="hover:text-primary transition-colors">Skills</a>
            <a href="#" className="hover:text-primary transition-colors">Projects</a>
            <a href="#" className="hover:text-primary transition-colors">Experience</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </nav>

          <button className="px-4 sm:px-6 py-2 rounded-full bg-primary text-on-primary font-semibold hover:scale-105 transition text-sm">
            Resume
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left */}
          <div className="space-y-6">
            <p className="uppercase tracking-[4px] text-sm text-primary mb-4">
              {settings.title}
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              {settings.name.split(" ")[0]}{" "}
              <span className="text-gradient-primary">
                {settings.name.split(" ").slice(1).join(" ")}
              </span>
            </h1>

            <p className="text-on-surface-variant text-lg leading-8 max-w-xl">
              {settings.bio}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary via-secondary to-tertiary text-on-primary font-bold shadow-[0_0_30px_rgba(255,105,180,0.3)] hover:scale-105 transition">
                View Projects
              </button>

              <button className="px-8 py-4 rounded-xl border border-primary/30 bg-surface-container/50 -webkit-backdrop-filter-blur backdrop-blur-md text-primary hover:bg-primary/10 transition">
                Download CV
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="flex justify-center mt-12 lg:mt-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-tertiary rounded-full blur-2xl opacity-30" />

              <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] rounded-full border border-white/10 bg-surface-container/60 -webkit-backdrop-filter-blur backdrop-blur-md overflow-hidden shadow-[0_0_50px_rgba(255,105,180,0.2)] flex items-center justify-center">
                {settings.profileImage ? (
                  <img
                    src={settings.profileImage ?? undefined}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-32 h-32 sm:w-40 sm:h-40 text-on-surface-variant" />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-6">
            <p className="uppercase tracking-[4px] text-sm text-primary mb-4">
              About
            </p>

            <h2 className="text-3xl sm:text-4xl font-bold text-gradient-primary mb-6">
              About {settings.name.split(" ")[0]}
            </h2>

            <div className="text-on-surface-variant leading-8 text-lg space-y-4">
              {settings.aboutMe?.split('\n').filter(Boolean).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 max-w-4xl">
              {[
                { value: `${skills.filter(s => (s.calculatedPercentage ?? 0) > 0).length}+`, label: "Tech Stack Used" },
                { value: settings.gpa, label: "GPA" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-2xl bg-surface-container/50 border border-white/10 -webkit-backdrop-filter-blur backdrop-blur-md text-center hover:bg-surface-container transition-colors"
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-primary">
                    {item.value}
                  </h3>

                  <p className="text-on-surface-variant text-sm mt-2">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="order-first lg:order-last">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-container/50 flex items-center justify-center">
              {settings.profileImage ? (
                <img
                  src={settings.profileImage}
                  alt={settings.name}
                  className="aspect-[4/5] w-full object-cover opacity-90"
                />
              ) : (
                <div className="aspect-[4/5] w-full bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center">
                  <User className="w-24 h-24 text-primary/70" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28 bg-surface-container-lowest/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gradient-primary">
              Technical Expertise
            </h2>

            <div className="w-24 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Languages */}
            <div className="p-6 lg:p-8 rounded-3xl bg-surface-container/50 border border-white/10 -webkit-backdrop-filter-blur backdrop-blur-md hover:bg-surface-container transition-colors">
              <h3 className="text-primary text-xl font-semibold mb-6 lg:mb-8">
                Languages
              </h3>

              {skills
                .filter(skill => skill.category === "Language")
                .map(skill => {
                  const pct = skill.calculatedPercentage ?? skill.percentage;
                  return (
                    <div key={skill.id} className="mb-6">
                      <div className="flex justify-between mb-2 text-sm sm:text-base">
                        <span>{skill.name}</span>
                        <span className="text-primary">{pct}%</span>
                      </div>

                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Framework */}
            <div className="p-6 lg:p-8 rounded-3xl bg-surface-container/50 border border-white/10 -webkit-backdrop-filter-blur backdrop-blur-md hover:bg-surface-container transition-colors">
              <h3 className="text-tertiary text-xl font-semibold mb-6 lg:mb-8">
                Tools & Frameworks
              </h3>

              <div className="space-y-6">
                {skills
                  .filter(skill => skill.category === "Framework")
                  .map(skill => {
                    const pct = skill.calculatedPercentage ?? skill.percentage;
                    return (
                      <div key={skill.id} className="mb-6">
                        <div className="flex justify-between mb-2 text-sm sm:text-base">
                          <span>{skill.name}</span>
                          <span className="text-tertiary">{pct}%</span>
                        </div>

                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-tertiary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Other */}
            <div className="p-6 lg:p-8 rounded-3xl bg-surface-container/50 border border-white/10 -webkit-backdrop-filter-blur backdrop-blur-md hover:bg-surface-container transition-colors">
              <h3 className="text-secondary text-xl font-semibold mb-6 lg:mb-8">
                Other Skills
              </h3>

              <div className="space-y-6">
                {skills
                  .filter(skill => skill.category === "Other")
                  .map(skill => {
                    const pct = skill.calculatedPercentage ?? skill.percentage;
                    return (
                      <div key={skill.id} className="mb-6">
                        <div className="flex justify-between mb-2 text-sm sm:text-base">
                          <span>{skill.name}</span>
                          <span className="text-secondary">{pct}%</span>
                        </div>

                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
