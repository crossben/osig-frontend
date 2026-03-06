import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,

  async rewrites() {
    return [
      {
        // Proxy all /api requests to the backend server
        // This avoids CORS issues and the need to expose the backend's random port publicly to the frontend
        source: '/api/v1/:path*',
        destination: `${process.env.INTERNAL_API_URL || 'http://localhost:8000/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
