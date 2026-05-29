import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for catching issues early
  reactStrictMode: true,

  // Whitelist external image domains used in product cards
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
    // Use modern formats for smaller payloads
    formats: ["image/avif", "image/webp"],
  },

  // Compress responses
  compress: true,

  // Performance: tree-shake unused exports from packages
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
    ],
  },
};

export default nextConfig;
