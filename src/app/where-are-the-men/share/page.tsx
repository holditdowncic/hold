import type { Metadata } from "next";
import ShareYourVoiceForm from "./ShareYourVoiceForm";

export const metadata: Metadata = {
  title: "Share Your Voice | Where Are The Men",
  description:
    "Share your thoughts, suggestions, or reflections with Hold It Down CIC's Where Are The Men campaign.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WhereAreTheMenSharePage() {
  return <ShareYourVoiceForm />;
}
