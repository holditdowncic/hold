"use client";

import { Reveal } from "@/lib/motion";

export default function CTA() {
  return (
    <section className="pb-16 sm:pb-20 md:pb-36">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-border bg-bg-card px-5 py-12 text-center sm:rounded-3xl sm:px-8 sm:py-16 md:px-16 md:py-20">
            {/* Background Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="cta-orb-1 absolute -top-48 -right-24 h-96 w-96 rounded-full bg-accent opacity-30 blur-[80px]" />
              <div className="cta-orb-2 absolute -bottom-36 -left-12 h-72 w-72 rounded-full bg-accent-warm opacity-30 blur-[80px]" />
            </div>

            <div className="relative z-10">
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-[clamp(1.4rem,4vw,2.8rem)] font-bold tracking-tight sm:mb-5">
                Ready to be part of the movement?
              </h2>
              <p className="mx-auto mb-8 max-w-[600px] text-base leading-relaxed text-text-secondary sm:mb-10 md:text-lg">
                Whether you&apos;re a young person looking for a safe space, a
                family seeking community, or someone who wants to support
                grassroots change &mdash; we want to hear from you.
              </p>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector("#contact")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-accent to-accent-warm px-7 py-3.5 text-sm font-semibold text-bg transition-all sm:px-10 sm:py-4 sm:text-base hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(200,162,248,0.25)]"
              >
                <span>Join Us</span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                >
                  <path d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
