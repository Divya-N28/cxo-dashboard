/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing configuration
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Add proxy configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.turbohire.co/api/:path*',
      },      
    ];
  },
};

module.exports = nextConfig; 