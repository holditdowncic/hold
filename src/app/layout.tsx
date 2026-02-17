import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme";
import CookieBanner from "@/components/CookieBanner";
import sectionsJson from "@/data/sections.json";
import "./globals.css";

const SITE_URL = "https://www.holditdowncic.uk";

type SectionsJson = Record<string, unknown>;

function getThemeCss(): string {
  const raw = (sectionsJson as SectionsJson)["theme"];
  if (!raw || typeof raw !== "object") return "";
  const theme = raw as Record<string, unknown>;

  const map: Record<string, string> = {
    bg: "--t-bg",
    bg_elevated: "--t-bg-elevated",
    bg_card: "--t-bg-card",
    bg_card_hover: "--t-bg-card-hover",
    bg_alt: "--t-bg-alt",
    surface: "--t-surface",
    border: "--t-border",
    border_hover: "--t-border-hover",
    text_primary: "--t-text-primary",
    text_secondary: "--t-text-secondary",
    text_tertiary: "--t-text-tertiary",
    accent: "--t-accent",
    accent_light: "--t-accent-light",
    accent_warm: "--t-accent-warm",
    accent_glow: "--t-accent-glow",
    hero_glow_1: "--hero-glow-1",
    hero_glow_2: "--hero-glow-2",
    grid_line: "--grid-line",
    cursor_glow: "--cursor-glow",
    particle_opacity: "--particle-opacity",
    scrollbar_thumb: "--scrollbar-thumb",
    scrollbar_thumb_hover: "--scrollbar-thumb-hover",
  };

  function cssBlock(mode: "light" | "dark"): string {
    const part = theme[mode];
    if (!part || typeof part !== "object") return "";
    const tokens = part as Record<string, unknown>;
    const lines: string[] = [];
    for (const [k, cssVar] of Object.entries(map)) {
      const v = tokens[k];
      if (v === undefined || v === null || v === "") continue;
      lines.push(`  ${cssVar}: ${String(v)};`);
    }
    if (!lines.length) return "";
    // More specific than globals.css selectors, so it wins even if order changes.
    return `html[data-theme="${mode}"] {\n${lines.join("\n")}\n}\n`;
  }

  return `${cssBlock("light")}\n${cssBlock("dark")}`.trim();
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0a10" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hold It Down CIC | Youth Organisation in London & Croydon, UK",
    template: "%s | Hold It Down CIC",
  },
  description:
    "Hold It Down CIC is a leading youth organisation in London, UK. Based in Croydon, South London, we create culturally rooted, intergenerational spaces for young people aged 12–25, fathers, families and elders. Our programmes include Roots & Wings, Talk Di TingZ, mentorship, fatherhood support, and outdoor adventures.",
  keywords: [
    // Brand
    "Hold It Down", "Hold It Down CIC", "holditdown", "holditdowncic.uk",
    // Youth + Location
    "youth organisation London", "youth organisation UK", "youth organisation Croydon",
    "youth organisation South London", "youth organisation near me",
    "youth charity London", "youth charity UK", "youth charity Croydon",
    "youth club London", "youth club Croydon", "youth club South London",
    "youth group London", "youth group Croydon", "youth group South London",
    "youth project London", "youth project Croydon",
    "youth services London", "youth services Croydon", "youth services South London",
    "youth centre Croydon", "youth centre South London",
    "youth empowerment London", "youth empowerment UK", "youth empowerment Croydon",
    "youth support London", "youth support Croydon",
    "youth mentoring London", "youth mentoring Croydon",
    "youth work London", "youth work Croydon",
    "young people London", "young people Croydon", "young people South London",
    // Community
    "community interest company", "CIC", "CIC London", "CIC Croydon",
    "community organisation London", "community organisation Croydon", "community organisation UK",
    "community group Croydon", "community group South London",
    "social enterprise London", "social enterprise Croydon", "social enterprise UK",
    // Programmes
    "Roots and Wings", "Roots and Wings Croydon", "Roots and Wings family day",
    "Talk Di TingZ", "Talk Di TingZ podcast",
    "fatherhood programmes London", "fatherhood programmes UK", "fatherhood support Croydon",
    "father and child activities London",
    "mentorship young people London", "mentorship programme Croydon",
    // Activities
    "cultural education London", "creative expression young people",
    "sport and wellbeing young people", "outdoor adventures young people London",
    "intergenerational activities London", "intergenerational community Croydon",
    "emotional wellbeing young people", "confidence building young people",
    "family support Croydon", "family activities Croydon",
    // Location
    "Croydon", "Thornton Heath", "South London", "London", "UK",
    // General
    "community cohesion", "positive identity", "resilience building",
    "UK youth charity", "Black-led community organisation",
  ],
  authors: [{ name: "Hold It Down CIC" }],
  creator: "Hold It Down CIC",
  publisher: "Hold It Down CIC",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Hold It Down CIC | Youth Organisation in London & Croydon, UK",
    description:
      "Leading youth organisation in London, UK. Creating culturally rooted, intergenerational spaces for young people, fathers and families. Youth empowerment, mentorship, fatherhood programmes, and community events in Croydon, South London.",
    url: SITE_URL,
    siteName: "Hold It Down CIC",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hold It Down CIC — Youth Organisation in London, UK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hold It Down CIC | Youth Organisation in London, UK",
    description:
      "Leading youth organisation in London. Youth empowerment, mentorship, fatherhood programmes, and community events in Croydon, South London.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
  category: "Community",
};

