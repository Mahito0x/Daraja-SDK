import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { MessageCircle } from "lucide-react";
import Image from "next/image";
import {
  AISearch,
  AISearchPanel,
  AISearchTrigger,
} from "@/components/ai/search";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";

export const metadata = {
  title: "Documentation",
  description:
    "Official guides, API references, and integration tutorials for the Daraja SDK.",
};

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      tabs={[
        {
          title: "SDK Docs",
          // icon: <Boxes className="size-4" />,
          icon: (
            <Image
              src="/logomark.svg"
              alt="Safaricom logo"
              width={80}
              height={32}
              className="w-14 h-6 object-contain"
            />
          ),
          description: "TypeScript SDK guides & setup.",
          url: "/docs/sdk",
        },
        {
          title: "Daraja API",
          icon: (
            <Image
              src="/safaricom.svg"
              alt="Safaricom logo"
              width={80}
              height={32}
              className="w-14 h-6 object-contain"
            />
          ),
          description: "Raw REST endpoints & specs.",
          url: "/docs/daraja",
        },
      ]}
    >
      <AISearch>
        <AISearchPanel />
        <AISearchTrigger
          position="float"
          className={cn(
            buttonVariants({
              variant: "secondary",
              className: "text-fd-muted-foreground rounded-2xl",
            }),
          )}
        >
          <MessageCircle className="size-4.5" />
          Ask Daraja
        </AISearchTrigger>
      </AISearch>

      {children}
    </DocsLayout>
  );
}
