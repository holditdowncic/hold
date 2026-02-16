"use client";

import Link from "next/link";
import Image from "next/image";
import sectionsJson from "@/data/sections.json";

type FooterLink = { label: string; href: string; isPage?: boolean };

const defaultFooterLinks: FooterLink[] = [
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Programmes", href: "#programs" },
  { label: "Events", href: "/events", isPage: true },
  { label: "Impact", href: "#impact" },
  { label: "Team", href: "#team" },
  { label: "Support", href: "#support" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "/contact", isPage: true },
];

function safeLinks(raw: unknown): FooterLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l === "object")
    .map((l) => l as FooterLink)
    .filter((l) => typeof l.label === "string" && typeof l.href === "string")
    .map((l) => ({ label: l.label, href: l.href, isPage: !!l.isPage }));
}

function safeLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => typeof x === "string") as string[];
}

export default function Footer() {
  const footer = (sectionsJson as unknown as Record<string, unknown>)["footer"] as Record<string, unknown> | undefined;
  const footerLinks = safeLinks(footer?.links).length ? safeLinks(footer?.links) : defaultFooterLinks;
  const lines = safeLines(footer?.lines);
  const logoSrc = typeof footer?.logo_src === "string" ? footer.logo_src : "/logos/holdlogo.png";
  const logoAlt = typeof footer?.logo_alt === "string" ? footer.logo_alt : "HOLD IT DOWN";
  const resolvedLines = lines.length ? lines : ["Community Interest Company", "Registered in England & Wales", "Company No. 14377702"];

  return (
    <footer className="border-t border-border px-4 pt-8 pb-6 sm:px-6 sm:pt-10 sm:pb-8 md:pt-14 md:pb-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 sm:gap-8">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mb-4"
          >
            <div className="relative h-28 w-[280px] sm:h-32 sm:w-[320px]">
              <Image
                src={logoSrc}
                alt={logoAlt}
                fill
                className="object-contain"
                sizes="140px"
              />
            </div>
          </a>
          <p className="text-xs leading-relaxed text-text-tertiary">
            {resolvedLines.map((line, idx) => (
              <span key={idx}>
                {line}
                {idx < resolvedLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>

        {/* Links */}
        <div className="grid grid-cols-3 gap-x-2 gap-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-1">
          {footerLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] items-center justify-center text-[0.8125rem] text-text-secondary transition-colors sm:px-1 sm:text-sm hover:text-accent"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] items-center justify-center text-[0.8125rem] text-text-secondary transition-colors sm:px-1 sm:text-sm hover:text-accent"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Bottom */}
        <div className="w-full border-t border-border pt-5 text-center sm:pt-8">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Hold It Down CIC. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
