import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  reactStrictMode: true,
  transpilePackages: ['@neon/ui', '@neon/contracts'],
};
export default nextConfig;
