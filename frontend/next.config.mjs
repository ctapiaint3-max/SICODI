/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite generar un bundle standalone para Docker
  output: 'standalone',

  async rewrites() {
    // En producción (Railway), NEXT_PUBLIC_API_URL apunta al servicio PHP desplegado.
    // En desarrollo local sigue usando localhost:8000.
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
