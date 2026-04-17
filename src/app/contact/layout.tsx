import type { Metadata } from "next";
import sectionsJson from "@/data/sections.json";

type SectionsJson = Record<string, unknown>;

function getSiteEmail(): string {
    try {
        const contact = ((sectionsJson as SectionsJson).contact as { items?: Array<{ label?: string; value?: string }> } | undefined) || undefined;
        const items = Array.isArray(contact?.items) ? contact!.items! : [];
        const emailItem = items.find((it) => String(it.label || "").toLowerCase() === "email");
        const v = String(emailItem?.value || "").trim();
        return v || "info@holditdown.uk";
    } catch {
        return "info@holditdown.uk";
    }
}

const SITE_EMAIL = getSiteEmail();

export const metadata: Metadata = {
    title: "Contact — Get In Touch With Us",
    description:
        `Contact Hold It Down CIC to get involved, volunteer, partner, or learn more about our community programmes in Croydon, South London. Email us at ${SITE_EMAIL}.`,
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
