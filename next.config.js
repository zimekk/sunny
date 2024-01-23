/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ['openweathermap.org'],
    remotePatterns: [
      {
        hostname: "openweathermap.org",
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
