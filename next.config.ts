import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/webpack from bundling GCP packages that use dynamic require()
  // for native gRPC/protobuf bindings — let Node.js resolve them at runtime.
  serverExternalPackages: [
    "@google-cloud/tasks",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "google-gax",
    "google-auth-library",
    "@resvg/resvg-js",
  ],

  // Vercel's file tracer misses protos.json because it's required dynamically
  // inside @google-cloud/tasks at runtime. Force-include the whole protos dir
  // so /var/task/node_modules/@google-cloud/tasks/build/protos/ exists on Lambda.
  outputFileTracingIncludes: {
    "/api/production/assets/generate": [
      "./node_modules/@google-cloud/tasks/build/protos/**",
      "./node_modules/google-gax/build/protos/**",
    ],
    "/api/production/render-jobs/[id]/retry": [
      "./node_modules/@google-cloud/tasks/build/protos/**",
      "./node_modules/google-gax/build/protos/**",
    ],
  },
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