// JSON-LD Structured Data for rich search results
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hold It Down CIC",
  alternateName: "Hold It Down Community Interest Company",
  url: SITE_URL,
  logo: `${SITE_URL}/logos/holdlogo.png`,
  description:
    "A Croydon-based community interest company creating culturally rooted, intergenerational spaces to build emotional wellbeing, confidence and connection across families and communities.",
  foundingDate: "2022",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Thornton Heath",
    addressLocality: "Croydon",
    addressRegion: "London",
    postalCode: "CR7 8QY",
    addressCountry: "GB",
  },
  areaServed: [
    { "@type": "City", name: "Croydon" },
    { "@type": "City", name: "London" },
    { "@type": "AdministrativeArea", name: "South London" },
    { "@type": "Country", name: "United Kingdom" },
  ],
  sameAs: ["https://www.instagram.com/holditdowncic"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hollditdownuk@hotmail.com",
    contactType: "General Enquiries",
  },
  knowsAbout: [
    "Youth Empowerment",
    "Community Development",
    "Fatherhood Programmes",
    "Creative Expression",
    "Sport and Wellbeing",
    "Mentorship",
    "Intergenerational Activities",
  ],
};

// FAQ Structured Data — helps LLMs and Google answer questions about the org
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Hold It Down CIC?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hold It Down CIC is a community interest company based in Croydon, South London, UK. Founded in 2022, it creates culturally rooted, intergenerational spaces to build emotional wellbeing, confidence, and connection across families and communities. They work with young people aged 12–25, fathers, families, and elders through sport, creative expression, and mentorship.",
      },
    },
    {
      "@type": "Question",
      name: "Where is Hold It Down CIC located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hold It Down CIC is based in Thornton Heath, Croydon CR7 8QY, South London, United Kingdom. They operate across multiple South London boroughs.",
      },
    },
    {
      "@type": "Question",
      name: "What programmes does Hold It Down CIC run?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hold It Down CIC runs several programmes including: Roots & Wings Family Fun Day (a flagship intergenerational community event), Talk Di TingZ (a youth-led podcast and discussion platform), fatherhood programmes, outdoor adventures, and mentorship for young people.",
      },
    },
    {
      "@type": "Question",
      name: "How can I contact Hold It Down CIC?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can contact Hold It Down CIC by email at hollditdownuk@hotmail.com, through their website at holditdowncic.uk/contact, or via Instagram @holditdowncic.",
      },
    },
    {
      "@type": "Question",
      name: "Who does Hold It Down CIC work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hold It Down CIC works with young people aged 12–25, fathers, families, and elders from underrepresented backgrounds in Croydon and South London. Their programmes focus on emotional wellbeing, confidence building, and community connection.",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeCss = getThemeCss();
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        {/* Prevent flash: set theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`,
          }}
        />
        {themeCss ? (
          <style id="site-theme-vars" dangerouslySetInnerHTML={{ __html: themeCss }} />
        ) : null}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
