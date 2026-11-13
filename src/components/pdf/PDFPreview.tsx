"use client";

import { useState } from "react";

interface PDFPreviewProps {
    url: string;
}

export default function PDFPreview({ url }: PDFPreviewProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    return (
        <>
            {!loaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-high z-10">
                    <div className="text-center">
                        <div className="animate-spin mb-3">
                            <span className="material-symbols-outlined text-[40px] text-primary">refresh</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-mono">Loading PDF preview...</p>
                    </div>
                </div>
            )}

            <iframe
                src={`${url}#toolbar=0&navpanes=0&page=1&zoom=auto`}
                style={{ width: '100%', height: '100%', border: 'none', margin: 0, padding: 0 }}
                onLoad={() => setLoaded(true)}
                onError={() => {
                    setLoaded(true);
                    setError(true);
                }}
                title="PDF Preview"
            />

            {error && (
                <div className="flex flex-col items-center justify-center gap-4 absolute inset-0 bg-surface-container-high z-10">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30">
                        description
                    </span>
                    <p className="text-xs text-on-surface-variant font-mono text-center px-4">
                        PDF cannot be displayed inline.{" "}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                            Click to view
                        </a>
                    </p>
                </div>
            )}
        </>
    );
}
