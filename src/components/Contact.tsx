"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";

const contactItems = [
  {
    label: "Email",
    value: "hollditdownuk@hotmail.com",
    href: "mailto:hollditdownuk@hotmail.com",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    value: "@holditdowncic",
    href: "https://www.instagram.com/holditdowncic",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "Location",
    value: "Thornton Heath, Croydon CR7 8QY",
    href: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const enquiryTypes = [
  "Join a Programme",
  "Volunteer With Us",
  "Partnership Enquiry",
  "Donation / Funding",
  "General Enquiry",
];

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enquiry, setEnquiry] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(
      enquiry ? `${enquiry} — from ${name}` : `Website Enquiry from ${name}`
    );
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nEnquiry Type: ${enquiry || "General"}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:hollditdownuk@hotmail.com?subject=${subject}&body=${body}`;
  }

  return (
    <section id="contact" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-12 md:mb-16">
          <Reveal>
            <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              Get In Touch
            </span>
          </Reveal>
          <Reveal>
            <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
              Let&apos;s <span className="text-gradient">connect</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className="mx-auto mt-5 max-w-[600px] text-base leading-relaxed text-text-secondary md:text-lg">
              Whether you want to join a programme, volunteer, partner with us,
              or just learn more &mdash; we&apos;d love to hear from you.
            </p>
          </Reveal>
        </div>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          {/* Left - Contact Form */}
          <Reveal>
            <form
              onSubmit={handleSubmit}
              className="space-y-5 rounded-2xl border border-border bg-bg-card p-6 sm:p-8"
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Email Address
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              {/* Enquiry Type */}
              <div>
                <label
                  htmlFor="contact-enquiry"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  I&apos;m Interested In
                </label>
                <select
                  id="contact-enquiry"
                  value={enquiry}
                  onChange={(e) => setEnquiry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {enquiryTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Your Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us a bit about what you're looking for..."
                  className="w-full resize-none rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary transition-colors focus:border-accent focus:outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span>Send Message</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </Reveal>

          {/* Right - Contact Info */}
          <div className="flex flex-col gap-6">
            <Reveal>
              <p className="text-sm leading-relaxed text-text-secondary">
                You can also reach us directly through the channels below. We
                aim to respond within 48 hours.
              </p>
            </Reveal>

            <motion.div
              className="flex flex-col gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {contactItems.map((item) => {
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
                      className={`group flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 transition-[border-color,transform] duration-300 sm:p-5 ${
                        isLink
                          ? "cursor-pointer hover:translate-x-1 hover:border-accent/30"
                          : ""
                      }`}
                    >
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent-glow text-accent">
                        {item.icon}
                      </div>
                      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-tertiary">
                          {item.label}
                        </span>
                        <span className="truncate text-sm font-medium text-text-primary">
                          {item.value}
                        </span>
                      </div>
                      {isLink && (
                        <svg
                          className="flex-shrink-0 text-text-tertiary transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-accent"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </Tag>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Quick action buttons */}
            <Reveal>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <a
                  href="mailto:hollditdownuk@hotmail.com?subject=Volunteer%20Enquiry"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-primary transition-[border-color] duration-300 hover:border-accent/30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  Volunteer
                </a>
                <a
                  href="mailto:hollditdownuk@hotmail.com?subject=Partnership%20Enquiry"
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-3 text-sm font-medium text-text-primary transition-[border-color] duration-300 hover:border-accent/30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Partner
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
