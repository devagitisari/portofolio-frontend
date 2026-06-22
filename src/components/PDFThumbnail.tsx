"use client";

import { useEffect, useState } from "react";
import { BACKEND_API_URL } from "@/services/backendApi";

interface PDFThumbnailProps {
    url: string;
    certId: string;
}

export default function PDFThumbnail({ url, certId }: PDFThumbnailProps) {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchThumbnail = async () => {
            try {
                const response = await fetch(
                    `${BACKEND_API_URL}/certificates/${certId}/thumbnail`
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("Thumbnail API error:", errorData);
                    throw new Error(errorData.error || "Failed to fetch thumbnail");
                }

                const data = await response.json();
                setThumbnailUrl(data.thumbnail);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching PDF thumbnail:", err);
                setError(true);
                setLoading(false);
            }
        };

        fetchThumbnail();
    }, [certId]);

    if (loading) {
        return (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-3">
                        <span className="material-symbols-outlined text-[40px] text-primary">refresh</span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-mono">Loading PDF...</p>
                </div>
            </div>
        );
    }

    if (error || !thumbnailUrl) {
        return (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <div className="text-center">
                    <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-2">
                        description
                    </span>
                    <p className="text-xs text-on-surface-variant font-mono">
                        Could not render PDF
                    </p>
                </div>
            </div>
        );
    }

    return (
        <img
            src={thumbnailUrl}
            alt="PDF Thumbnail"
            className="w-full h-full object-contain"
        />
    );
}
