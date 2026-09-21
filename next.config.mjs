/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Placeholder imagery. Replace the Picsum URLs in the components with your
    // own assets (drop them in public/events, public/gallery, ...) and remove
    // these two remotePatterns entries.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
