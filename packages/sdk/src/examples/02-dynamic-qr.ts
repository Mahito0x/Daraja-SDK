// @ts-nocheck
/**
 * Example: Generating a Dynamic QR code for a Buy Goods payment.
 *
 * Run: npx tsx examples/02-dynamic-qr.ts
 */
import fs from "node:fs";
import { Daraja, DynamicQRClient, DarajaError } from "..";

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
    const qr = await daraja.dynamicQR.generate({
      merchantName: "TEST SUPERMARKET",
      refNo: "Invoice Test",
      amount: 1,
      trxCode: "BG",
      cpi: "373132",
      size: 300,
    });

    console.log("QR generated:", qr.ResponseDescription);

    const outputUrl = new URL("./dynamic-qr-output.png", import.meta.url);
    fs.writeFileSync(outputUrl, Buffer.from(qr.QRCode, "base64"));
    console.log("Saved to:", outputUrl.pathname);

    const dataUri = DynamicQRClient.toDataUri(qr);
    console.log(`Data URI (truncated): ${dataUri.slice(0, 50)}...`);
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
