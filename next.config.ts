import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the development-only Next.js route indicator out of the application viewport.
  devIndicators: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
