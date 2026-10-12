import type { NextConfig } from "next";
const config: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.OVIA_BUILD_DIR || ".next",
  serverExternalPackages: ["pdf-parse", "mammoth"],
  turbopack: { root: process.cwd() },
  poweredByHeader: false,
  images: {
    qualities: [75, 90, 95, 100],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "www.rimowa.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://checkout.razorpay.com https://embed.tawk.to https://*.tawk.to; style-src 'self' 'unsafe-inline' https://*.tawk.to; img-src 'self' data: blob: https://res.cloudinary.com https://tile.openstreetmap.org https://www.rimowa.com https://*.tawk.to https://tawk.link; font-src 'self' data: https://*.tawk.to; connect-src 'self' ${process.env.SUPPORT_REALTIME_URL ? new URL(process.env.SUPPORT_REALTIME_URL).origin + " " + new URL(process.env.SUPPORT_REALTIME_URL).origin.replace(/^http/, "ws") : process.env.NODE_ENV === "development" ? "http://localhost:3001 ws://localhost:3001" : ""} https://api.razorpay.com https://checkout.razorpay.com https://*.tawk.to wss://*.tawk.to https://*.algolia.net https://*.algolianet.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.tawk.to; worker-src 'self' blob:; media-src 'self' blob: https://*.tawk.to https://designerstephen.github.io; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
