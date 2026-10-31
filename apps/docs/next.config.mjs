import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.0.105"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/docs",
        destination: "/docs/sdk",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // SAFI homepage
      {
        source: "/safi",
        destination: "https://daraja-safi.vercel.app/",
      },

      // SAFI nested routes (privacy, terms, etc.)
      {
        source: "/safi/:path*",
        destination: "https://daraja-safi.vercel.app/safi/:path*",
      },

      // PostHog
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
  webpack(config) {
    if (process.env.NODE_ENV === "development") {
      // Fumadocs loads generated files by URL, which Webpack cannot track in its filesystem cache.
      config.cache = { type: "memory" };
    }

    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.output.environment = {
      ...config.output.environment,
      asyncFunction: true,
    };

    return config;
  },
};

export default withMDX(config);
