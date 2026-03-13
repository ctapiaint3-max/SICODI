import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // En Vercel: BACKEND_URL apunta al servicio PHP en Render.
    // En desarrollo local: usa localhost:8000.
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
