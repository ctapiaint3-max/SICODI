/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Si BACKEND_URL termina en '/', esto evita que haya doble barra //api
    const backendUrl = (process.env.BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/api',
        destination: `${backendUrl}/api`,
      },
    ];
  },
};

export default nextConfig;
