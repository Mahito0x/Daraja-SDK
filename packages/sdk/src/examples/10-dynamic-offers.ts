// @ts-nocheck
/**
 * Example: Browsing and buying a mobile data bundle in-app (Mobile Data
 * Bundles / Dynamic Offers), then checking the purchase's status.
 *
 * Run: npx tsx examples/10-dynamic-offers.ts
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
    const offers = await daraja.dynamicOffers.fetchOffers({
      msisdn: "254708374149",
    });
    const [firstOffer] = offers.lineItem.characteristicsValue;

    if (!firstOffer) {
      console.log("No offers available for this number.");
      return;
    }

    const transactionId = `order-${Date.now()}`;
    console.log(
      `Buying "${firstOffer.offerName}" for KES ${firstOffer.offerPrice}...`,
    );

    const purchase = await daraja.dynamicOffers.purchase({
      msisdn: "254708374149",
      offeringId: String(firstOffer.offeringId),
      paymentMode: "airtime",
      accountId: String(firstOffer.resourceAccId),
      price: firstOffer.offerPrice,
      resourceAmount: firstOffer.resourceValue,
      validity: firstOffer.offerValidity,
      transactionId,
    });

    console.log("Purchase response:", purchase.header.customerMessage);

    const status = await daraja.dynamicOffers.checkStatus({ transactionId });
    console.log("Status:", status.responseDesc);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
