import type { Metadata } from "next";
import VotePage from "./VotePage";

export const metadata: Metadata = {
  title: "Vote | Roots & Wings Community Awards 2026",
  description: "Vote for your community heroes! Community Father Figure, Everyday Hero, Mentor of the Year, and more. Deadline: 16th May 2026.",
  openGraph: {
    title: "🏆 Roots & Wings Community Awards - Vote Now!",
    description: "Recognise the heroes in our community. Vote for Community Father Figure, Mentor of the Year, and more. Free to vote. Deadline: 16th May 2026.",
    url: "https://holditdown.uk/vote",
    siteName: "Hold It Down CIC",
    images: [
      {
        url: "https://holditdown.uk/vote-og.jpg",
        width: 1200,
        height: 630,
        alt: "Roots & Wings Community Awards 2026 - Vote Now",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "🏆 Roots & Wings Community Awards - Vote Now!",
    description: "Recognise the heroes in our community. Vote for Community Father Figure, Mentor of the Year, and more. Deadline: 16th May.",
    images: ["https://holditdown.uk/vote-og.jpg"],
  },
};

export default function Page() {
  return <VotePage />;
}
