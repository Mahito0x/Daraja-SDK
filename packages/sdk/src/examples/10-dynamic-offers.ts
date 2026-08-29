/**
 * Example: Browsing and buying a mobile data bundle in-app (Mobile Data
 * Bundles / Dynamic Offers), then checking the purchase's status.
 *
 * Run: npx tsx examples/10-dynamic-offers.ts
 */
import { Daraja, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
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
      transactionId: `order-${Date.now()}`,
    });

    console.log("Purchase response:", purchase.header.customerMessage);

    // Purchase confirmation is asynchronous — poll checkStatus() using the
    // same transactionId until it reflects the final outcome.
    const status = await daraja.dynamicOffers.checkStatus({
      transactionId: `order-${Date.now()}`,
    });
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
