import { source } from "@/lib/source";
import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://daraja.lumierelabs.xyz"
).replace(/\/+$/, "");

const staticPages = [
  {
    path: "/",
    priority: 1,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/safi",
    priority: 0.9,
    changeFrequency: "weekly" as const,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const mainPages: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const docPages: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: page.url === "/docs" ? 0.9 : 0.7,
  }));

  return [...mainPages, ...docPages];
}
