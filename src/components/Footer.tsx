"use client";

import Link from "next/link";
import Image from "next/image";

const footerLinks: { label: string; href: string; isPage?: boolean }[] = [
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

export default function Footer() {
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
                src="/logos/holdlogo.png"
                alt="HOLD IT DOWN"
                fill
                className="object-contain"
                sizes="140px"
              />
            </div>
          </a>
          <p className="text-xs leading-relaxed text-text-tertiary">
            Community Interest Company
            <br />
            Registered in England &amp; Wales
            <br />
            Company No. 14377702
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
