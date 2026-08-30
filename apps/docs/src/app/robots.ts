import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://darajasdk.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"], // Altho there are no public API endpoints, this is a precaution to prevent accidental indexing of any future API routes.
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
