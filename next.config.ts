import type { NextConfig } from "next";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
    outputFileTracingRoot: projectRoot,
    turbopack: {
        root: projectRoot,
    },
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
