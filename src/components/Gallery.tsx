"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Reveal, staggerContainer, fadeUp } from "@/lib/motion";
import type { GalleryImage, GalleryContent } from "@/lib/types";

function TreeOfHopePlaceholder() {
    return (
        <div
            data-tree-placeholder
            className="relative min-h-[460px] overflow-hidden rounded-[1.5rem] border border-[#87a33f]/30 bg-[#cfe7a0] shadow-xl shadow-black/5 sm:min-h-[560px] md:min-h-[640px]"
            aria-hidden="true"
        >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#d7eab1_0%,#eef4d9_52%,#97c94d_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(circle_at_50%_20%,rgba(140,196,65,0.65),rgba(74,128,22,0.18)_52%,transparent_72%)]" />
        </div>
    );
}

const TreeOfHopeScene = dynamic(() => import("./TreeOfHopeScene"), {
    ssr: false,
    loading: () => <TreeOfHopePlaceholder />,
});

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

type GalleryFolder = {
    id: string;
    title: string;
    description: string;
    sortOrder: number;
    coverImage: GalleryImage;
    images: GalleryImage[];
};

const folderMetadata: Record<string, { title: string; description: string; sortOrder: number }> = {
    "community-gallery": {
        title: "Community Gallery",
        description: "Hold It Down moments from Roots & Wings, workshops, youth voice, and community events.",
        sortOrder: 1,
    },
    "roots-and-wings-2024": {
        title: "Roots & Wings 2024",
        description: "Uploaded event photos from the Roots & Wings 2024 family day.",
        sortOrder: 2,
    },
};

function getGalleryFolderId(image: GalleryImage): string {
    if (image.src.startsWith("/gallery/roots-and-wings-2024/")) {
        return "roots-and-wings-2024";
    }

    return "community-gallery";
}

