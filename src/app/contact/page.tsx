"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/* ─── Contact info items ─── */
const contactInfo = [
    {
        label: "Email",
        value: "hollditdownuk@hotmail.com",
        href: "mailto:hollditdownuk@hotmail.com",
        icon: "email",
    },
    {
        label: "Instagram",
        value: "@holditdowncic",
        href: "https://www.instagram.com/holditdowncic",
        icon: "instagram",
    },
    {
        label: "Location",
        value: "Thornton Heath, Croydon CR7 8QY",
        href: null,
        icon: "location",
    },
];

/* ─── Icons ─── */
function ContactIcon({ name }: { name: string }) {
    switch (name) {
        case "email":
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
            );
        case "instagram":
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
            );
        case "location":
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            );
        default:
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                </svg>
            );
    }
}

/* ─── Page ─── */
export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setStatus("sending");
        setErrorMsg("");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setStatus("success");
                setForm({ name: "", email: "", phone: "", subject: "", message: "" });
            } else {
                setStatus("error");
                setErrorMsg(data.error || "Something went wrong.");
            }
        } catch {
            setStatus("error");
            setErrorMsg("Network error. Please try again.");
        }
    }

    const inputClasses =
        "w-full rounded-xl border border-border bg-bg-card px-4 py-3 text-sm text-text-primary placeholder-text-tertiary outline-none transition-all duration-300 focus:border-accent/40 focus:bg-bg-card-hover focus:ring-2 focus:ring-accent/10";

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* Hero */}
            <section className="relative overflow-hidden px-5 pt-28 pb-12 sm:px-6 sm:pt-32 md:pb-16">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,var(--color-accent-glow),transparent)]" />
                <div className="relative mx-auto max-w-[1200px] text-center">
                    <Reveal>
                        <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                            Get In Touch
                        </span>
                    </Reveal>
                    <Reveal>
                        <h1 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight tracking-tight">
                            Let&apos;s{" "}
                            <span className="text-gradient">connect</span>
                        </h1>
                    </Reveal>
                    <Reveal>
                        <p className="mx-auto mt-5 max-w-[550px] text-base leading-relaxed text-text-secondary md:text-lg">
                            Whether you want to join a programme, volunteer, partner with us,
                            or just learn more — we&apos;d love to hear from you.
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* Form + Info Grid */}
            <section className="px-5 pb-16 sm:px-6 md:pb-24">
                <div className="mx-auto max-w-[1200px]">
                    <div className="grid gap-10 md:grid-cols-5 md:gap-16">
                        {/* Left — Form (3 cols) */}
                        <motion.div
                            className="md:col-span-3"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.form
                                onSubmit={handleSubmit}
                                variants={fadeUp}
                                className="rounded-2xl border border-border bg-bg-card p-6 sm:p-8"
                            >
                                <h2 className="mb-6 font-[family-name:var(--font-heading)] text-xl font-semibold">
                                    Send us a message
                                </h2>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                            Name
                                        </label>
                                        <input
                                            id="contact-name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="Your full name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className={inputClasses}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                            Email
                                        </label>
                                        <input
                                            id="contact-email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="you@example.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label htmlFor="contact-phone" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                        Phone Number
                                    </label>
                                    <input
                                        id="contact-phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="Your contact number (optional)"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div className="mt-4">
                                    <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                        Subject
                                    </label>
                                    <input
                                        id="contact-subject"
                                        name="subject"
                                        type="text"
                                        required
                                        placeholder="What is this regarding?"
                                        value={form.subject}
                                        onChange={handleChange}
                                        className={inputClasses}
                                    />
                                </div>

                                <div className="mt-4">
                                    <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-text-tertiary">
                                        Message
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        required
                                        rows={5}
                                        placeholder="Tell us what's on your mind..."
                                        value={form.message}
                                        onChange={handleChange}
                                        className={`${inputClasses} resize-none`}
                                    />
                                </div>

                                {/* Status messages */}
                                {status === "success" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400"
                                    >
                                        ✅ Message sent! We&apos;ll get back to you soon.
                                    </motion.div>
                                )}
                                {status === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
                                    >
                                        ❌ {errorMsg}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === "sending"}
                                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    {status === "sending" ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        </motion.div>

                        {/* Right — Info Cards (2 cols) */}
                        <motion.div
                            className="flex flex-col gap-4 md:col-span-2"
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={staggerContainer}
                        >
                            <motion.div variants={fadeUp}>
                                <h2 className="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
                                    Contact info
                                </h2>
                            </motion.div>

                            {contactInfo.map((item) => {
                                const isLink = !!item.href;
                                const Tag = isLink ? "a" : "div";

                                return (
                                    <motion.div key={item.label} variants={fadeUp}>
                                        <Tag
                                            {...(isLink
                                                ? {
                                                    href: item.href!,
                                                    target: item.href!.startsWith("http") ? "_blank" : undefined,
                                                    rel: item.href!.startsWith("http") ? "noopener noreferrer" : undefined,
                                                }
                                                : {})}
                                            className={`group flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 transition-all duration-400 sm:gap-5 sm:p-5 ${isLink
                                                ? "cursor-pointer hover:translate-x-1 hover:border-border-hover hover:bg-bg-card-hover"
                                                : ""
                                                }`}
                                        >
                                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-accent-glow text-accent sm:h-12 sm:w-12">
                                                <ContactIcon name={item.icon} />
                                            </div>
                                            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                                                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-tertiary sm:text-[0.7rem]">
                                                    {item.label}
                                                </span>
                                                <span className="truncate text-sm font-medium text-text-primary sm:text-base">
                                                    {item.value}
                                                </span>
                                            </div>
                                            {isLink && (
                                                <svg
                                                    className="flex-shrink-0 text-text-tertiary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                                                    width="20"
                                                    height="20"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M7 17L17 7M17 7H7M17 7V17" />
                                                </svg>
                                            )}
                                        </Tag>
                                    </motion.div>
                                );
                            })}

                            {/* Response time note */}
                            <motion.div
                                variants={fadeUp}
                                className="mt-2 rounded-xl border border-accent/10 bg-accent-glow p-5"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            Quick response
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                                            We typically respond within 24–48 hours. For urgent matters, reach us directly via email.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
