<div align="center">

# Daraja CLI

**Scaffold production-ready M-Pesa integrations with `@lumierelabs/daraja`.**

Choose your framework, M-Pesa services, environment, and package manager — the CLI generates the project structure for you.

<br />

[![npm](https://shieldcn.dev/npm/@lumierelabs/cli.svg?variant=branded&size=xs&split=true)](https://www.npmjs.com/)
[![license](https://shieldcn.dev/npm/license/@lumierelabs/cli.svg?variant=branded&size=xs&split=true)](./LICENSE)
[![ci](https://shieldcn.dev/github/Mahito0x/Daraja-SDK/ci.svg?variant=outline&size=xs&split=true)](https://github.com/Mahito0x/Daraja-SDK/actions)

[Documentation](https://daraja.lumierelabs.xyz) · [GitHub](https://github.com/Mahito0x/Daraja-SDK) · [Report a Bug](https://github.com/Mahito0x/Daraja-SDK/issues)

</div>

## What it does

The Daraja CLI creates a ready-to-run M-Pesa project from a small interactive setup.

It handles:

- Next.js App Router
- Express + TypeScript
- Sandbox or production configuration
- STK Push
- STK Push Query
- C2B
- B2C Account Top Up
- pnpm, npm, yarn, and Bun
- `.env.example` generation
- Only the selected M-Pesa routes

## Usage

Run the CLI with:

```bash
npx @lumierelabs/daraja-cli
```

Or with your preferred package runner:

```bash
pnpm dlx @lumierelabs/daraja-cli
```

```text
DARAJA SDK

⚡ The Type-Safe M-Pesa Integration Boilerplate Generator

◆ What is your project name?
│ my-mpesa-app

◆ Which Safaricom Daraja environment will you target?
│ Sandbox

◆ Select your framework / tech stack:
│ Next.js (App Router + Route Handlers)

◆ Select M-Pesa services to auto-wire:
│ ◉ Express STK Push
│ ◉ STK Push status query
│ ◯ C2B
│ ◯ B2C Account Top Up

◆ Which package manager do you use?
│ pnpm

✔ Successfully bootstrapped my-mpesa-app!
```

Then:

```bash
cd my-mpesa-app
pnpm install
pnpm dev
```

## Supported services

| Service            | CLI scaffolding |
| ------------------ | :-------------: |
| STK Push           |        ✓        |
| STK Push Query     |        ✓        |
| C2B                |        ✓        |
| B2C Account Top Up |        ✓        |

## Supported frameworks

| Framework               | Status |
| ----------------------- | :----: |
| Next.js App Router      |   ✓    |
| Express.js + TypeScript |   ✓    |

## Requirements

- Node.js 20.19+
- npm, pnpm, yarn, or Bun

## How it works

The CLI copies the selected framework template, adds only the M-Pesa services you selected, patches the project name, and creates the appropriate `.env.example`.

The generated application uses [`@lumierelabs/daraja`](https://www.npmjs.com/package/@lumierelabs/daraja) for the actual Daraja API integration.

## Contributing

Contributions and new templates are welcome.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT © 2026 Mahito

---

<div align="center">

**Built for developers building with Safaricom Daraja.**

</div>
