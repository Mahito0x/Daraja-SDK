import Image from "next/image";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const gitConfig = {
  user: "Mahito0x",
  repo: "Daraja-SDK",
  branch: "main",
};

export function baseOptions(): BaseLayoutProps {
  return {
    githubUrl: "https://github.com/Mahito0x/Daraja-SDK",
    nav: {
      transparentMode: "top",
      title: (
        <div className="flex items-center gap-2.5 select-none">
          <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/logomark.svg"
              alt="Daraja SDK Logomark"
              width={32}
              height={32}
              priority
              style={{ width: "auto" }}
              className="block dark:hidden h-8 object-contain"
            />
            <Image
              src="/logomark.svg"
              alt="Daraja SDK Logomark"
              width={32}
              height={32}
              priority
              style={{ width: "auto" }}
              className="hidden dark:block h-8 object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-tighter leading-none">
            <span className="text-[#00A651]">Daraja</span>{" "}
            <span className="text-foreground">SDK</span>
          </span>
        </div>
      ),
      url: "/",
    },
  };
}
