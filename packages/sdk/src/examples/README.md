# Examples

Runnable, copy-pasteable reference code for each Daraja endpoint this SDK supports.

Unlike `test-*.ts` at the package root (quick manual smoke tests during
development), these are meant to be read — each one is a minimal, standalone
demonstration of a single feature, safe to copy into your own project.

## Running an example

1. Copy `.env.example` → `.env` (or reuse the one at the package root) and set:
   ```
   CONSUMER_KEY=your_sandbox_consumer_key
   CONSUMER_SECRET=your_sandbox_consumer_secret
   ```
2. Run any example directly with `tsx`:
   ```bash
   npx tsx examples/01-authentication.ts
   npx tsx examples/02-dynamic-qr.ts
   npx tsx examples/03-c2b-register-url.ts
   npx tsx examples/04-c2b-simulate.ts
   ```

## Index

| File                     | Demonstrates                                             |
| ------------------------ | -------------------------------------------------------- |
| `01-authentication.ts`   | Client setup, `getAccessToken()`, `clearAuthCache()`     |
| `02-dynamic-qr.ts`       | Generating a Dynamic QR code, saving it as a PNG         |
| `03-c2b-register-url.ts` | Registering C2B Validation/Confirmation URLs             |
| `04-c2b-simulate.ts`     | Simulating PayBill and Buy Goods payments (sandbox only) |

More examples will be added here as new endpoints are implemented.
