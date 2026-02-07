"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Programs", href: "#programs" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-400 ${
        scrolled
          ? "bg-bg/85 py-3 border-b border-border backdrop-blur-xl"
          : "py-5"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-bold tracking-wide"
        >
          <span className="text-text-primary">HOLD IT</span>
          <span className="text-accent">DOWN</span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-9 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleClick(e, link.href)}
              className="group relative py-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 bg-accent transition-all duration-400 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col items-center justify-center gap-[5px] p-3 -mr-2 min-h-[44px] min-w-[44px] md:hidden"
          aria-label="Toggle navigation"
        >
          <span
            className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-6 rounded-full bg-text-primary transition-all duration-300 ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
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
              className="fixed inset-0 z-[998] bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 z-[999] h-screen w-[min(280px,85vw)] border-l border-border bg-bg-elevated md:hidden"
            >
            <div className="flex flex-col gap-2 px-6 pt-24">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleClick(e, link.href)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="py-3 text-lg font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  {link.label}
                </motion.a>
              ))}
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
