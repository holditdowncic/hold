import Link from "next/link";

const footerLinks: { label: string; href: string; isPage?: boolean }[] = [
  { label: "About", href: "#about" },
  { label: "Programmes", href: "#programs" },
  { label: "Events", href: "/events", isPage: true },
  { label: "Impact", href: "#impact" },
  { label: "Our Team", href: "#team" },
  { label: "Support Us", href: "#support" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border px-5 pt-10 pb-8 sm:px-6 md:pt-14 md:pb-10">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 sm:gap-8">
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
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 sm:gap-x-8">
          {footerLinks.map((link) =>
            link.isPage ? (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] items-center px-1 text-sm text-text-secondary transition-colors hover:text-accent"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="inline-flex min-h-[44px] items-center px-1 text-sm text-text-secondary transition-colors hover:text-accent"
              >
                {link.label}
              </a>
            )
          )}
        </div>

        {/* Bottom */}
        <div className="w-full border-t border-border pt-6 text-center sm:pt-8">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} Hold It Down CIC. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
