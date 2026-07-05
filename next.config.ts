import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
} satisfies Record<string, unknown>;

export default nextConfig;
