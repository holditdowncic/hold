import type { Metadata } from "next";
import RootsAndWingsFeedbackForm from "./RootsAndWingsFeedbackForm";

export const metadata: Metadata = {
  title: "Roots & Wings Feedback Form | Hold It Down CIC",
  description: "Share feedback from the Roots & Wings event with Hold It Down CIC.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootsAndWingsFeedbackPage() {
  return <RootsAndWingsFeedbackForm />;
}
