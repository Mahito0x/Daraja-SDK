/**
 * Example: Simulating a customer C2B payment (sandbox only).
 *
 * Run: npx tsx examples/04-c2b-simulate.ts
 *
 * Register your callback URLs first (see 03-c2b-register-url.ts) — that's
 * what receives the resulting confirmation notification.
 */
import { Daraja, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox", // simulate() throws if this is 'production'
});

async function main() {
  try {
    // Paybill example — billRefNumber is required.
    const payBillResult = await daraja.c2b.simulate({
      shortCode: "600984",
      commandId: "CustomerPayBillOnline",
      amount: 1,
      msisdn: "254708374149",
      billRefNumber: "Test Ref",
    });
    console.log("PayBill simulation:", payBillResult.ResponseDescription);

    // Buy Goods (Till) example — billRefNumber must be omitted.
    const buyGoodsResult = await daraja.c2b.simulate({
      shortCode: "600984",
      commandId: "CustomerBuyGoodsOnline",
      amount: 1,
      msisdn: "254708374149",
    });
    console.log("Buy Goods simulation:", buyGoodsResult.ResponseDescription);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
