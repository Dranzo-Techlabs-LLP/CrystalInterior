/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // The site uses plain <img> elements (Unsplash URLs are sized by their query
    // string, the film frames are pre-encoded WebP), so the optimizer is unused.
    unoptimized: true,
  },
};

export default nextConfig;
