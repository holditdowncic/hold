import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Events — Community Events & Programmes",
    description:
        "Explore Hold It Down CIC's community events in Croydon, South London. From Roots & Wings Family Fun Days to Talk Di TingZ youth podcast sessions, our events bring people together to connect, heal, and celebrate.",
    alternates: {
        canonical: "https://www.holditdowncic.uk/events",
    },
    openGraph: {
        title: "Events | Hold It Down CIC",
        description:
            "Community events bringing families and young people together in Croydon. Roots & Wings Family Fun Day, Talk Di TingZ podcasts, outdoor adventures, and more.",
        url: "https://www.holditdowncic.uk/events",
        images: [
            {
                url: "/media/roots/roots-1.jpeg",
                width: 1200,
                height: 630,
                alt: "Hold It Down CIC community event in Croydon",
            },
        ],
    },
};

export default function EventsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
