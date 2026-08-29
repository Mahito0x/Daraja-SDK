<div align="center">

# @daraja/sdk

**A fully typed TypeScript client for Safaricom's Daraja (M-Pesa) API.**

Auto-caching OAuth tokens. Timezone-correct STK passwords, generated for you. Safaricom's own field misspellings, normalized behind a clean interface not papered over.

[![npm package](https://shieldcn.dev/npm/react.svg?variant=branded&size=xs&split=true)](https://www.npmjs.com/package/react)
[![downloads](https://shieldcn.dev/npm/dm/react.svg?variant=branded&size=xs&split=true)](https://www.npmjs.com/package/react)
[![license](https://shieldcn.dev/npm/license/react.svg?variant=branded&size=xs&split=true)](./LICENSE)
[![types](https://shieldcn.dev/npm/types/react.svg?size=xs&theme=blue&split=true&logo=typescript)](https://www.typescriptlang.org/)
[![dependencies](https://shieldcn.dev/badge/Dependencies-0%20deps.svg?variant=branded&size=xs&split=true&logo=lu%3ABox)](./package.json)
[![stars](https://shieldcn.dev/github/Mahito0x/Daraja-SDK/stars.svg?&size=xs&split=true&logo=lu%3AStar)](https://github.com/Mahito0x/Daraja-SDK)

[Documentation](http://darajasdk.vercel.app/docs) · [Quickstart](http://darajasdk.vercel.app/docs/getting-started/quickstart) · [Report a Bug](https://github.com/Mahito0x/Daraja-SDK/issues) · [Request a Feature](https://github.com/Mahito0x/Daraja-SDK/issues)

<br />

</div>

<br />

```ts
import { Daraja } from "@daraja/sdk";

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  environment: "sandbox",
});

const { CheckoutRequestID } = await daraja.stkPush({
  businessShortCode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254708374149",
  partyB: "174379",
  phoneNumber: "254708374149",
  callBackURL: "https://example.com/callbacks/stk",
  accountReference: "INV-1042",
});
```

<br />

## Table of Contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Installation](#installation)
- [Quickstart](#quickstart)
- [Endpoints](#endpoints)
- [Framework Integrations](#framework-integrations)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

<br />

## Why this exists

Daraja's own documentation is functional but thin. Field names change case between endpoints `OriginatorCoversationID` and `RecieverIdentifierType` are real, misspelled fields Safaricom ships in production, not typos in this SDK. The STK Push password has to be hand-built as `Base64(ShortCode + Passkey + Timestamp)` in the exact East Africa timezone, regardless of where your server runs. And half the integration "gotchas" IP whitelisting vs. local tunnels, callback URLs silently rejected for containing the word `mpesa`, sandbox instability with no status page are only discoverable by hitting them in production.

`@daraja/sdk` bakes those lessons in, so you don't have to relearn them from a failed sandbox call at 11pm.

<br />

## Features

|                               |                                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fully typed payloads**      | Every request and response shape typed end to end, including the fields Safaricom itself misspells on the wire.                                          |
| **Automatic token lifecycle** | OAuth 2.0 tokens fetched, cached in memory, and refreshed automatically with a 60-second safety buffer. You never call `/oauth/v1/generate` yourself.    |
| **Daraja quirks, normalized** | Timezone-correct STK passwords, callback URL validation before a request ever leaves your server, documented sandbox instability instead of a black box. |
| **One error shape**           | Every failure client-side validation or a Daraja-side rejection throws a single `DarajaError` class. One `catch`, everywhere.                            |
| **Multi-framework native**    | Built on native `fetch` and `AbortController`, no runtime-specific glue. First-class integration guides for Next.js, Astro, Remix, and Express.          |
| **Zero heavy dependencies**   | No axios, no node-fetch, no isomorphic-fetch. Ships as both ESM and CJS with a single `.d.ts`.                                                           |

<br />

## Installation

```bash
pnpm add @daraja/sdk
```

**Requirements:** Node.js 18.17+ (uses the global `fetch`, `AbortController`, and `btoa`/`Buffer` APIs), TypeScript 5+ recommended.

<br />

## Quickstart

```ts
import { Daraja } from "@daraja/sdk";

export const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  environment: "sandbox", // 'production' when you go live
});

const push = await daraja.stkPush({
  businessShortCode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254708374149", // customer's phone (debited)
  partyB: "174379", // your paybill (credited)
  phoneNumber: "254708374149", // where the STK prompt is sent
  callBackURL: "https://example.com/callbacks/stk",
  accountReference: "INV-1042",
});

console.log(push.CheckoutRequestID);
```

`Daraja(config)` validates your credentials synchronously malformed or placeholder keys throw immediately, before any request touches the network.

Full walkthrough, including callback handling per framework: **[Quickstart Guide →](http://darajasdk.vercel.app/docs/getting-started/quickstart)**

<br />

## Endpoints

| Endpoint                      | Method(s)                                                    |      Status       |
| ----------------------------- | ------------------------------------------------------------ | :---------------: |
| **Authentication**            | `getAccessToken()` auto-caching, handled internally          |    ✅ Working     |
| **M-Pesa Express (STK Push)** | `stkPush()`, `stkPushQuery()`                                |    ✅ Working     |
| **C2B**                       | `c2b.registerUrl()`, `c2b.simulate()`                        | ⚠️ Upstream Issue |
| **B2C Account Top Up**        | `b2cTopUp.topUp()`                                           |    ✅ Working     |
| **B2B Hakikisha**             | `b2bHakikisha.query()`                                       |    ✅ Working     |
| **Dynamic QR**                | `dynamicQR.generate()`                                       | ⚠️ Upstream Issue |
| **Mobile Data Bundles**       | `dynamicOffers.fetchOffers()`, `purchase()`, `checkStatus()` | ⚠️ Upstream Issue |
| **SIM Swap**                  | `swap.check()`                                               |    ✅ Working     |
| **IMSI**                      | `imsi.checkV1()`, `imsi.checkV2()`                           |    ✅ Working     |
| **Mobile Number Validation**  | `mobileNumberValidation.validate()`                          | ⚠️ Upstream Issue |

**⚠️ Upstream Issue** means the endpoint is implemented correctly against Safaricom's published spec, but Daraja's own sandbox for that endpoint is inconsistent (thin/rotating test data) that's a Safaricom-side limitation, not a bug in this SDK. See the [endpoint's own docs](http://darajasdk.vercel.app/docs/endpoints/dynamic-offers) for specifics.

> Looking for **Account Balance**, **Transaction Status**, **Reversal**, or a generic **B2C/B2B Payment Request**? They aren't implemented yet see [Roadmap](#roadmap) for the honest list instead of documentation for endpoints that would 404.

Full request/response types, validation rules, and Safaricom-specific quirks for every endpoint: **[Endpoint Documentation →](http://darajasdk.vercel.app/docs/endpoints)**

<br />

## Framework Integrations

First-class, copy-pasteable guides for wiring `@daraja/sdk` (including webhook/callback handlers) into:

<table>
<tr>
<td align="center" width="140"><a href="http://darajasdk.vercel.app/docs/integrations/nextjs"><b>Next.js</b><br />App Router</a></td>
<td align="center" width="140"><a href="http://darajasdk.vercel.app/docs/integrations/astro"><b>Astro</b><br />SSR</a></td>
<td align="center" width="140"><a href="http://darajasdk.vercel.app/docs/integrations/remix"><b>Remix</b><br />React Router v7</a></td>
<td align="center" width="140"><a href="http://darajasdk.vercel.app/docs/integrations/express"><b>Express</b><br />Node.js</a></td>
</tr>
</table>

Since the SDK is built entirely on native `fetch`, it isn't limited to these four they're just the ones with dedicated written guides today.

<br />

## Error Handling

Every failure a validation error caught before a request is sent, a rejected response from Daraja, a network timeout is thrown as a single `DarajaError`:

```ts
import { Daraja, DarajaError } from "@daraja/sdk";

try {
  await daraja.stkPush({/* ... */});
} catch (error) {
  if (error instanceof DarajaError) {
    console.error(error.errorCode, error.message);
    if (error.suggestion) console.error("Suggestion:", error.suggestion);
  } else {
    throw error;
  }
}
```

```ts
class DarajaError extends Error {
  readonly statusCode: number; // HTTP status, or 0 for client-side validation errors
  readonly errorCode: string; // e.g. "INVALID_STK_REQUEST"
  readonly endpoint?: string;
  readonly suggestion?: string; // a human-readable fix, when the SDK knows one
  readonly rawResponse?: unknown; // Daraja's raw JSON body
}
```

`statusCode === 0` means the SDK caught a bad request shape before it ever left your machine. `statusCode > 0` means Daraja itself rejected the call. Full error code reference: **[Error Handling →](http://darajasdk.vercel.app/docs/core-concepts/error-handling)**

<br />

## Configuration

```ts
interface DarajaConfig {
  consumerKey: string;
  consumerSecret: string;
  environment?: "sandbox" | "production"; // default: 'sandbox'
  timeout?: number; // default: 10000 (ms)
}
```

| Option           | Type                        | Default     | Description                                                     |
| ---------------- | --------------------------- | ----------- | --------------------------------------------------------------- |
| `consumerKey`    | `string`                    | —           | **Required.** Exactly 48 alphanumeric characters.               |
| `consumerSecret` | `string`                    | —           | **Required.** Exactly 64 alphanumeric characters.               |
| `environment`    | `'sandbox' \| 'production'` | `'sandbox'` | `'production'` requires HTTPS on every callback URL.            |
| `timeout`        | `number`                    | `10000`     | Milliseconds before a request is aborted via `AbortController`. |

Full validation pipeline (placeholder detection, key/secret swap detection, sanitization): **[Configuration →](http://darajasdk.vercel.app/docs/getting-started/configuration)**

<br />

## Roadmap

Not implemented in the current version tracked honestly rather than left undocumented:

- [ ] General **B2C Payment Request** (disbursing to an arbitrary customer MSISDN distinct from B2C Account Top Up, which moves funds between your own accounts)
- [ ] General **B2B Payment Request** (distinct from B2B Hakikisha, which is a name/tariff lookup only)
- [ ] **Account Balance** query
- [ ] **Transaction Status** query
- [ ] **Reversal** API

Contributions closing any of these are very welcome see [Contributing](#contributing).

<br />

## Documentation

Full documentation every endpoint's exact TypeScript interfaces, framework integration guides, and a dedicated page on Safaricom's own API quirks lives at:

[![Documentation](https://shieldcn.dev/badge/Read%20Docs-darajasdk.vercel.app/docs-00A651.svg?variant=outline&split=true&logo=lu%3ABookOpenText)](https://darajasdk.vercel.app/docs)

<br />

## Contributing

Contributions are welcome, especially toward the items in [Roadmap](#roadmap). Before opening a PR:

1. Fork the repo and create a branch off `main`
2. Run the existing test suite new endpoints should ship with tests, following the pattern in `packages/sdk/src/endpoints/`
3. Match the existing validation-and-error-code style (see any existing endpoint client for the pattern request validation throws a scoped `INVALID_*_REQUEST` error code before any network call)
4. Open a PR describing what changed and why

For bugs or feature requests, please [open an issue](https://github.com/Mahito0x/Daraja-SDK/issues) rather than a PR first, so the approach can be discussed.

<p align="center">
  <a href="https://github.com/Mahito0x/Daraja-SDK/graphs/contributors"><img alt="Contributors" src="https://shieldcn.dev/contributors/Mahito0x/Daraja-SDK.svg?preset=transparent&amp;theme=blue&amp;size=40&amp;bots=true&amp;titleAlign=center&amp;mode=dark&amp;border=false" /></a>
</p>

<br />

## License

Distributed under the [MIT License](./LICENSE). Copyright © 2026 [Mahito](https://github.com/Mahito0x).

<br />

---

<div align="center">
  <sub><b>Disclaimer:</b> This SDK is an independent open-source project and is not affiliated with, endorsed by, or officially connected to <a href="https://safaricom.co.ke/">Safaricom PLC</a>. "M-Pesa" and "Daraja" are registered trademarks of Safaricom PLC.</sub>
</div>
