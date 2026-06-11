"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Reveal, staggerContainer, fadeUp } from "@/lib/motion";
import type { GalleryImage, GalleryContent } from "@/lib/types";
import TreeOfHopeScene from "./TreeOfHopeScene";

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
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const galleryImages = images.length > 0 ? images : defaultImages;
    const rootsAndWings2024Images = galleryImages.filter((image) =>
        image.src.startsWith("/gallery/roots-and-wings-2024/")
    );
    const looseImages = galleryImages.filter((image) =>
        !image.src.startsWith("/gallery/roots-and-wings-2024/")
    );
    const displayImages = rootsAndWings2024Images.length > 0 ? looseImages : galleryImages;
    const openImage = (image: GalleryImage) => {
        const imageIndex = galleryImages.findIndex((item) => item.id === image.id);
        if (imageIndex >= 0) setSelectedImage(imageIndex);
        setSelectedFolder(null);
    };

    const sectionLabel = meta?.section_label ?? "Gallery";
    const heading = meta?.heading ?? "Moments that matter";
    const description = meta?.description ?? "Highlights from our community events — real families, real connections, real impact.";
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
                    {rootsAndWings2024Images.length > 0 && (
                        <motion.figure
                            variants={fadeUp}
                            className="group col-span-2 cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-xl"
                            onClick={() => setSelectedFolder("roots-and-wings-2024")}
                        >
                            <div className="relative aspect-[16/10] overflow-hidden">
                                <Image
                                    src={rootsAndWings2024Images[0].src}
                                    alt="Roots and Wings 2024 gallery folder"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 66vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-bg/10 to-transparent" />
                                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
                                    <span className="mb-2 inline-flex rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-white">
                                        Folder
                                    </span>
                                    <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold leading-tight text-white sm:text-2xl">
                                        Roots & Wings 2024
                                    </h3>
                                    <p className="mt-1 text-sm font-medium text-white/85">
                                        {rootsAndWings2024Images.length} photos
                                    </p>
                                </div>
                            </div>
                            <figcaption className="flex min-h-[4.25rem] items-center px-3 py-3 text-sm font-semibold leading-snug text-text-primary sm:px-4">
                                Roots & Wings 2024
                            </figcaption>
                        </motion.figure>
                    )}
                    {displayImages.map((image, index) => {
                        const isWide = index === 0 || index === 5 || index === 9;
                        return (
                            <motion.figure
                                key={image.id}
                                variants={fadeUp}
                                className={`group cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/30 hover:shadow-xl ${isWide ? "col-span-2" : ""
                                    }`}
                                onClick={() => openImage(image)}
                            >
                                <div className={`relative overflow-hidden ${isWide ? "aspect-[16/10]" : "aspect-square"}`}>
                                    <Image
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        sizes={isWide ? "(max-width: 640px) 100vw, (max-width: 768px) 66vw, 50vw" : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                </div>
                                <figcaption className="flex min-h-[4.25rem] items-center px-3 py-3 text-sm font-semibold leading-snug text-text-primary sm:px-4">
                                    {image.caption}
                                </figcaption>
                            </motion.figure>
                        );
                    })}
                </motion.div>

            </div>

            {/* Tree of Hope */}
            <Reveal>
                <div id="tree-of-hope" className="mx-auto mt-10 max-w-[1120px] scroll-mt-36 px-5 sm:mt-14 sm:px-6 md:mt-16">
                    <div className="mb-4 text-center sm:mb-5">
                        <h2 className="font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight text-text-primary">
                            Tree of Hope
                        </h2>
                        <Link
                            href="/tree-of-hope"
                            className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-bg-card px-4 text-sm font-bold text-text-primary transition hover:border-accent/40 hover:text-accent"
                        >
                            Open full Tree of Hope page
                        </Link>
                    </div>
                    <TreeOfHopeScene />
                </div>
            </Reveal>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedFolder === "roots-and-wings-2024" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 p-4 backdrop-blur-sm"
                        onClick={() => setSelectedFolder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="mx-auto my-6 max-w-[1100px] rounded-2xl border border-border bg-bg-card p-4 shadow-2xl sm:p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <span className="mb-2 inline-block rounded-full border border-accent/15 bg-accent-glow px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                                        Gallery Folder
                                    </span>
                                    <h3 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text-primary sm:text-3xl">
                                        Roots & Wings 2024
                                    </h3>
                                    <p className="mt-1 text-sm text-text-secondary">
                                        {rootsAndWings2024Images.length} photos
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedFolder(null)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg/80 text-text-primary transition-colors hover:bg-accent hover:text-white"
                                    aria-label="Close Roots and Wings 2024 gallery folder"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {rootsAndWings2024Images.map((image) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        className="group overflow-hidden rounded-xl border border-border bg-bg-alt text-left transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
                                        onClick={() => openImage(image)}
                                    >
                                        <span className="relative block aspect-square overflow-hidden">
                                            <Image
                                                src={image.src}
                                                alt={image.alt}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                            />
                                        </span>
                                        <span className="block min-h-[3.75rem] px-3 py-2 text-sm font-semibold leading-snug text-text-primary">
                                            {image.caption}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
