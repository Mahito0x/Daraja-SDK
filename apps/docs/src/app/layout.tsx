import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://daraja.lumierelabs.xyz"
).replace(/\/+$/, "");

const siteName = "Daraja SDK";
const siteDescription =
  "A type-safe, edge-ready TypeScript SDK for Safaricom's Daraja API. Build M-PESA integrations with simpler OAuth handling, reliable API methods, and webhook utilities.";

const githubUrl = "https://github.com/Mahito0x/Daraja-SDK";

const npmUrl = "https://www.npmjs.com/package/@lumierelabs/daraja";

const ogImage = `${siteUrl}/og-image.png`;

const organizationId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;
const softwareId = `${siteUrl}/#software`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "Daraja SDK | TypeScript SDK for M-PESA",
    template: "%s | Daraja SDK",
  },

  description: siteDescription,

  applicationName: siteName,
  category: "technology",
  classification: "Developer Tools",

  generator: "Next.js",
  referrer: "strict-origin-when-cross-origin",

  authors: [
    {
      name: "Lumière Labs",
      url: "https://lumierelabs.xyz",
    },
  ],

  creator: "Lumière Labs",
  publisher: "Lumière Labs",

  keywords: [
    "Daraja SDK",
    "Safaricom Daraja API",
    "M-PESA API",
    "M-PESA TypeScript SDK",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Bun",
    "Deno",
    "Cloudflare Workers",
    "Edge Runtime",
    "STK Push",
    "C2B",
    "B2C",
    "B2B",
    "M-PESA integration",
    "Safaricom API",
    "OAuth",
    "Webhooks",
    "Payment integration",
  ],

  verification: {
    google: "2xFtCff32fpOw9mx676W36N5-EBw3wBwGfpPBLp2tUs",
  },

  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },

  alternates: {
    canonical: "/",
    languages: {
      "en-KE": "/",
      "x-default": "/",
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },

  manifest: "/site.webmanifest",

  appleWebApp: {
    capable: true,
    title: "Daraja SDK",
    statusBarStyle: "black-translucent",
  },

  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    locale: "en_KE",
    title: "Daraja SDK | TypeScript SDK for M-PESA",
    description:
      "Build M-PESA integrations with a type-safe, edge-ready TypeScript SDK for Safaricom's Daraja API.",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Daraja SDK by Lumière Labs",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    site: "@LumiereLabsHQ",
    creator: "@LumiereLabsHQ",

    title: "Daraja SDK | TypeScript SDK for M-PESA",

    description:
      "A type-safe TypeScript SDK for Safaricom's Daraja API. Build M-PESA integrations with less friction.",

    images: [
      {
        url: ogImage,
        alt: "Daraja SDK by Lumière Labs",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",

  colorScheme: "dark light",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#000000",
    },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: "Lumière Labs",
      url: "https://lumierelabs.xyz",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logomark.svg`,
      },
      sameAs: ["https://github.com/Lumiere-HQ", "https://x.com/LumiereLabsHQ"],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      inLanguage: "en-KE",
      publisher: {
        "@id": organizationId,
      },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": softwareId,
      name: "@lumierelabs/daraja",
      alternateName: "Daraja SDK",
      description:
        "A fully typed TypeScript client for Safaricom's Daraja API, with OAuth token caching, M-PESA API integrations, and webhook utilities.",
      url: siteUrl,
      codeRepository: githubUrl,
      programmingLanguage: ["TypeScript", "JavaScript"],
      runtimePlatform: [
        "Node.js",
        "Bun",
        "Deno",
        "Cloudflare Workers",
        "Edge Runtime",
      ],
      license: "https://opensource.org/licenses/MIT",
      downloadUrl: npmUrl,
      author: {
        "@id": organizationId,
      },
      publisher: {
        "@id": organizationId,
      },
      isPartOf: {
        "@id": websiteId,
      },
    },
  ],
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`font-sans ${geist.variable}`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-screen flex-col bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />

        <Script
          src="https://analytics.lumierelabs.xyz/bootstrap"
          data-website-id="8332e0a5-a611-4d7a-96d5-207fec7836ee"
          data-host-url="https://analytics.lumierelabs.xyz"
          data-domains="daraja.lumierelabs.xyz"
          data-auto-track="true"
          data-performance="true"
          data-exclude-search="false"
          data-exclude-hash="true"
          data-do-not-track="true" // We value your privacy darling!!!!!!!!!
          strategy="afterInteractive"
        />

        <RootProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </RootProvider>
      </body>
    </html>
  );
}
