import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy Shopify digital download links so they resolve correctly
      // instead of being caught by Next.js routing on Vercel.
      {
        source: "/a/downloads/:path*",
        destination: "https://psychassessmentguide-com.myshopify.com/a/downloads/:path*",
      },
      // Also proxy any other Shopify-native /a/ routes (apps, etc.)
      {
        source: "/a/:path*",
        destination: "https://psychassessmentguide-com.myshopify.com/a/:path*",
      },
    ];
  },
};

export default nextConfig;
