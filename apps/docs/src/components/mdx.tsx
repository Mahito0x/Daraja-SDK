import defaultMdxComponents from "fumadocs-ui/mdx";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import * as CustomIcons from "@/components/Icons";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...components,
    ...CustomIcons,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
