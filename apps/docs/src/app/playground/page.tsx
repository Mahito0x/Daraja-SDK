import { ScalarReference } from "@/components/ScalarReference";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Playground",
  description: "Explore, test and interact with the Safaricom Daraja API.",
};

export default function PlaygroundPage() {
  return (
    <main className="min-h-screen">
      <ScalarReference />
    </main>
  );
}
