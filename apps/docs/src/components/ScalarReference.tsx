"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export function ScalarReference() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "https://registry.scalar.com/@lumiere-labs/apis/daraja-api@3.0.0",
        proxyUrl: "https://proxy.scalar.com",
        withDefaultFonts: false,
        showDeveloperTools: "never",
        theme: "none",
        layout: "modern",
        customCss:
          'a[href^="https://scalar.com/"][rel="noopener"][target="_blank"] { display: none !important; }',

        favicon: "/favicon.ico",

        metaData: {
          title: "Daraja API Reference",
          description: "Explore and test the Safaricom Daraja API.",
        },

        agent: {
          disabled: true,
        },
        // forceDarkModeState: "dark",
        hideDarkModeToggle: true,
        showSidebar: true,
      }}
    />
  );
}
