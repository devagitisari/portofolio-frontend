"use client";

import { useEffect, useState } from "react";

interface CertificatePDFImageProps {
    url: string;
    alt: string;
    className?: string;
}

export default function CertificatePDFImage({ url, alt, className = "" }: CertificatePDFImageProps) {
    const [embedUrl, setEmbedUrl] = useState<string>("");

    useEffect(() => {
        // Create an embed URL that will show the PDF in Google Docs viewer for thumbnail
        const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
        setEmbedUrl(googleDocsUrl);
    }, [url]);

    return (
        <iframe
            src={embedUrl}
            className={`w-full h-full ${className}`}
            title={alt}
            frameBorder="0"
            style={{ pointerEvents: 'none' }}
        />
    );
}
