import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const SITE_URL = "https://www.holditdown.uk";

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
    default: "Hold It Down CIC | Community Interest Company in Croydon, UK",
    template: "%s | Hold It Down CIC",
  },
  description:
    "Hold It Down CIC is a Croydon-based community interest company creating culturally rooted, intergenerational spaces to build emotional wellbeing, confidence and connection across families and communities. We work with young people aged 12–25, fathers, families and elders through sport, creative expression, and mentorship.",
  keywords: [
    "Hold It Down",
    "Hold It Down CIC",
    "holditdown",
    "community interest company",
    "CIC",
    "Croydon",
    "Thornton Heath",
    "South London",
    "youth empowerment",
    "youth engagement Croydon",
    "young people Croydon",
    "community organisation Croydon",
    "cultural education",
    "intergenerational",
    "emotional wellbeing",
    "fatherhood programmes",
    "Roots and Wings",
    "Talk Di TingZ",
    "mentorship",
    "family support Croydon",
    "sport and wellbeing",
    "creative expression",
    "community cohesion",
    "positive identity",
    "resilience building",
    "UK charity",
    "social enterprise Croydon",
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
    title: "Hold It Down CIC | Community Interest Company in Croydon",
    description:
      "Creating culturally rooted, intergenerational spaces to build emotional wellbeing, confidence and connection. Youth empowerment, fatherhood programmes, and community events in Croydon, South London.",
    url: SITE_URL,
    siteName: "Hold It Down CIC",
    locale: "en_GB",
    type: "website",
    images: [
      {
        url: "/media/roots/roots-1.jpeg",
        width: 1200,
        height: 630,
        alt: "Hold It Down CIC - Community event with families and young people in Croydon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hold It Down CIC | Community Interest Company in Croydon",
    description:
      "Creating culturally rooted spaces to build emotional wellbeing and connection across families and communities in Croydon, UK.",
    images: ["/media/roots/roots-1.jpeg"],
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
    icon: "/logos/holdlogo.png",
    apple: "/logos/holdlogo.png",
  },
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
  areaServed: {
    "@type": "City",
    name: "Croydon",
    containedInPlace: { "@type": "AdministrativeArea", name: "South London" },
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Prevent flash: set theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.setAttribute('data-theme','light')}}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`,
          }}
        />
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
