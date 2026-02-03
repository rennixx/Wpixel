/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  experimental: {
    optimizePackageImports: ['three', '@react-three/fiber', '@react-three/drei']
  }
}

module.exports = nextConfig
