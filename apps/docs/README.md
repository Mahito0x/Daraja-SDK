<div align="center">

# Daraja SDK Docs

**The documentation site for `@lumierelabs/daraja`, with guides, endpoint references, and a live API playground for Safaricom's Daraja (M-Pesa) API.**

Built with Next.js and Fumadocs. Every endpoint documented, every Safaricom quirk explained.

[![next](https://shieldcn.dev/badge/Next.js-App%20Router-neutral.svg?variant=branded&size=xs&split=true&logo=lu%3ABox)](https://nextjs.org)
[![fumadocs](https://shieldcn.dev/badge/Fumadocs-MDX%20%2B%20Scalar-neutral.svg?variant=branded&size=xs&split=true&logo=lu%3ABookOpenText)](https://fumadocs.dev)
[![typescript](https://shieldcn.dev/badge/TypeScript-5-blue.svg?variant=branded&size=xs&split=true&logo=typescript)](https://www.typescriptlang.org/)
[![ci](https://shieldcn.dev/github/Mahito0x/Daraja-SDK/ci.svg?variant=outline&size=xs&split=true)](https://github.com/Mahito0x/Daraja-SDK/actions)

[Live Site](https://daraja.lumierelabs.xyz/docs) · [SDK on npm](https://www.npmjs.com/package/@lumierelabs/daraja) · [Report an Issue](https://github.com/Mahito0x/Daraja-SDK/issues) · [Back to Monorepo](../../README.md)

<br />

</div>

<br />

## Table of Contents

- [What's inside](#whats-inside)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Writing docs](#writing-docs)
- [API Playground](#api-playground)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Licensing](#licensing)

<br />

## What's inside

| Section            | Path                 | Description                                                       |
| ------------------ | -------------------- | ----------------------------------------------------------------- |
| **SDK Docs**       | `content/sdk`        | Getting started, concepts, endpoint guides, and integrations      |
| **Daraja API**     | `content/daraja`     | Safaricom Daraja endpoint reference and integration notes         |
| **API Playground** | `src/app/playground` | Interactive API reference rendered by Scalar from the hosted spec |

<br />

## Tech stack

- **[Next.js](https://nextjs.org)** (App Router)
- **[Fumadocs](https://fumadocs.dev)** for MDX docs, search, and navigation
- **[Scalar OpenAPI](https://scalar.com/products/api-references/integrations/react)** for the API playground
- **TypeScript**, **Tailwind CSS**
- **pnpm workspaces** and **Turborepo**

<br />

## Getting started

From the **monorepo root**:

```bash
git clone https://github.com/Mahito0x/Daraja-SDK.git
cd Daraja-SDK
pnpm install
```

Start the docs site:

```bash
pnpm --filter @lumierelabs/daraja-docs dev
```

Alternatively, run `pnpm docs:dev` from the monorepo root.

Open [http://localhost:3000](http://localhost:3000).

**Requirements:** Node.js 22.13+ and pnpm 11.22.0 (the versions declared by the monorepo).

<br />

## Project structure

```text
apps/docs
├── content
│   ├── daraja            # Daraja API reference (MDX)
│   └── sdk               # SDK guides and integration docs (MDX)
├── public
│   └── site.webmanifest
├── src
│   ├── app
│   │   ├── (home)        # Marketing home page
│   │   ├── api           # Chat, feedback, and search routes
│   │   ├── docs          # Fumadocs documentation routes
│   │   └── playground    # Scalar API reference
│   ├── components        # Shared UI and Scalar reference
│   └── lib               # Docs source, layout, and helpers
└── package.json
```

<br />

## Writing docs

Pages are plain MDX with frontmatter:

```mdx
---
title: STK Push
description: Prompt a customer to pay from their phone.
---

Your content here.
```

Order and grouping are controlled by `meta.json` files in each folder. Built-in components include `Callout`, `Cards`, and `Card`.

**Conventions**

- Be honest about Safaricom's behavior. If something is an upstream issue, say so instead of hiding it.
- Keep Safaricom's real (misspelled) field names in wire-format examples, such as `OriginatorCoversationID` and `RecieverIdentifierType`.
- Never put real credentials, passkeys, or `SecurityCredential` values in examples.
- Use placeholder values like `254708374149` (sandbox test number) and `174379` (sandbox shortcode).

<br />

## API Playground

The `/playground` route renders the Daraja OpenAPI specification with Scalar.

- **Source spec:** [Scalar Registry](https://registry.scalar.com/@lumiere-labs/apis/daraja-api@3.0.0), configured in `src/components/ScalarReference.tsx`.
- **Updating the spec:** publish the updated specification to the Scalar Registry; there is no local OpenAPI file or generation script in this app.

The playground sends requests from the browser, so Safaricom may block them through CORS. Use Sandbox credentials only. For production testing, run the generated cURL from your terminal.

<br />

## Scripts

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | Start the dev server (from `apps/docs`)          |
| `pnpm build`       | Build the docs app (from `apps/docs`)            |
| `pnpm start`       | Serve the production build (from `apps/docs`)    |
| `pnpm lint`        | Lint the docs app (from `apps/docs`)             |
| `pnpm types:check` | Generate route types and type-check the docs app |

From the monorepo root, use `pnpm docs:dev` and `pnpm docs:build`, or target a docs-app script with `pnpm --filter @lumierelabs/daraja-docs <script>`.

<br />

## Deployment

Deployed on [Vercel](https://vercel.com).

| Setting          | Value          |
| ---------------- | -------------- |
| Root directory   | `apps/docs`    |
| Framework preset | Next.js        |
| Install command  | `pnpm install` |
| Build command    | `pnpm build`   |

The docs app can build without optional integrations configured. Set these variables in Vercel only for the corresponding features:

| Variable(s)                                                                                | Purpose                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                                                                      | Public site URL used for canonical metadata, sitemap, and robots output. Defaults to `https://daraja.lumierelabs.xyz`.                                                            |
| `GOOGLE_GENERATIVE_AI_API_KEY` or `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY` | Provider keys for the AI documentation assistant. Configure at least one provider to get model-generated answers; without one, the assistant can fall back to search.             |
| `AI_MODELS`, `AI_SYSTEM_PROMPT`                                                            | Optional AI assistant model order and system prompt.                                                                                                                              |
| `GITHUB_TOKEN`                                                                             | Enables GitHub GraphQL data such as sponsors and provides authenticated GitHub API access.                                                                                        |
| `GITHUB_OWNER`, `GITHUB_REPO`                                                              | GitHub account and repository used by the home-page contributor and sponsor sections. Set these to the intended project; the current code defaults to `Fuma-nama` and `fumadocs`. |
| `DISCORD_WEBHOOK_URL`                                                                      | Optional destination for documentation feedback. Without it, feedback is logged by the server.                                                                                    |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_HOST`                            | Optional PostHog analytics configuration; configure both to enable analytics.                                                                                                     |

<br />

## Contributing

Docs fixes are very welcome: typos, unclear explanations, missing Safaricom gotchas, and new integration guides.

1. Fork the repo and branch off `main`
2. Edit or add MDX under `content/`
3. Run `pnpm dev` and check the page renders correctly
4. Open a PR describing what changed and why

For SDK code contributions, see the [root README](../../README.md#contributing).

<br />

## Licensing

This app has mixed licensing:

| Path                                          | License                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Everything in `apps/docs` unless listed below | [MIT](../../LICENSE)                                                                    |
| Daraja OpenAPI specification                  | All rights reserved by Lumière Labs, see the [license](https://lumierelabs.xyz/license) |

Copyright © 2026 [Mahito](https://github.com/Mahito0x) and [Lumière Labs](https://lumierelabs.xyz).

<br />

---

<div align="center">
  <sub><b>Disclaimer:</b> This documentation is an independent project and is not affiliated with, endorsed by, or officially connected to <a href="https://safaricom.co.ke/">Safaricom PLC</a>. "M-Pesa" and "Daraja" are trademarks of their respective owners. The <a href="https://developer.safaricom.co.ke/apis">official Daraja portal</a> remains the source of truth.</sub>
</div>
