"use client";

import Image from "next/image";
import type { CustomSection } from "@/lib/types";
import { Reveal } from "@/lib/motion";

function sectionBg(bg?: CustomSection["bg"]) {
  return bg === "elevated" ? "bg-bg-elevated" : "bg-transparent";
}

function layoutClasses(layout?: CustomSection["layout"]) {
  if (layout === "image_left") return "md:grid-cols-[380px_1fr]";
  if (layout === "image_right") return "md:grid-cols-[1fr_380px]";
  return "md:grid-cols-1";
}

export default function CustomSections({ sections }: { sections: CustomSection[] }) {
  if (!sections?.length) return null;

  return (
    <>
      {sections.map((s) => {
        const hasImage = !!s.image && s.layout !== "no_image";
        const grid = hasImage ? `grid gap-8 items-center ${layoutClasses(s.layout)}` : "grid gap-8";
        const orderImageFirst = s.layout === "image_left";

        return (
          <section key={s.id} id={s.id} className={`py-12 sm:py-16 md:py-20 ${sectionBg(s.bg)}`}>
            <div className="mx-auto max-w-[1200px] px-5 sm:px-6">
              <div className={grid}>
                {hasImage && orderImageFirst ? (
                  <Reveal>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-bg-card">
                      <Image src={s.image as string} alt={s.image_alt || s.heading} fill className="object-cover" sizes="(max-width: 768px) 100vw, 380px" />
                    </div>
                  </Reveal>
                ) : null}

                <div className="text-center md:text-left">
                  {s.section_label ? (
                    <Reveal>
                      <span className="mb-5 inline-block rounded-full border border-accent/15 bg-accent-glow px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-accent">
                        {s.section_label}
                      </span>
                    </Reveal>
                  ) : null}

                  <Reveal>
                    <h2 className="mx-auto max-w-[760px] font-[family-name:var(--font-heading)] text-[clamp(1.8rem,3.6vw,2.7rem)] font-bold leading-tight tracking-tight md:mx-0">
                      {s.heading}
                    </h2>
                  </Reveal>

                  {Array.isArray(s.body) && s.body.length ? (
                    <Reveal>
                      <div className="mx-auto mt-5 max-w-[680px] space-y-3 text-base leading-relaxed text-text-secondary md:mx-0">
                        {s.body.map((p, idx) => (
                          <p key={idx}>{p}</p>
                        ))}
                      </div>
                    </Reveal>
                  ) : null}

                  {Array.isArray(s.buttons) && s.buttons.length ? (
                    <Reveal>
                      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
                        {s.buttons.map((b, idx) => {
                          const primary = b.variant === "primary";
                          const cls = primary
                            ? "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                            : "inline-flex items-center justify-center rounded-full border border-border-hover px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:bg-accent/5";
                          return (
                            <a key={idx} href={b.href} className={cls}>
                              {b.text}
                            </a>
                          );
                        })}
                      </div>
                    </Reveal>
                  ) : null}
                </div>

                {hasImage && !orderImageFirst ? (
                  <Reveal>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-bg-card">
                      <Image src={s.image as string} alt={s.image_alt || s.heading} fill className="object-cover" sizes="(max-width: 768px) 100vw, 380px" />
                    </div>
                  </Reveal>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}

