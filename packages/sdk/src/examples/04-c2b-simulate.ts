// @ts-nocheck
/**
 * Example: Simulating a customer C2B payment (sandbox only).
 *
 * Run: npx tsx examples/04-c2b-simulate.ts
 */
import { Daraja, DarajaError } from "..";

function assertEnvVar(name: string, value?: string): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

const daraja = Daraja({
  consumerKey: assertEnvVar("CONSUMER_KEY", process.env.CONSUMER_KEY),
  consumerSecret: assertEnvVar("CONSUMER_SECRET", process.env.CONSUMER_SECRET),
  environment: "sandbox",
});

async function main() {
  try {
    const payBillResult = await daraja.c2b.simulate({
      shortCode: "600984",
      commandId: "CustomerPayBillOnline",
      amount: 1,
      msisdn: "254708374149",
      billRefNumber: "Test Ref",
    });
    console.log("PayBill simulation:", payBillResult.ResponseDescription);

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
