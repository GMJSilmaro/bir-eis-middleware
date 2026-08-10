import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow remote hostname access to Next.js dev assets (HMR / client chunks).
  allowedDevOrigins: ["pxcserver.ddns.net"],
};

export default nextConfig;
