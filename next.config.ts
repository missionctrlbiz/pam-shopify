import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling GCP packages that use dynamic require()
  // for native gRPC/protobuf bindings — let Node.js resolve them at runtime.
  serverExternalPackages: [
    "@google-cloud/tasks",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "google-gax",
    "google-auth-library",
  ],
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
