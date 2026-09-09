import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: an unrelated lockfile in the home directory
  // otherwise makes Next.js misdetect the monorepo root.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
