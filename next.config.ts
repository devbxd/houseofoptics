import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB — a single photo straight off a phone (often
      // 3-10MB, HEIC or JPEG) blows past that and the rejected request
      // surfaces to the client as an unhandled crash, not a helpful error.
      bodySizeLimit: "15mb",
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
    qualities: [75, 90, 95],
    // Storage paths are UUID-named and never overwritten in place, so a
    // resized/optimized variant is safe to cache for a long time — without
    // this Next only caches optimizer output for 60s, re-pulling the
    // original from Supabase Storage (billed as Cached Egress) constantly.
    minimumCacheTTL: 31536000,
  },
};

export default nextConfig;
