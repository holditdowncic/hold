"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Reveal, staggerContainer, fadeUp } from "@/lib/motion";
import type { GalleryImage, GalleryContent } from "@/lib/types";

const defaultImages: GalleryImage[] = [
    { id: "1", src: "/media/roots/roots-1.jpeg", alt: "Roots & Wings volunteers group photo", caption: "Our Team", sort_order: 1 },
    { id: "2", src: "/media/roots/roots-11.jpeg", alt: "Families and children at the fun day activities", caption: "Family Fun Day", sort_order: 2 },
    { id: "3", src: "/media/roots/roots-3.jpeg", alt: "Young person proudly wearing their medal", caption: "Celebrating Achievement", sort_order: 3 },
    { id: "4", src: "/media/roots/roots-7.jpeg", alt: "Face painting station at Roots & Wings event", caption: "Creative Activities", sort_order: 4 },
    { id: "5", src: "/media/image-5.jpeg", alt: "Family enjoying the Roots & Wings Family Fun Day", caption: "Families Together", sort_order: 5 },
    { id: "6", src: "/media/roots/roots-17.jpeg", alt: "Dancing and celebrating at the community event", caption: "Dance & Performance", sort_order: 6 },
    { id: "7", src: "/media/image-7.jpeg", alt: "Child proudly showing their medal", caption: "Award Winners", sort_order: 7 },
    { id: "8", src: "/media/roots/roots-13.jpeg", alt: "Fathers and mentors at outdoor discussion", caption: "Men's Discussion", sort_order: 8 },
    { id: "9", src: "/media/talkdi/talkdi-1.jpeg", alt: "Talk Di TingZ youth podcast team", caption: "Talk Di TingZ", sort_order: 9 },
    { id: "10", src: "/media/roots/roots-12.jpeg", alt: "Young people playing football in the park", caption: "Sports & Football", sort_order: 10 },
    { id: "11", src: "/media/image-3.jpeg", alt: "Community members showcasing children's books", caption: "Community Partners", sort_order: 11 },
    { id: "12", src: "/media/roots/roots-22.jpeg", alt: "Creative crafts and activities by young people", caption: "Creative Workshops", sort_order: 12 },
];

interface GalleryProps {
    images: GalleryImage[];
    meta: GalleryContent | null;
}

export default function Gallery({ images, meta }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const galleryImages = images.length > 0 ? images : defaultImages;

    const sectionLabel = meta?.section_label ?? "Gallery";
    const heading = meta?.heading ?? "Moments that matter";
    const description = meta?.description ?? "Highlights from our community events — real families, real connections, real impact.";
    const videoSrc = meta?.video_src ?? "/media/video-1.mp4";
    const videoPoster = meta?.video_poster ?? "/media/image-10.jpeg";
    const videoCaption = meta?.video_caption ?? "Watch highlights from our Roots & Wings Family Fun Day 2025";

    // Split heading for gradient effect
    const headingParts = heading.split(" ");
    const lastWord = headingParts.pop();
    const headingPrefix = headingParts.join(" ");

    return (
        <section id="gallery" className="py-12 sm:py-16 md:py-20 bg-bg-alt">
            <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
                {/* Header */}
                <div className="mb-10 text-center sm:mb-12 md:mb-16">
                    <Reveal>
                        <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                            {sectionLabel}
                        </span>
                    </Reveal>
                    <Reveal>
                        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                            {headingPrefix}{" "}
                            <span className="text-gradient">{lastWord}</span>
                        </h2>
                    </Reveal>
                    <Reveal>
                        <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
                            {description}
                        </p>
                    </Reveal>
                </div>

                {/* Gallery Grid */}
                <motion.div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                >
                    {galleryImages.map((image, index) => {
                        const isWide = index === 0 || index === 5 || index === 9;
                        return (
                            <motion.div
                                key={image.id}
                                variants={fadeUp}
                                className={`group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-xl ${isWide ? "col-span-2 aspect-[16/10]" : "aspect-square"
                                    }`}
                                onClick={() => setSelectedImage(index)}
                            >
                                <Image
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes={isWide ? "(max-width: 640px) 100vw, (max-width: 768px) 66vw, 50vw" : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 right-0 translate-y-full p-3 transition-transform duration-300 group-hover:translate-y-0 sm:p-4">
                                    <p className="text-xs font-semibold text-white sm:text-sm">
                                        {image.caption}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Video Section */}
                <Reveal>
                    <div className="mt-10 sm:mt-14 md:mt-16">
                        <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-bg-card">
                            <video
                                className="h-full w-full object-cover"
                                controls
                                poster={videoPoster}
                            >
                                <source src={videoSrc} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <p className="mt-4 text-center text-sm text-text-secondary">
                            {videoCaption}
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
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(_, info) => {
                                if (info.offset.x > 80) {
                                    setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1);
                                } else if (info.offset.x < -80) {
                                    setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1);
                                }
                            }}
                            className="relative max-h-[80vh] max-w-[92vw] overflow-hidden rounded-2xl border border-border sm:max-h-[85vh] sm:max-w-[90vw]"
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
                                className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white sm:top-4 sm:right-4"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-14 left-0 right-0 text-center sm:bottom-16">
                                <p className="inline-block rounded-full bg-bg/80 px-4 py-1.5 text-xs font-medium text-text-primary backdrop-blur-sm sm:text-sm">
                                    {galleryImages[selectedImage].caption}
                                </p>
                            </div>
                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3 sm:bottom-4 sm:gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === 0 ? galleryImages.length - 1 : selectedImage - 1);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <span className="flex items-center px-3 text-sm text-text-secondary">
                                    {selectedImage + 1} / {galleryImages.length}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === galleryImages.length - 1 ? 0 : selectedImage + 1);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
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
