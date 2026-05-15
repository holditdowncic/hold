import RootsAndWingsClient from "./RootsAndWingsClient";
import { getRW2024Images } from "@/lib/content";

export const metadata = {
  title: "Roots & Wings | Hold It Down CIC",
  description: "Our flagship programme celebrating fatherhood, family, and intergenerational connection.",
};

export default async function RootsAndWingsPage() {
  const images = await getRW2024Images();
  return <RootsAndWingsClient images={images} />;
}
