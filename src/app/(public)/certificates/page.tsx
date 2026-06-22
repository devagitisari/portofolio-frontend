"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, ExternalLink, ArrowRight } from "lucide-react";
import { useCMS } from "@/services/cmsContext";
import Link from "next/link";
import PDFPreview from "@/components/PDFPreview";

export default function CertificatesPage() {
  const { certificates } = useCMS();

  return (
    <div className="py-12 px-gutter relative z-10 max-w-container-max mx-auto">
      {/* Page Header */}
      <div className="text-center mb-16 select-none">
        <span className="font-mono text-label-mono text-primary uppercase tracking-widest mb-3 block">
          Accreditations
        </span>
        <h1 className="font-sans text-5xl lg:text-6xl text-on-background font-extrabold tracking-tighter mb-4 leading-none">
          My <span className="text-primary">Certificates</span>
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-primary to-tertiary mx-auto rounded-full mb-6"></div>
        <p className="font-sans text-body-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
          A showcase of my professional certifications, courses, and technical achievements.
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {certificates.map((cert, idx) => {
            const imgUrl = cert.image || null;

            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card rounded-3xl overflow-hidden group hover:border-primary/30 transition-all duration-300 flex flex-col h-full shadow-lg hover:shadow-primary/10"
              >
                <div className="flex flex-col h-full">
                  {/* Image Section */}
                  <div className="relative aspect-[4/3] bg-surface-container-lowest overflow-hidden flex items-center justify-center">
                    {imgUrl ? (
                      imgUrl.toLowerCase().endsWith('.pdf') ? (
                        <PDFPreview url={imgUrl} />
                      ) : (
                        <img
                          src={imgUrl}
                          alt={cert.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 gap-3">
                        <Award size={48} className="text-primary/30" />
                        <span className="font-mono text-xs text-on-surface-variant/50">No Image</span>
                      </div>
                    )}

                    {/* Overlay Link Icon */}
                    {cert.credentialUrl && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ExternalLink size={14} />
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex flex-col">
                    {/* Certificate Info */}
                    <div className="flex-grow">
                      <h3 className="font-sans text-sm font-bold text-on-background group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {cert.title}
                      </h3>
                      <p className="font-mono text-xs text-primary mb-1">
                        {cert.issuer}
                      </p>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {cert.date ? new Date(cert.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "No Date"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 relative z-10 mt-4">
                      <Link href={`/certificates/${cert.id}`} className="flex items-center justify-center gap-2 border border-white/10 hover:border-primary/30 hover:bg-primary/5 text-on-background px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer bg-primary/10 text-primary hover:bg-primary/20">
                        <span>Details</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card max-w-2xl mx-auto p-12 rounded-3xl text-center">
          <Award size={48} className="mx-auto text-primary/30 mb-4" />
          <h3 className="font-sans text-headline-sm font-bold text-on-background mb-2">No Certificates Yet</h3>
          <p className="text-on-surface-variant text-body-md">
            Certifications and achievements will be displayed here once they are added to the portfolio.
          </p>
        </div>
      )}
    </div>
  );
}
