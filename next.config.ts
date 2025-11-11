import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["hebbkx1anhila5yf.public.blob.vercel-storage.com"],
  },
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
