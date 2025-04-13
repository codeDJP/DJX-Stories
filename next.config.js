/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  swcMinify: true,
}

module.exports = nextConfig