import { codeToHtml } from "shiki";
import { codeExamples } from "../lib/code-examples/index";
import { TypeScript, Nextjs, Astro, Webhook } from "@/components/Icons";
import { CodeShowcaseTabs } from "@/components/CodeShowcaseTabs";

const icons = {
  typescript: TypeScript,
  nextjs: Nextjs,
  astro: Astro,
  webhook: Webhook,
} as const;

export async function CodeShowcase() {
  const tabs = await Promise.all(
    codeExamples.map(async (example) => {
      const Icon = icons[example.id as keyof typeof icons] || TypeScript;
      const html = await codeToHtml(example.code, {
        lang: example.language,
        themes: { light: "github-light", dark: "github-dark-default" },
        defaultColor: false,
      });

      return {
        id: example.id,
        filename: example.filename,
        code: example.code,
        html,
        icon: <Icon className="size-3.5" />,
      };
    }),
  );

  return (
    <section className="w-full py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <CodeShowcaseTabs tabs={tabs} />
      </div>
    </section>
  );
}

export default CodeShowcase;
