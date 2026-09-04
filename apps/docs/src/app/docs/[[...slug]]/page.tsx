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

  // Resolves across the entire content/ directory (sdk, daraja, etc.)
  const editUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/edit/${gitConfig.branch}/content/${page.path}`;
  const issueUrl = `https://github.com/${gitConfig.user}/${gitConfig.repo}/issues/new?title=${encodeURIComponent(`[Docs] ${page.data.title}`)}&labels=documentation`;

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
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/${page.path}`}
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
              href={editUrl}
              target="_blank"
              rel="noreferrer noopener"
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
