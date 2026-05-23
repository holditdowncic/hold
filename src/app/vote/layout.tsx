import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vote | Roots & Wings Community Awards 2026",
  description: "Vote for your community heroes! Community Father Figure, Everyday Hero, Mentor of the Year, and more. Deadline: 17th June 2026.",
  openGraph: {
    title: "🏆 Roots & Wings Community Awards - Vote Now!",
    description: "Recognise the heroes in our community. Vote for Community Father Figure, Mentor of the Year, and more. Free to vote. Deadline: 17th June 2026.",
    url: "https://www.holditdown.uk/vote",
    siteName: "Hold It Down CIC",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🏆 Roots & Wings Community Awards - Vote Now!",
    description: "Recognise the heroes in our community. Vote for Community Father Figure, Mentor of the Year, and more. Deadline: 17th June.",
  },
};

export default function VoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
