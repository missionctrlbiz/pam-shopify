import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GCP Cloud Tasks bundling config is commented out during the Trigger.dev migration.
  // Keep only the packages still needed by the active inline path.
  serverExternalPackages: [
    // "@google-cloud/tasks",
    // "@grpc/grpc-js",
    // "@grpc/proto-loader",
    // "google-gax",
    // "google-auth-library",
    "@remotion/renderer",
    "@resvg/resvg-js-darwin-arm64",
    "@resvg/resvg-js-darwin-x64",
    "@resvg/resvg-js-linux-arm64-gnu",
    "@resvg/resvg-js-linux-arm64-musl",
    "@resvg/resvg-js-linux-x64-gnu",
    "@resvg/resvg-js-linux-x64-musl",
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
  async redirects() {
    return [
      // Redirect Shopify download links from custom domain to myshopify.com
      // to avoid 404 when they're clicked in order confirmation emails.
      // This is a temporary 307 redirect, so Shopify's download server serves the file directly
      // without any further bouncing back to the custom domain.
      {
        source: "/a/downloads/:path*",
        destination: "https://psychassessmentguide-com.myshopify.com/a/downloads/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
