import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Send Shopify digital download links directly to the myshopify.com domain.
      // A rewrite/proxy causes a redirect loop because Shopify bounces back to the
      // custom domain. A hard redirect sends the browser straight to Shopify's
      // download server where the file is served without any further redirects.
      {
        source: "/a/downloads/:path*",
        destination: "https://psychassessmentguide-com.myshopify.com/a/downloads/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
