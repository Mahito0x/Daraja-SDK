import { getPageImageUrl, getPageMarkdownUrl, source } from "@/lib/source";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { gitConfig } from "@/lib/shared";
import { Pencil, Bug } from "lucide-react";
import Link from "next/link";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params;
  const slug = params.slug ?? [];

  // Fallback to ["sdk"] when visiting the base /docs route
  const page =
    source.getPage(slug) ??
    (slug.length === 0 ? source.getPage(["sdk"]) : null);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = getPageMarkdownUrl(page).url;

  // Correct monorepo path mapping for apps/docs/content
  const relativePath =
    page.path.endsWith(".mdx") || page.path.endsWith(".md")
      ? page.path
      : `${page.path}.mdx`;

  const githubFileUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/edit/${gitConfig.branch}/apps/docs/content/${relativePath}`;
  const issueUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/issues/new?title=Issue+with+${encodeURIComponent(page.data.title)}&body=${encodeURIComponent(`**Page:** [${page.data.title}](https://daraja.lumierelabs.xyz/docs${page.url})\n\n**Issue:**\n\n<!-- Describe the problem with this page -->`)}&labels=documentation`;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={githubFileUrl}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />

        {/* Edit and Report Issue Buttons */}
        <div className="mt-12 flex items-center gap-4 text-xs">
          <div className="h-px flex-1 bg-fd-border" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href={githubFileUrl}
              rel="noreferrer noopener"
              target="_blank"
              className="inline-flex items-center gap-1.5 font-medium text-fd-muted-foreground no-underline transition-colors hover:text-fd-foreground hover:no-underline"
            >
              <Pencil className="size-3.5" />
              Edit this page
            </Link>
            <span className="text-fd-muted-foreground/50">or</span>
            <Link
              href={issueUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 font-medium text-fd-muted-foreground no-underline transition-colors hover:text-fd-foreground hover:no-underline"
            >
              <Bug className="size-3.5" />
              Report an issue
            </Link>
          </div>
          <div className="h-px flex-1 bg-fd-border" />
        </div>
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">,
): Promise<Metadata> {
  const params = await props.params;
  const slug = params.slug ?? [];
  const page =
    source.getPage(slug) ??
    (slug.length === 0 ? source.getPage(["sdk"]) : null);
  if (!page) notFound();

  const canonicalPath = slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: canonicalPath,
      images: getPageImageUrl(page).url,
    },
  };
}
