/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Variantle 2 / 3 were consolidated into a single /variantle page.
  async redirects() {
    return [
      { source: "/variantle-2", destination: "/variantle", permanent: true },
      { source: "/variantle-3", destination: "/variantle", permanent: true },
    ];
  },
};

module.exports = nextConfig;
