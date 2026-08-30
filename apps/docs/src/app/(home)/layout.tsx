import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export const metadata = {
  title: "Daraja SDK — Guides & API Reference",
  description:
    "Build robust integrations with the Daraja SDK using our modern developer tools, guides, and comprehensive API documentation.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
