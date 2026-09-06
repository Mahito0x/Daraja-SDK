# Daraja Express app

Generated with `@lumierelabs/create-daraja`.

Copy `.env.example` to `.env`, fill in your Daraja credentials, then run:

```bash
npm install
npm run dev
```

The generated routes are under `src/routes`. Webhook routes must be publicly reachable by Safaricom, and `express.json()` is registered before them.
