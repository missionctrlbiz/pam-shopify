import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance: gzip/brotli compression for HTML + assets
  compress: true,

  // Performance: drop the X-Powered-By response header (small security win)
  poweredByHeader: false,

  // Enable React's native View Transition API for <Link> navigations.
  // Combined with `transitionTypes` on individual links, this animates
  // route changes between marketing pages (per the
  // vercel-react-view-transitions skill).
  experimental: {
    viewTransition: true,
  },

  // Performance: serve modern image formats
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // GCP Cloud Tasks bundling config is commented out during the Trigger.dev migration.
  // Keep only the packages still needed by the active inline path.
  serverExternalPackages: [
    // "@google-cloud/tasks",
    // "@grpc/grpc-js",
    // "@grpc/proto-loader",
    // "google-gax",
    // "google-auth-library",
    "@remotion/renderer",
    "@remotion/bundler",
    "remotion",
    "@resvg/resvg-js-darwin-arm64",
    "@resvg/resvg-js-darwin-x64",
    "@resvg/resvg-js-linux-arm64-gnu",
    "@resvg/resvg-js-linux-arm64-musl",
    "@resvg/resvg-js-linux-x64-gnu",
    "@resvg/resvg-js-linux-arm64-musl",
    "@resvg/resvg-js-win32-arm64-msvc",
    "@resvg/resvg-js-win32-x64-msvc",
  ],

  // outputFileTracingIncludes: {
  //   "/api/production/assets/generate": [
  //     "./node_modules/@google-cloud/tasks/build/protos/**",
  //     "./node_modules/google-gax/build/protos/**",
  //   ],
  //   "/api/production/render-jobs/[id]/retry": [
  //     "./node_modules/@google-cloud/tasks/build/protos/**",
  //     "./node_modules/google-gax/build/protos/**",
  //   ],
  // },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*).png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
        ],
      },
      {
        source: "/(.*).webp",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect Shopify download links from custom domain to myshopify.com
      // to avoid 404 when they're clicked in order confirmation emails.
      // This is a temporary 307 redirect, so Shopify's download server serves the file directly
      // without any further bouncing back to the custom domain.
      {
        source: "/a/downloads/:path*",
        destination:
          "https://psychassessmentguide-com.myshopify.com/a/downloads/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
