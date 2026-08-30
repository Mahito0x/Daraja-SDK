import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://darajasdk.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const docPages: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: page.url === "/docs" ? 0.9 : 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    ...docPages,
  ];
}
