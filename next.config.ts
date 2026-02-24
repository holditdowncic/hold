import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "holditdown.uk",
            },
            {
                protocol: "https",
                hostname: "*.holditdown.uk",
            },
        ],
    },
};

export default nextConfig;
