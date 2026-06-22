"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

export default function ProjectGallery({ mainImage, screenshots }: { mainImage: string, screenshots: any[] }) {
    // Combine main image and screenshots
    const allImages = mainImage
        ? [{ id: 'main', image: mainImage }, ...(screenshots || [])]
        : (screenshots || []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);

    if (allImages.length === 0) return null;

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    const currentImage = allImages[currentIndex].image || allImages[currentIndex];

    return (
        <>
            {/* Main Gallery */}
            <div className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest border border-white/10 shadow-xl group cursor-pointer">
                <img
                    src={currentImage}
                    alt="Project screenshot"
                    onClick={() => setIsFullScreen(true)}
                    className="w-full h-[480px] object-cover bg-black/20 transition-all duration-500 hover:brightness-110"
                />

                {/* Fullscreen button */}
                <button
                    onClick={() => setIsFullScreen(true)}
                    className="absolute top-4 right-4 p-3 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80 backdrop-blur-sm z-10"
                    title="View fullscreen"
                >
                    <Maximize2 size={20} />
                </button>

                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80 backdrop-blur-sm z-10"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/80 backdrop-blur-sm z-10"
                        >
                            <ChevronRight size={24} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {allImages.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentIndex(idx)}
                                    className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary' : 'bg-white/50 hover:bg-white/80'}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Fullscreen Modal */}
            {isFullScreen && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <button
                        onClick={() => setIsFullScreen(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        title="Close"
                    >
                        <X size={28} />
                    </button>

                    <div className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center">
                        <img
                            src={currentImage}
                            alt="Project fullscreen"
                            className="w-full h-full object-contain"
                        />

                        {allImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-primary/80 transition-colors backdrop-blur-sm"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white hover:bg-primary/80 transition-colors backdrop-blur-sm"
                                >
                                    <ChevronRight size={32} />
                                </button>

                                {/* Image counter */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-mono backdrop-blur-sm">
                                    {currentIndex + 1} / {allImages.length}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
