"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Reveal, staggerContainer, fadeUp } from "@/lib/motion";

const galleryImages = [
    {
        src: "/media/image-5.jpeg",
        alt: "Family enjoying the Roots & Wings Family Fun Day",
        caption: "Families Together",
    },
    {
        src: "/media/image-6.jpeg",
        alt: "Young person with face painting at the event",
        caption: "Youth Activities",
    },
    {
        src: "/media/image-7.jpeg",
        alt: "Child proudly showing their medal",
        caption: "Celebrating Achievements",
    },
    {
        src: "/media/image-9.jpeg",
        alt: "Young girl holding trophy at awards ceremony",
        caption: "Award Winners",
    },
    {
        src: "/media/image-3.jpeg",
        alt: "Community members showcasing children's books",
        caption: "Community Partners",
    },
    {
        src: "/media/image-8.jpeg",
        alt: "Food donations from Tesco at the event",
        caption: "Community Support",
    },
];

export default function Gallery() {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);

    return (
        <section id="gallery" className="py-12 sm:py-16 md:py-20 bg-bg-alt">
            <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
                {/* Header */}
                <div className="mb-10 text-center sm:mb-12 md:mb-16">
                    <Reveal>
                        <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                            Gallery
                        </span>
                    </Reveal>
                    <Reveal>
                        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                            Moments that{" "}
                            <span className="text-gradient">matter</span>
                        </h2>
                    </Reveal>
                    <Reveal>
                        <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
                            Highlights from our community events — real families, real connections, real impact.
                        </p>
                    </Reveal>
                </div>

                {/* Gallery Grid */}
                <motion.div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    {galleryImages.map((image, index) => (
                        <motion.div
                            key={index}
                            variants={fadeUp}
                            className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-xl"
                            onClick={() => setSelectedImage(index)}
                        >
                            <Image
                                src={image.src}
                                alt={image.alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 400px"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            {/* Caption */}
                            <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
                                <p className="text-xs font-semibold text-white sm:text-sm">
                                    {image.caption}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Video Section */}
                <Reveal>
                    <div className="mt-10 sm:mt-14 md:mt-16">
                        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-bg-card">
                            <video
                                className="h-full w-full object-cover"
                                controls
                                poster="/media/image-10.jpeg"
                            >
                                <source src="/media/video-1.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <p className="mt-4 text-center text-sm text-text-secondary">
                            Watch highlights from our Roots & Wings Family Fun Day 2025
                        </p>
                    </div>
                </Reveal>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-sm p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={galleryImages[selectedImage].src}
                                alt={galleryImages[selectedImage].alt}
                                width={1200}
                                height={900}
                                className="object-contain"
                            />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            {/* Navigation */}
                            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1);
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1);
                                    }}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