function buildGalleryFolders(images: GalleryImage[]): GalleryFolder[] {
    const folders = new Map<string, GalleryImage[]>();

    for (const image of images) {
        const folderId = getGalleryFolderId(image);
        folders.set(folderId, [...(folders.get(folderId) ?? []), image]);
    }

    return Array.from(folders.entries())
        .map(([id, folderImages]) => {
            const metadata = folderMetadata[id] ?? {
                title: "Gallery Folder",
                description: "Community photos and moments.",
                sortOrder: 99,
            };
            const sortedImages = [...folderImages].sort(
                (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
            );

            return {
                id,
                ...metadata,
                coverImage: sortedImages[0],
                images: sortedImages,
            };
        })
        .filter((folder): folder is GalleryFolder => Boolean(folder.coverImage))
        .sort((a, b) => a.sortOrder - b.sortOrder);
}

interface GalleryProps {
    images: GalleryImage[];
    meta: GalleryContent | null;
}

export default function Gallery({ images, meta }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [lightboxImages, setLightboxImages] = useState<GalleryImage[]>([]);
    const [treeShouldLoad, setTreeShouldLoad] = useState(false);
    const treeMountRef = useRef<HTMLDivElement | null>(null);
    const galleryImages = images.length > 0 ? images : defaultImages;
    const galleryFolders = buildGalleryFolders(galleryImages);
    const selectedFolderData = selectedFolder
        ? galleryFolders.find((folder) => folder.id === selectedFolder) ?? null
        : null;
    const activeLightboxImages = lightboxImages.length > 0 ? lightboxImages : galleryImages;
    const openImage = (image: GalleryImage, sourceImages: GalleryImage[] = galleryImages) => {
        const imageIndex = sourceImages.findIndex((item) => item.id === image.id);
        if (imageIndex < 0) return;
        setLightboxImages(sourceImages);
        setSelectedImage(imageIndex);
    };

    const sectionLabel = meta?.section_label ?? "Gallery";
    const heading = meta?.heading ?? "Moments that matter";
    const description = meta?.description ?? "Highlights from our community events — real families, real connections, real impact.";
    // Split heading for gradient effect
    const headingParts = heading.split(" ");
    const lastWord = headingParts.pop();
    const headingPrefix = headingParts.join(" ");

    useEffect(() => {
        if (treeShouldLoad) return;
        const node = treeMountRef.current;
        if (!node) return;

        if (!("IntersectionObserver" in window)) {
            const fallbackTimer = setTimeout(() => setTreeShouldLoad(true), 0);
            return () => clearTimeout(fallbackTimer);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setTreeShouldLoad(true);
                observer.disconnect();
            },
            { rootMargin: "900px 0px" }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [treeShouldLoad]);

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
                    {galleryFolders.map((folder, index) => {
                        const isWide = index === 0 || folder.images.length > 8;
                        return (
                            <motion.button
                                key={folder.id}
                                type="button"
                                variants={fadeUp}
                                className={`group cursor-pointer overflow-hidden rounded-xl border border-border bg-bg-card text-left transition-all duration-300 hover:border-accent/30 hover:shadow-xl ${isWide ? "col-span-2" : ""}`}
                                onClick={() => setSelectedFolder(folder.id)}
                                aria-label={`Open ${folder.title} folder`}
                            >
                                <div className="relative aspect-[16/10] overflow-hidden">
                                    <Image
                                        src={folder.coverImage.src}
                                        alt={`${folder.title} gallery folder`}
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
                                            {folder.title}
                                        </h3>
                                        <p className="mt-1 text-sm font-medium text-white/85">
                                            {folder.images.length} photos
                                        </p>
                                    </div>
                                </div>
                                <span className="flex min-h-[4.25rem] items-center px-3 py-3 text-sm font-semibold leading-snug text-text-primary sm:px-4">
                                    {folder.description}
                                </span>
                            </motion.button>
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
                    </div>
                    <div ref={treeMountRef}>
                        {treeShouldLoad ? <TreeOfHopeScene /> : <TreeOfHopePlaceholder />}
                    </div>
                </div>
            </Reveal>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedFolderData && (
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
                                        {selectedFolderData.title}
                                    </h3>
                                    <p className="mt-1 text-sm text-text-secondary">
                                        {selectedFolderData.images.length} photos
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedFolder(null)}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg/80 text-text-primary transition-colors hover:bg-accent hover:text-white"
                                    aria-label={`Close ${selectedFolderData.title} gallery folder`}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {selectedFolderData.images.map((image) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        className="group overflow-hidden rounded-xl border border-border bg-bg-alt text-left transition-all duration-300 hover:border-accent/30 hover:shadow-lg"
                                        onClick={() => openImage(image, selectedFolderData.images)}
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
                {selectedImage !== null && activeLightboxImages[selectedImage] && (
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
                                    setSelectedImage(selectedImage === 0 ? activeLightboxImages.length - 1 : selectedImage - 1);
                                } else if (info.offset.x < -80) {
                                    setSelectedImage(selectedImage === activeLightboxImages.length - 1 ? 0 : selectedImage + 1);
                                }
                            }}
                            className="relative max-h-[80vh] max-w-[92vw] overflow-hidden rounded-2xl border border-border sm:max-h-[85vh] sm:max-w-[90vw]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={activeLightboxImages[selectedImage].src}
                                alt={activeLightboxImages[selectedImage].alt}
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
                                    {activeLightboxImages[selectedImage].caption}
                                </p>
                            </div>
                            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-3 sm:bottom-4 sm:gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === 0 ? activeLightboxImages.length - 1 : selectedImage - 1);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-full bg-bg/80 text-text-primary backdrop-blur-sm transition-colors hover:bg-accent hover:text-white"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <span className="flex items-center px-3 text-sm text-text-secondary">
                                    {selectedImage + 1} / {activeLightboxImages.length}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(selectedImage === activeLightboxImages.length - 1 ? 0 : selectedImage + 1);
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
