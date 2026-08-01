import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    // Hosts serving the stack icons in contents/en.json.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "www.svgrepo.com",
      },
    ],
  },
};

export default nextConfig;
