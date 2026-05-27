import type { Metadata } from "next";
import CommunityTreePreview from "@/components/CommunityTreePreview";

export const metadata: Metadata = {
  title: "Tree Preview",
  description: "A visual preview of the Hold It Down CIC community tree concept.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TreePreviewPage() {
  return <CommunityTreePreview />;
}
