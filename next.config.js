/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const isExport = process.env.NEXT_OUTPUT_EXPORT === 'true'

const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: 'export' } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath + '/', trailingSlash: true } : {}),
}
module.exports = nextConfig
