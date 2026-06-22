"use client";

import React, { useState } from "react";
import { X, Download, FileText } from "lucide-react";

interface CertificatePreviewProps {
    cert: {
        id: string;
        title: string;
        issuer: string;
        image?: string | null;
        credentialUrl?: string | null;
        credential_url?: string | null;
        date?: string | null;
        description?: string | null;
        expiresDate?: string | null;
        expires_date?: string | null;
    };
    isOpen: boolean;
    onClose: () => void;
}

export default function CertificatePreview({ cert, isOpen, onClose }: CertificatePreviewProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [imgError, setImgError] = useState(false);

    if (!isOpen) return null;

    const isPDF = cert.image?.toLowerCase().endsWith(".pdf");
    const isImageFile = cert.image && (cert.image.toLowerCase().endsWith(".png") || cert.image.toLowerCase().endsWith(".jpg") || cert.image.toLowerCase().endsWith(".jpeg") || cert.image.toLowerCase().endsWith(".gif"));

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative bg-surface rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start p-6 border-b border-outline-variant/20 bg-surface-container-low">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-on-surface">{cert.title}</h3>
                        <p className="text-sm text-on-surface-variant mt-1">{cert.issuer}</p>
                        {cert.date && <p className="text-xs text-on-surface-variant/60 font-mono mt-1">{cert.date}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-variant rounded-lg transition-colors text-on-surface-variant hover:text-on-surface"
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto bg-black/20 flex items-center justify-center">
                    {cert.image ? (
                        <>
                            {isPDF ? (
                                // PDF Preview using iframe
                                <iframe
                                    src={`${cert.image}#toolbar=0&navpanes=0`}
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => {
                                        setIsLoading(false);
                                        setImgError(true);
                                    }}
                                />
                            ) : isImageFile ? (
                                // Image Preview
                                <img
                                    src={cert.image}
                                    alt={cert.title}
                                    className="max-w-full max-h-full object-contain p-4"
                                    onLoad={() => setIsLoading(false)}
                                    onError={() => {
                                        setIsLoading(false);
                                        setImgError(true);
                                    }}
                                />
                            ) : (
                                // Fallback for other file types
                                <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant">
                                    <FileText size={64} className="mb-4 opacity-50" />
                                    <p className="text-center">Cannot preview this file type</p>
                                    <p className="text-xs text-on-surface-variant/60 mt-2">Download to view</p>
                                </div>
                            )}

                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <div className="animate-spin">
                                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
                                    </div>
                                </div>
                            )}

                            {imgError && (
                                <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant">
                                    <FileText size={64} className="mb-4 opacity-50" />
                                    <p className="text-center">Failed to load preview</p>
                                    <p className="text-xs text-on-surface-variant/60 mt-2">Download to view the document</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 text-on-surface-variant">
                            <FileText size={64} className="mb-4 opacity-50" />
                            <p className="text-center">No document attached</p>
                        </div>
                    )}
                </div>

                {/* Footer with Actions */}
                <div className="flex gap-3 p-6 border-t border-outline-variant/20 bg-surface-container-low">
                    {cert.image && (
                        <a
                            href={cert.image}
                            download={`${cert.title}.${isPDF ? "pdf" : "jpg"}`}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors text-sm font-semibold"
                        >
                            <Download size={16} />
                            Download
                        </a>
                    )}
                    {cert.credentialUrl && (
                        <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-semibold"
                        >
                            View Credential
                        </a>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg hover:bg-surface-variant/80 transition-colors text-sm font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
