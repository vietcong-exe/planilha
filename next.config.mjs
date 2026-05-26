/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable client-side Router Cache for dynamic routes.
    // Without this, Next.js holds RSC payloads in memory for 30s by default,
    // so router.refresh() after insert/update/delete shows stale data.
    staleTimes: {
      dynamic: 0,
    },
  },
}

export default nextConfig;
