"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import VoteBanner from "@/components/VotePopup";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme";
import { donateLinkUrl } from "@/lib/donate-link";
import sectionsJson from "@/data/sections.json";

type NavLink = { label: string; href: string; isPage?: boolean; shortLabel?: string };

const defaultLinks: NavLink[] = [
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Programmes", href: "#programs" },
  { label: "Events", href: "/events", isPage: true },
  { label: "Impact", href: "#impact" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "/contact", isPage: true },
];

function safeLinks(raw: unknown): NavLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l === "object")
    .map((l) => l as NavLink)
    .filter((l) => typeof l.label === "string" && typeof l.href === "string")
    .map((l) => ({
      label: l.label,
      href: l.href,
      isPage: !!l.isPage,
      shortLabel: typeof l.shortLabel === "string" ? l.shortLabel : undefined,
    }));
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-card text-text-secondary transition-all hover:border-border-hover hover:text-accent"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.svg
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </motion.svg>
        ) : (
          <motion.svg
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const nav = (sectionsJson as unknown as Record<string, unknown>)["nav"] as Record<string, unknown> | undefined;
  const links = safeLinks(nav?.links).length ? safeLinks(nav?.links) : defaultLinks;
  const logoSrc = typeof nav?.logo_src === "string" ? nav.logo_src : "/logos/holditdown-cic-tree-logo.jpg";
  const logoAlt = typeof nav?.logo_alt === "string" ? nav.logo_alt : "Hold It Down CIC";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!isHome) return; // let Next.js Link handle navigation to /#section
    e.preventDefault();
    setOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-400 ${scrolled
        ? "bg-bg/85 border-b border-border backdrop-blur-xl"
        : "py-2"
        }`}
    >
      <VoteBanner />
      <div className={`mx-auto flex max-w-[1200px] items-center justify-between px-4 sm:px-6 ${scrolled ? "py-3" : "pt-3 pb-1"}`}>
        {/* Logo */}
        <Link
          href="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex items-center gap-2"
        >
          <div className="relative h-11 w-11 sm:h-12 sm:w-12">
            <Image
              src={logoSrc}
              alt={logoAlt}
              fill
              className="rounded-full object-cover"
              sizes="48px"
              priority
            />
          </div>
        </Link>

        {/* Desktop Links + Theme Toggle */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-9">
          {links.map((link) => {
            const label = link.shortLabel || link.label;

            return link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className="group relative py-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 bg-accent transition-all duration-400 group-hover:w-full" />
              </Link>
            ) : (
              <Link
                key={link.href}
                href={isHome ? link.href : `/${link.href}`}
                onClick={(e) => handleClick(e, link.href)}
                aria-label={link.label}
                title={link.label}
                className="group relative py-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 bg-accent transition-all duration-400 group-hover:w-full" />
              </Link>
            );
          })}
          <Link
            href={donateLinkUrl}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Donate
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile: Donate Button + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href={donateLinkUrl}
            className="inline-flex h-8 items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-4 text-xs font-semibold text-white transition-all hover:shadow-md"
          >
            Donate
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="flex flex-col items-center justify-center gap-[5px] p-3 -mr-2 min-h-[44px] min-w-[44px]"
            aria-label="Toggle navigation"
          >
            <span
              className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${open ? "translate-y-[7px] rotate-45" : ""
                }`}
            />
            <span
              className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${open ? "opacity-0" : ""
                }`}
            />
            <span
              className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 z-[999] h-screen w-[min(280px,85vw)] border-l border-border bg-bg-elevated lg:hidden"
            >
              {/* Close Button & Theme Toggle */}
              <div className="flex items-center justify-between px-4 pt-5">
                <ThemeToggle />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg-card text-text-secondary transition-colors hover:text-text-primary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-2 px-6 pt-4">
                {links.map((link, i) =>
                  link.isPage ? (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="block py-3 text-lg font-medium text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Link
                        href={isHome ? link.href : `/${link.href}`}
                        onClick={(e) => {
                          handleClick(e, link.href);
                          setOpen(false);
                        }}
                        className="block py-3 text-lg font-medium text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  )
                )}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + links.length * 0.05 }}
                  className="pt-3"
                >
                  <Link
                    href={donateLinkUrl}
                    onClick={() => setOpen(false)}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-gradient-to-r from-accent to-accent-warm px-5 py-3 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    Donate
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
