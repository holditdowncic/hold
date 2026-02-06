import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="scroll-smooth">
      <head>
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
