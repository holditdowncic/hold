"use client";

import { motion } from "framer-motion";
import { Reveal, fadeUp, staggerContainer } from "@/lib/motion";
import type { ContactContent } from "@/lib/types";

const defaultContact: ContactContent = {
  section_label: "Get In Touch",
  heading: "Let\u2019s connect",
  description: "We\u2019d love to hear from you. Whether you want to join a programme, volunteer, partner with us, or just learn more \u2014 reach out.",
  items: [
    { label: "Email", value: "hollditdownuk@hotmail.com", href: "mailto:hollditdownuk@hotmail.com", icon: "email" },
    { label: "Instagram", value: "@holditdowncic", href: "https://www.instagram.com/holditdowncic", icon: "instagram" },
    { label: "Location", value: "Thornton Heath, Croydon CR7 8QY", href: null, icon: "location" },
  ],
};

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

interface ContactProps {
  content: ContactContent | null;
}

export default function Contact({ content }: ContactProps) {
  const data = content ?? defaultContact;

  // Split heading for gradient
  const headingWords = data.heading.split(" ");
  const lastWord = headingWords.pop();
  const headingPrefix = headingWords.join(" ");

  return (
    <section id="contact" className="py-12 sm:py-16 md:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2 md:gap-20">
          {/* Left */}
          <div>
            <Reveal>
              <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                {data.section_label}
              </span>
            </Reveal>
            <Reveal>
              <h2 className="mb-5 font-[family-name:var(--font-heading)] text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight">
                {headingPrefix} <span className="text-gradient">{lastWord}</span>
              </h2>
            </Reveal>
            <Reveal>
              <p className="leading-relaxed text-text-secondary">
                {data.description}
              </p>
            </Reveal>
          </div>

          {/* Right */}
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {data.items.map((item) => {
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
                    className={`group flex items-center gap-4 rounded-xl border border-border bg-bg-card p-4 transition-all duration-400 sm:gap-5 sm:p-6 ${isLink
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
                      <span className="truncate text-sm font-medium text-text-primary sm:text-base" style={{ overflowWrap: "break-word" }}>{item.value}</span>
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
          </motion.div>
        </div>
      </div>
    </section>
  );
}
