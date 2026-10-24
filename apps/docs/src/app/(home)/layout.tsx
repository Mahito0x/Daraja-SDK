import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

export const metadata = {
  title: "SDK & API Reference",
  description:
    "A typed, zero-nonsense TypeScript SDK and comprehensive documentation for integrating Safaricom's Daraja (M-Pesa) API.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return <HomeLayout {...baseOptions()}>{children}</HomeLayout>;
}
