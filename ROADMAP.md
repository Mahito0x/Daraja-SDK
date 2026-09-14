# Roadmap

This tracks what `@lumierelabs/daraja` actually wraps today versus what
Safaricom's Daraja platform exposes but the SDK doesn't yet, plus a few
tooling ideas under consideration.

> This roadmap reflects the current status of the codebase and the
> [Daraja API reference](https://daraja.lumierelabs.xyz/docs/daraja). Priorities
> may shift—feel free to open an issue to propose changes or claim an item.

## Legend

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| ✅     | Shipped, typed, and tested against sandbox |
| 🔜     | Next up                                    |
| 📋     | Planned, not started                       |
| 🧊     | Blocked or deprioritized (see notes)       |
| ❌     | Not planned                                |

## Endpoint coverage

### Shipped

| Endpoint                                           | Status |
| -------------------------------------------------- | ------ |
| Authorization (OAuth 2.0 token lifecycle)          | ✅     |
| M-Pesa Express — STK Push + Query                  | ✅     |
| C2B — Register URL + Simulate                      | ✅     |
| Dynamic QR                                         | ✅     |
| B2C Account Top Up                                 | ✅     |
| B2B Hakikisha                                      | ✅     |
| Dynamic Offers (Mobile Data Bundles purchase flow) | ✅     |
| SWAP (SIM swap check)                              | ✅     |
| IMSI                                               | ✅     |
| Mobile Number Validation                           | ✅     |

### Next up

These are the highest-demand gaps, the money-movement and reconciliation
APIs most integrations eventually need.

| Endpoint                                                               | Status | Notes                                                                   |
| ---------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| Generic B2C (`BusinessPayment` / `SalaryPayment` / `PromotionPayment`) | 🔜     | Distinct from B2C Account Top Up, which only covers `BusinessPayToBulk` |
| Transaction Status                                                     | 🔜     | Needed as a fallback when a callback never lands                        |
| Reversals                                                              | 🔜     | Cannot be used on B2C per Safaricom's own docs, C2B only                |
| Account Balance                                                        | 📋     |                                                                         |

### Planned

The rest of what's documented in the [API reference](https://daraja.lumierelabs.xyz/docs/daraja)
but not yet wrapped.

| Endpoint                                                                     | Status | Notes                                                                           |
| ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Business Pay Bill                                                            | 📋     | Shares an endpoint with Business Buy Goods, `CommandID` differs                 |
| Business Buy Goods                                                           | 📋     |                                                                                 |
| Business To Pochi                                                            | 📋     |                                                                                 |
| Pull Transactions                                                            | 📋     | Reconciliation tool for missed C2B callbacks                                    |
| Tax Remittance                                                               | 📋     | Requires a KRA-issued PRN, out of the SDK's control                             |
| B2B Express Checkout (UssdPush to Till)                                      | 📋     |                                                                                 |
| Bill Manager                                                                 | 📋     | Onboarding/invoicing/reconciliation flow, larger surface than a single endpoint |
| Lipa na Bonga                                                                | 📋     |                                                                                 |
| M-Pesa Ratiba (standing orders)                                              | 📋     | Commercial API, requires a signed agreement to test in production               |
| Age on Network                                                               | 🧊     | Commercial API; low signal on demand so far                                     |
| Mobile Data Bundles (fetch/status, beyond the purchase flow already shipped) | 📋     |                                                                                 |
| IoT SIM Management                                                           | 🧊     | Niche audience; revisit if there's real demand                                  |

### Not planned

| Item                                      | Why                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| Non-TypeScript clients (Python, Go, etc.) | Out of scope. This project is exclusively a TypeScript SDK.              |
| A hosted proxy/backend service            | This is a client library, not infrastructure you'd depend on us running. |

## Documentation

| Item                                         | Status | Notes                                                                                 |
| -------------------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Full Daraja API reference (`content/daraja`) | ✅     | All 27 pages Safaricom documents, defects marked in place                             |
| Per-endpoint sandbox verification            | 🔜     | Ongoing. Only endpoints explicitly verified against the sandbox are marked as tested. |
| SDK guides for each newly shipped endpoint   | 📋     | Tracks the endpoint table above                                                       |

## Under consideration

Ideas under consideration (open an issue to discuss or request):

- A small CLI for generating a `SecurityCredential` from a plaintext
  initiator password and a certificate, without writing throwaway script
  code for it
- A local callback simulator for testing `ResultURL`/`CallBackURL` handlers
  without exposing a real endpoint via a tunneling tool
- Thin framework adapters (Express/Fastify middleware) for common webhook
  patterns, built on top of the existing callback-parsing utilities

## How to help

- Pick anything marked 🔜 or 📋 and open an issue before starting to avoid duplicate effort.
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, PR guidelines, and rules for editing `content/daraja`.
- If sandbox testing contradicts the reference docs, feel free to open a documentation PR to correct it.
