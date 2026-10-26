import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Safi Analytics — Private M-PESA Statement Analyzer",
    template: "%s | Safi Analytics",
  },
  description:
    "Upload and analyze your M-PESA PDF statements securely in your browser. Get deep financial insights, interactive trend charts, spending mix breakdowns, and privacy-masked summaries without sending data to any external server.",
  keywords: [
    "M-PESA statement analyzer",
    "Safi Analytics",
    "M-PESA PDF parser",
    "Kenyan financial tool",
    "M-PESA expense tracker",
    "Daraja SDK",
    "Lumière Labs",
  ],
  authors: [{ name: "Lumière Labs", url: "https://lumierelabs.xyz" }],
  creator: "Lumière Labs",
  publisher: "Lumière Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://daraja.lumierelabs.xyz"),
  alternates: {
    canonical: "/safi",
  },
  openGraph: {
    title: "Safi Analytics — Private M-PESA Statement Analyzer",
    description:
      "Analyze your M-PESA statements securely and privately right inside your browser with advanced financial charts and official statement summaries.",
    url: "https://daraja.lumierelabs.xyz/safi",
    siteName: "Safi Analytics",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safi Analytics - Private M-PESA Statement Analyzer Dashboard",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safi Analytics — Private M-PESA Statement Analyzer",
    description:
      "Secure client-side M-PESA statement parsing, interactive financial trend charts, and privacy-masked summaries.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function SafiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      {children}
    </div>
  );
}
