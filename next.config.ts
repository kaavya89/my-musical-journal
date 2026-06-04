import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },        // Spotify
      { protocol: 'https', hostname: 'mosaic.scdn.co' },   // Spotify mosaic art
      { protocol: 'https', hostname: '*.spotifycdn.com' }, // Spotify CDN
      { protocol: 'https', hostname: 'i.ytimg.com' },      // YouTube thumbnails
    ],
  },
};

export default nextConfig;
