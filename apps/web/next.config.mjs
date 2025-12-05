/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@aiag/database', '@aiag/tinkoff', '@aiag/shared', '@aiag/api-gateway'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.yandexcloud.net',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  serverExternalPackages: ['@neondatabase/serverless'],
  // Vercel deployment optimizations
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
