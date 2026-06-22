/** @type {import('next').NextConfig} */
const nextConfig = {
  // Render-de Node.js server kimi ishledilir - static export OLMAMALI
  images: {
    unoptimized: true,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

module.exports = nextConfig;
