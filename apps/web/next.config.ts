import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Warning: Dangerously allow production builds to successfully complete even if the project has type errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
