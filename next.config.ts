import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nextlogistik.com',
        port: '',
        pathname: '/wms/assets/upd/**',
      },
    ],
  },
};

export default nextConfig;
