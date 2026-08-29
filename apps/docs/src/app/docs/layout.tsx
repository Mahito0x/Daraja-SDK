import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import {
  AISearch,
  AISearchPanel,
  AISearchTrigger,
} from "@/components/ai/search";
import { MessageCircle, MessageCircleIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "fumadocs-ui/components/ui/button";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout tree={source.getPageTree()} {...baseOptions()}>
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
