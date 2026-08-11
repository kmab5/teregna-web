import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Google's sign-in button asset is served from /public as-is.
    dangerouslyAllowSVG: false,
  },
};

export default nextConfig;
