const footerLinks = [
  { label: "About", href: "#about" },
  { label: "Mission", href: "#mission" },
  { label: "Programs", href: "#programs" },
  { label: "Impact", href: "#impact" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border px-6 pt-14 pb-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-8">
        {/* Brand */}
        <div className="text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-lg font-bold tracking-wide"
          >
            <span className="text-text-primary">HOLD IT</span>
            <span className="text-accent">DOWN</span>
          </a>
          <p className="mt-3 text-xs leading-relaxed text-text-tertiary">
            Community Interest Company
            <br />
            Registered in England & Wales
            <br />
            Company No. 14377702
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Bottom */}
        <div className="w-full border-t border-border pt-8 text-center">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Hold It Down CIC. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
