import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  metadataBase: new URL("https://daraja.lumierelabs.xyz"),
  title: {
    default: "Free M-PESA Statement Analyzer: Private & Instant | Safi",
    template: "%s | Safi Analytics",
  },
  description:
    "Free M-PESA statement analyzer for Kenya. Upload your Safaricom PDF, unlock with your PIN, and see spending, fees, & top recipients. 100% private.",
  applicationName: "Safi Analytics",
  category: "finance",
  keywords: [
    // Core intent
    "M-PESA statement analyzer",
    "M-PESA statement analyser",
    "free M-PESA statement analyzer",
    "analyze M-PESA statement",
    "M-PESA statement analysis tool",
    "M-PESA statement reader",
    "M-PESA PDF reader",
    "M-PESA PDF parser",
    "Safaricom statement analyzer",
    "M-PESA statement Kenya",
    // Problems people search for
    "open M-PESA statement PDF",
    "unlock M-PESA statement PDF",
    "M-PESA statement password",
    "M-PESA statement PIN",
    "how to read M-PESA statement",
    "understand M-PESA statement",
    "M-PESA full statement summary",
    // Features
    "M-PESA expense tracker",
    "M-PESA spending tracker",
    "M-PESA spending analysis",
    "M-PESA transaction charges tracker",
    "M-PESA fees calculator",
    "M-PESA cash flow",
    "M-PESA paybill and till spending",
    "who do I send money to on M-PESA",
    "M-PESA money tracker",
    "M-PESA budget tool",
    "M-PESA statement charts",
    // Trust and positioning
    "private M-PESA statement analyzer",
    "M-PESA statement analyzer offline",
    "M-PESA statement analyzer no upload",
    "Kenyan personal finance tool",
    // Brand
    "Safi Analytics",
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
  alternates: {
    canonical: "/safi",
    languages: {
      "en-KE": "/safi",
      "x-default": "/safi",
    },
  },
  openGraph: {
    title: "Free M-PESA Statement Analyzer: Private & Instant | Safi",
    description:
      "Upload your M-PESA PDF and see where your money goes: spending, fees, top recipients and trends. Runs in your browser, nothing is uploaded.",
    url: "https://daraja.lumierelabs.xyz/safi",
    siteName: "Safi Analytics",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Safi Analytics: free private M-PESA statement analyzer dashboard",
      },
    ],
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free M-PESA Statement Analyzer: Private & Instant | Safi",
    description:
      "Know where your M-PESA money goes. Free, private, runs in your browser.",
    images: ["/og-image.png"],
    creator: "@_M4hito",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

/** Structured data: tells Google this is a free finance web app. */
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Safi Analytics",
    alternateName: ["Safi", "Safi M-PESA Statement Analyzer"],
    url: "https://daraja.lumierelabs.xyz/safi",
    description:
      "Free M-PESA statement analyzer for Kenya. Upload your Safaricom PDF, unlock with your PIN, and see spending, fees, & top recipients. 100% private.",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires a modern browser with JavaScript enabled",
    inLanguage: "en-KE",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
    },
    featureList: [
      "Reads M-PESA statement PDFs from Safaricom",
      "Unlocks password-protected statements with your PIN, on your device",
      "Money in versus money out, with net cash flow",
      "Spending breakdown by send money, paybill, till, airtime and withdrawals",
      "Transaction fee and charges tracking",
      "Top people, shops, paybills and online merchants you pay",
      "Balance, cash flow and spending habit charts",
      "Searchable transaction ledger with date range filter",
      "Runs entirely in your browser, nothing is uploaded",
    ],
    screenshot: "https://daraja.lumierelabs.xyz/og-image.png",
    publisher: {
      "@type": "Organization",
      name: "Lumière Labs",
      url: "https://lumierelabs.xyz",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Daraja SDK",
        item: "https://daraja.lumierelabs.xyz",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Safi Analytics",
        item: "https://daraja.lumierelabs.xyz/safi",
      },
    ],
  },
];

export default function SafiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <script
        type="application/ld+json"
        // "<" is escaped so the JSON can never close the script tag early.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      {children}
    </div>
  );
}
