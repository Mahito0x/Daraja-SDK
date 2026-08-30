import type { Metadata, Viewport } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Geist } from "next/font/google";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://darajasdk.vercel.app";
const githubUrl = "https://github.com/Mahito0x/Daraja-SDK";
const npmUrl = "https://www.npmjs.com/package/@lumierelabs/daraja";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Daraja SDK — Type-safe M-Pesa",
    template: "%s | Daraja",
  },
  description:
    "Daraja SDK gives TypeScript developers a type-safe, edge-ready interface for Safaricom M-Pesa APIs, token lifecycle management, and webhook parsing.",
  applicationName: "Daraja SDK",
  authors: [{ name: "Mahito", url: "https://github.com/Mahito0x" }],
  keywords: [
    "Daraja SDK",
    "M-Pesa",
    "Safaricom API",
    "TypeScript",
    "Next.js",
    "Webhooks",
    "Payments",
  ],
  verification: {
    google: "2xFtCff32fpOw9mx676W36N5-EBw3wBwGfpPBLp2tUs",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Daraja SDK",
    title: "Daraja SDK — Type-safe M-Pesa for TypeScript",
    description:
      "Type-safe SDK for Safaricom M-Pesa APIs, token lifecycle handling, and reliable webhook parsing.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Daraja SDK — Type-safe M-Pesa for TypeScript",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daraja SDK — Type-safe M-Pesa for TypeScript",
    description:
      "Type-safe SDK for Safaricom M-Pesa APIs, OAuth lifecycle management, and webhook parsing.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: "Lumière Labs",
      url: "https://lumierelabs.xyz",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logomark.svg`,
      },
      sameAs: [githubUrl, "https://x.com/_M4hito"],
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      url: baseUrl,
      name: "Daraja SDK",
      description:
        "Documentation for Daraja SDK, a type-safe TypeScript client for Safaricom's M-Pesa API.",
      inLanguage: "en-US",
      publisher: { "@id": `${baseUrl}/#organization` },
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${baseUrl}/#software`,
      name: "@lumierelabs/daraja",
      description:
        "A fully typed TypeScript client for Safaricom's Daraja (M-Pesa) API — auto-caching OAuth tokens, timezone-correct STK passwords, and normalized Daraja field quirks.",
      codeRepository: githubUrl,
      programmingLanguage: "TypeScript",
      runtimePlatform: "Node.js",
      license: "https://opensource.org/licenses/MIT",
      downloadUrl: npmUrl,
      author: { "@id": `${baseUrl}/#organization` },
      isPartOf: { "@id": `${baseUrl}/#website` },
    },
  ],
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`font-sans ${geist.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-background text-foreground antialiased">
        <script
          type="application/ld+json"
          // skipcq: JS-0440 - Safe JSON-LD structured data injection
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
