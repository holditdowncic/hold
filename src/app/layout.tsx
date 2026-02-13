import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

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
  title: "Hold It Down CIC | Amplifying Unheard Voices",
  description:
    "A bold movement rooted in lived experience, creating inclusive spaces for young people and families from underrepresented backgrounds in Croydon, UK.",
  keywords: [
    "Hold It Down",
    "CIC",
    "community interest company",
    "Croydon",
    "youth empowerment",
    "Thornton Heath",
    "cultural education",
  ],
  openGraph: {
    title: "Hold It Down CIC | Amplifying Unheard Voices",
    description:
      "A bold movement rooted in lived experience, creating inclusive spaces for young people and families in Croydon, UK.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
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
