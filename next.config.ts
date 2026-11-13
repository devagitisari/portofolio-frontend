import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const connectSrc = [
  "'self'",
  // The API is served by this same app — allow both the apex domain and the
  // (optional) api. subdomain.
  "https://devagitisari.my.id",
  "https://www.devagitisari.my.id",
  "https://api.devagitisari.my.id",
  "https://res.cloudinary.com",
  ...(isDev
    ? ["http://localhost:8000", "http://127.0.0.1:8000", "ws://localhost:3000", "ws://127.0.0.1:3000"]
    : []),
].join(" ");

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  "https:",
  ...(isDev ? ["http://localhost:8000", "http://127.0.0.1:8000"] : []),
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src ${imgSrc}`,
  `connect-src ${connectSrc}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

// The API serves the GitHub contribution graph, which is embedded in an iframe
// on the home page — it must be allowed to be framed by the site itself.
const apiContentSecurityPolicy = contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Content-Security-Policy", value: apiContentSecurityPolicy },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
