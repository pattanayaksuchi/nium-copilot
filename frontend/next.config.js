/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Only use static export in production, enable API routes in development
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Disable trailing slash for API routes to work properly
  trailingSlash: process.env.NODE_ENV === 'production' ? true : false,
  images: {
    unoptimized: true
  },
  experimental: {
    typedRoutes: true,
  }
};

module.exports = nextConfig;
