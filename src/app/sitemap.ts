import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://www.holditdown.uk";

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${baseUrl}/events`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/donate`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/refund-policy`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/stripe-verification`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.4,
        },
    ];
}
