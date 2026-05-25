"use client";

import Link from "next/link";
import Image from "next/image";
import { donateLinkUrl } from "@/lib/donate-link";
import sectionsJson from "@/data/sections.json";

type FooterLink = { label: string; href: string; isPage?: boolean };

const defaultFooterLinks: FooterLink[] = [
  { label: "About", href: "/#about" },
  { label: "Mission", href: "/#mission" },
  { label: "Programmes", href: "/#programs" },
  { label: "Events", href: "/events", isPage: true },
  { label: "Impact", href: "/#impact" },
  { label: "Team", href: "/#team" },
  { label: "Support", href: "/#support" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Contact", href: "/contact", isPage: true },
];

const defaultLegalLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy-policy", isPage: true },
  { label: "Terms & Conditions", href: "/terms", isPage: true },
  { label: "Refund Policy", href: "/refund-policy", isPage: true },
  { label: "Stripe Verification", href: "/stripe-verification", isPage: true },
];

function normalizeFooterHref(href: string): string {
  return href.startsWith("#") ? `/${href}` : href;
}

function safeLinks(raw: unknown): FooterLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l === "object")
    .map((l) => l as FooterLink)
    .filter((l) => typeof l.label === "string" && typeof l.href === "string")
    .map((l) => ({
      label: l.label,
      href: normalizeFooterHref(l.href),
      isPage: !!l.isPage,
    }));
}

function safeLines(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => typeof x === "string") as string[];
}

export default function Footer() {
  const footer = (sectionsJson as unknown as Record<string, unknown>)["footer"] as Record<string, unknown> | undefined;
  const footerLinks = safeLinks(footer?.links).length ? safeLinks(footer?.links) : defaultFooterLinks;
  const legalLinks = safeLinks(footer?.legal_links).length ? safeLinks(footer?.legal_links) : defaultLegalLinks;
  const lines = safeLines(footer?.lines);
  const logoSrc = typeof footer?.logo_src === "string" ? footer.logo_src : "/logos/holdlogo.png";
  const logoAlt = typeof footer?.logo_alt === "string" ? footer.logo_alt : "HOLD IT DOWN";
  const resolvedLines = lines.length ? lines : [
    "Community Interest Company (CIC)",
    "Registered in England & Wales",
    "Company No. 14377702",
    "102 Buller Road, Thornton Heath, England, CR7 8QY",
  ];
  const contact = (sectionsJson as unknown as Record<string, unknown>)["contact"] as { email?: string; items?: Array<{ label?: string; value?: string }> } | undefined;
  const supportEmail =
    (Array.isArray(contact?.items)
      ? contact?.items?.find((item) => String(item.label || "").trim().toLowerCase() === "email")?.value
      : "") ||
    contact?.email ||
    "info@holditdown.uk";

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
          <a
            href={`mailto:${supportEmail}`}
            className="mt-3 text-xs text-accent transition-colors hover:text-accent-warm"
          >
            {supportEmail}
          </a>
          <Link
            href={donateLinkUrl}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Donate
          </Link>
        </div>

        {/* Links */}
        <div className="grid w-full gap-6 sm:grid-cols-2">
          <div className="text-center">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
              Explore
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-1">
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
          </div>

          <div className="text-center">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
              Legal
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-1">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-[44px] items-center justify-center text-[0.8125rem] text-text-secondary transition-colors sm:px-1 sm:text-sm hover:text-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
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
