export interface Category {
    key: string;
    title: string;
    description: string;
}

export const categories: Category[] = [
    {
        key: "community_father",
        title: "Community Father Figure",
        description:
            "A man who consistently shows up for children and families and demonstrates leadership through care, responsibility and guidance.",
    },
    {
        key: "mentor_year",
        title: "Mentor of the Year",
        description:
            "A man who supports and guides young people, helping them grow in confidence, character and direction.",
    },
    {
        key: "everyday_hero",
        title: "Everyday Hero",
        description:
            "A man whose everyday actions make a meaningful difference to the lives of others.",
    },
    {
        key: "resilient_man",
        title: "Resilient Man",
        description:
            "A man who has faced significant challenges and now inspires others through strength, perseverance and support.",
    },
    {
        key: "always_there",
        title: "The Man Who's Always There",
        description:
            "A man who is consistently present and dependable for those around him, providing steady support and reliable friendship.",
    },
    {
        key: "young_role_model",
        title: "Young Male Role Model",
        description:
            "A young man who demonstrates leadership, integrity and positive influence among his peers and community.",
    },
];

export const VOTING_DEADLINE = new Date("2026-05-16T23:59:59");

export const categoryLabels: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.key, c.title])
);
