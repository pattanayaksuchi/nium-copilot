/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep API routes enabled for both development and production
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    typedRoutes: true,
  }
};

module.exports = nextConfig;
