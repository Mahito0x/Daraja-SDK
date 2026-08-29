"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { CopyButton } from "@/components/CopyButton";
import { TypeScript, Nextjs, Astro, Webhook } from "@/components/Icons";

type CodeTab = {
  id: string;
  label: string;
  language: string;
  filename: string;
  icon: React.ComponentType<{ className?: string }>;
  code: string;
};

const tabs: CodeTab[] = [
  {
    id: "typescript",
    label: "checkout.ts",
    language: "typescript",
    filename: "checkout.ts",
    icon: TypeScript,
    code: `import { Daraja } from "@lumierelabs/daraja"

const daraja = Daraja({
  consumerKey: process.env.DARAJA_CONSUMER_KEY!,
  consumerSecret: process.env.DARAJA_CONSUMER_SECRET!,
  environment: "sandbox",
})

const push = await daraja.stkPush({
  businessShortCode: "174379",
  passkey: process.env.MPESA_PASSKEY!,
  transactionType: "CustomerPayBillOnline",
  amount: 1,
  partyA: "254708374149",
  partyB: "174379",
  phoneNumber: "254708374149",
  callBackURL: "https://example.com/api/callbacks/stk",
  accountReference: "INV-1042",
  transactionDesc: "Order #1042",
})

console.log(push.CheckoutRequestID)`,
  },
  {
    id: "nextjs",
    label: "app/api/checkout/route.ts",
    language: "typescript",
    filename: "app/api/checkout/route.ts",
    icon: Nextjs,
    code: `import { NextResponse } from "next/server"
import { daraja } from "@/lib/daraja"
import { DarajaError } from "@lumierelabs/daraja"

export async function POST(request: Request) {
  const { phoneNumber, amount, orderRef } = await request.json()

  try {
    const push = await daraja.stkPush({
      businessShortCode: "174379",
      passkey: process.env.MPESA_PASSKEY!,
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      partyB: "174379",
      phoneNumber,
      callBackURL: \`\${process.env.APP_URL}/api/callbacks/stk\`,
      accountReference: orderRef,
      transactionDesc: "Order payment",
    })

    return NextResponse.json({ checkoutRequestId: push.CheckoutRequestID })
  } catch (error) {
    if (error instanceof DarajaError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 400 },
      )
    }
    throw error
  }
}`,
  },
  {
    id: "astro",
    label: "src/pages/api/checkout.ts",
    language: "typescript",
    filename: "src/pages/api/checkout.ts",
    icon: Astro,
    code: `import type { APIRoute } from "astro"
import { daraja } from "../../lib/daraja"
import { DarajaError } from "@lumierelabs/daraja"

export const POST: APIRoute = async ({ request }) => {
  const { phoneNumber, amount, orderRef } = await request.json()

  try {
    const push = await daraja.stkPush({
      businessShortCode: "174379",
      passkey: import.meta.env.MPESA_PASSKEY,
      transactionType: "CustomerPayBillOnline",
      amount,
      partyA: phoneNumber,
      partyB: "174379",
      phoneNumber,
      callBackURL: \`\${import.meta.env.APP_URL}/api/callbacks/stk\`,
      accountReference: orderRef,
    })

    return new Response(
      JSON.stringify({ checkoutRequestId: push.CheckoutRequestID }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    const message =
      error instanceof DarajaError ? error.message : "Payment failed to initiate"
    return new Response(JSON.stringify({ error: message }), { status: 400 })
  }
}

export const prerender = false`,
  },
  {
    id: "webhook",
    label: "app/api/callbacks/stk/route.ts",
    language: "typescript",
    filename: "app/api/callbacks/stk/route.ts",
    icon: Webhook,
    code: `import { NextResponse } from "next/server"

interface StkCallbackItem {
  Name: string
  Value?: string | number
}

interface StkCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: { Item: StkCallbackItem[] }
    }
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as StkCallbackBody
  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
    payload.Body.stkCallback

  if (ResultCode === 0) {
    const items = CallbackMetadata?.Item ?? []
    const get = (name: string) => items.find((i) => i.Name === name)?.Value

    console.log("Payment confirmed", {
      checkoutRequestId: CheckoutRequestID,
      amount: get("Amount"),
      receipt: get("MpesaReceiptNumber"),
      phoneNumber: get("PhoneNumber"),
    })
  } else {
    console.log(\`Payment failed for \${CheckoutRequestID}: \${ResultDesc}\`)
  }

  // Daraja only checks for a 200 — it does not parse this body.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" })
}`,
  },
];

export function CodeShowcase() {
  const [activeId, setActiveId] = useState("typescript");
  const [highlightedCode, setHighlightedCode] = useState("");

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  useEffect(() => {
    let isMounted = true;

    async function updateHighlight() {
      const isDark = document.documentElement.classList.contains("dark");
      const theme = isDark ? "github-dark-default" : "github-light";

      const html = await codeToHtml(activeTab.code, {
        lang: activeTab.language,
        theme,
      });

      if (isMounted) {
        setHighlightedCode(html);
      }
    }

    void updateHighlight();

    const observer = new MutationObserver(() => {
      void updateHighlight();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [activeTab]);

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800/80 dark:bg-[#000000] dark:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.7)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100/80 px-3 py-2 dark:border-white/[0.07] dark:bg-[#0d0d0f]">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden pr-2">
            {/* Traffic Lights */}
            <div className="flex items-center gap-1.5 shrink-0 pl-1">
              <div className="size-3 rounded-full bg-[#ff5f56]" />
              <div className="size-3 rounded-full bg-[#ffbd2e]" />
              <div className="size-3 rounded-full bg-[#27c93f]" />
            </div>

            <div className="h-4 w-px bg-zinc-300 dark:bg-white/[0.08] shrink-0 hidden sm:block" />

            {/* File Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto min-w-0 py-0.5">
              {tabs.map((tab) => {
                const isActive = tab.id === activeId;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveId(tab.id)}
                    className={[
                      "group relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono transition-all duration-150 shrink-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:focus-visible:ring-white/20",
                      isActive
                        ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80 dark:bg-white/[0.08] dark:text-zinc-100 dark:border-transparent"
                        : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200",
                    ].join(" ")}
                  >
                    <Icon className="size-3.5 shrink-0 text-zinc-500 group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                    <span>{tab.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copy Button */}
          <div className="shrink-0 pl-2">
            <CopyButton text={activeTab.code} />
          </div>
        </div>

        {/* Code Content */}
        <div className="relative overflow-x-auto bg-white dark:bg-[#000000]">
          {!highlightedCode ? (
            <div className="min-h-[360px] px-5 py-6 sm:px-6">
              <div className="space-y-3 opacity-30">
                <div className="h-3.5 w-56 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-80 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-64 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-72 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-3.5 w-48 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </div>
          ) : (
            <div
              key={activeTab.id}
              className="
                [&_pre]:m-0
                [&_pre]:overflow-x-auto
                [&_pre]:bg-transparent
                [&_pre]:px-5
                [&_pre]:py-5
                [&_pre]:font-mono
                [&_pre]:text-[12px]
                [&_pre]:leading-6

                sm:[&_pre]:px-6
                sm:[&_pre]:py-6
                sm:[&_pre]:text-[13px]
                sm:[&_pre]:leading-6.5

                [&_code]:font-mono
              "
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white dark:from-[#000000] to-transparent" />
        </div>
      </div>
    </div>
  );
}
