# Examples

Runnable, copy-pasteable reference code for each Daraja endpoint this SDK supports.

These examples match the live SDK surface and use the same function-call style that is exercised by the package tests.

## Running an example

1. Copy `.env.example` → `.env` and set at least:
   ```bash
   CONSUMER_KEY=your_sandbox_consumer_key
   CONSUMER_SECRET=your_sandbox_consumer_secret
   MPESA_PASSKEY=your_sandbox_passkey
   B2C_SECURITY_CREDENTIAL=your_encrypted_b2c_credential
   CHECKOUT_REQUEST_ID=ws_CO_...
   ```
2. Run any example directly with `tsx`:
   ```bash
   npx tsx examples/01-authentication.ts
   npx tsx examples/02-dynamic-qr.ts
   npx tsx examples/03-c2b-register-url.ts
   npx tsx examples/04-c2b-simulate.ts
   npx tsx examples/05-swap.ts
   npx tsx examples/06-imsi.ts
   npx tsx examples/07-b2b-hikisha.ts
   npx tsx examples/08-mobile-number-validation.ts
   npx tsx examples/09-b2c-topup.ts
   npx tsx examples/10-dynamic-offers.ts
   npx tsx examples/11-mpesa-express-push.ts
   npx tsx examples/12-mpesa-express-query.ts
   ```

## Index

| File                             | Demonstrates                                              |
| -------------------------------- | --------------------------------------------------------- |
| `01-authentication.ts`           | Client setup, `getAccessToken()`, `clearAuthCache()`      |
| `02-dynamic-qr.ts`               | Generating a Dynamic QR code and saving it as a PNG       |
| `03-c2b-register-url.ts`         | Registering C2B validation and confirmation callbacks     |
| `04-c2b-simulate.ts`             | Simulating PayBill and BuyGoods C2B payments in sandbox   |
| `05-swap.ts`                     | Checking a customer's SIM swap state                      |
| `06-imsi.ts`                     | IMSI V1 and V2 lookups                                    |
| `07-b2b-hikisha.ts`              | Looking up a B2B organization profile                     |
| `08-mobile-number-validation.ts` | Matching a phone number against an ID                     |
| `09-b2c-topup.ts`                | Submitting a B2C top-up request and handling the callback |
| `10-dynamic-offers.ts`           | Fetching and purchasing mobile data bundles               |
| `11-mpesa-express-push.ts`       | Sending an STK Push request                               |
| `12-mpesa-express-query.ts`      | Checking the status of an STK Push                        |
