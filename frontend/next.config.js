/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: false,
  images: {
    unoptimized: true
  },
  experimental: {
    typedRoutes: true,
  },
  distDir: process.env.NEXT_BUILD_MODE === 'production' ? '.next' : '.next-dev',
  webpack: (config, { dev }) => {
    config.cache = {
      type: 'filesystem',
      name: dev ? 'dev' : 'prod'
    };
    return config;
  }
};

module.exports = nextConfig;
