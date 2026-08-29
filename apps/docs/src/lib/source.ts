import { loader } from "fumadocs-core/source";
import { docsContentRoute, docsImageRoute, docsRoute } from "./shared";
import { defineDocs } from "fumadocs-mdx/macro";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { createElement, type ComponentType } from "react";
import { Icons } from "@/components/Icons";
import { icons as LucideIcons } from "lucide-react";

const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;

    const CustomIcon = Icons[icon as keyof typeof Icons] as
      ComponentType<{ className?: string }> | undefined;
    if (CustomIcon)
      return createElement(CustomIcon, { className: "size-4 shrink-0" });

    const LucideIcon = LucideIcons[icon as keyof typeof LucideIcons];
    if (LucideIcon)
      return createElement(LucideIcon, { className: "size-4 shrink-0" });

    return undefined;
  },
});

export function getPageImageUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "image.png"];

  return {
    segments,
    url:
      "/" +
      [page.locale, ...docsImageRoute.split("/"), ...segments]
        .filter(Boolean)
        .join("/"),
  };
}

export function getPageMarkdownUrl(page: (typeof source)["$inferPage"]) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url:
      "/" +
      [page.locale, ...docsContentRoute.split("/"), ...segments]
        .filter(Boolean)
        .join("/"),
  };
}

export async function getLLMText(page: (typeof source)["$inferPage"]) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}
