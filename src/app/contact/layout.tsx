import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact — Get In Touch With Us",
    description:
        "Contact Hold It Down CIC to get involved, volunteer, partner, or learn more about our community programmes in Croydon, South London. Email us at hollditdownuk@hotmail.com.",
    alternates: {
        canonical: "https://www.holditdown.uk/contact",
    },
    openGraph: {
        title: "Contact | Hold It Down CIC",
        description:
            "Get in touch with Hold It Down CIC. Volunteer, partner, or join our programmes for young people and families in Croydon, South London.",
        url: "https://www.holditdown.uk/contact",
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
