import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent the page from being loaded in an iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing the content type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send the origin (no path) as the Referer header to external sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Allow camera and geolocation (used by the app) on self; block everything else
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(self), microphone=()",
  },
  // Disable DNS prefetching to reduce information leakage
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
