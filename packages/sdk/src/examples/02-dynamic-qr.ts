/**
 * Example: Generating a Dynamic QR code for a Buy Goods payment.
 *
 * Run: npx tsx examples/02-dynamic-qr.ts
 */
import fs from "node:fs";
import path from "node:path";
import { Daraja, DynamicQRClient, DarajaError } from "..";

const daraja = new Daraja({
  consumerKey: process.env.CONSUMER_KEY!,
  consumerSecret: process.env.CONSUMER_SECRET!,
  environment: "sandbox",
});

async function main() {
  try {
    const qr = await daraja.dynamicQR.generate({
      merchantName: "TEST SUPERMARKET",
      refNo: "Invoice Test",
      amount: 1,
      trxCode: "BG", // Buy Goods (Till). Also: WA, PB, SM, SB — see DynamicQRTrxCode.
      cpi: "373132",
      size: 300,
    });

    console.log("QR generated:", qr.ResponseDescription);

    // Save it as a real viewable PNG.
    const outPath = path.resolve(__dirname, "dynamic-qr-output.png");
    fs.writeFileSync(outPath, Buffer.from(qr.QRCode, "base64"));
    console.log("Saved to:", outPath);

    // Or use it directly in a browser / React <img>:
    const dataUri = DynamicQRClient.toDataUri(qr);
    console.log("Data URI (truncated):", dataUri.slice(0, 50) + "...");
  } catch (error) {
    if (error instanceof DarajaError) {
      console.error(error.format());
    } else {
      throw error;
    }
  }
}

main();
