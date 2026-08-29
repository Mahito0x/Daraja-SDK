import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  tool,
  toUIMessageStream,
  type LanguageModel,
  type UIMessageStreamWriter,
} from "ai";
import { z } from "zod";
import { source } from "@/lib/source";
import { Document, type DocumentData } from "flexsearch";
import type { ChatUIMessage, SearchTool } from "../../../components/ai/search";

interface CustomDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}

const searchServer = createSearchServer();

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: "url",
      index: ["title", "description", "content"],
      store: true,
    },
  });

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!("getText" in page.data)) return null;

      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        content: await page.data.getText("processed"),
      } as CustomDocument;
    }),
  );

  for (const doc of docs) {
    if (doc) search.add(doc);
  }

  return search;
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

const google = createGoogleGenerativeAI({
  apiKey:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    "X-Title": "Daraja SDK Docs",
  },
});

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function resolveModel(modelStr: string): LanguageModel | null {
  const trimmed = modelStr.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("openrouter:")) {
    return openrouter(trimmed.replace("openrouter:", ""));
  }
  if (trimmed.startsWith("openai:")) {
    return openai(trimmed.replace("openai:", ""));
  }
  if (trimmed.startsWith("google:")) {
    return google(trimmed.replace("google:", ""));
  }
  if (trimmed.includes("/")) {
    return openrouter(trimmed);
  }
  return google(trimmed);
}

const defaultSystemPrompt = [
  "You are the official AI Documentation Assistant for Daraja SDK.",
  "Use the `search` tool to retrieve relevant docs context before answering when needed.",
].join("\n");

const systemPrompt = process.env.AI_SYSTEM_PROMPT
  ? process.env.AI_SYSTEM_PROMPT.replace(/\\n/g, "\n")
  : defaultSystemPrompt;

async function tryModel(
  modelStr: string,
  messages: Awaited<ReturnType<typeof convertToModelMessages<ChatUIMessage>>>,
): Promise<{
  parts: Parameters<UIMessageStreamWriter<ChatUIMessage>["write"]>[0][];
} | null> {
  const model = resolveModel(modelStr);
  if (!model) return null;

  let hadError = false;
  let wroteText = false;
  const bufferedParts: Parameters<
    UIMessageStreamWriter<ChatUIMessage>["write"]
  >[0][] = [];

  try {
    const result = streamText({
      model,
      maxRetries: 0,
      system: systemPrompt,
      stopWhen: stepCountIs(5),
      tools: { search: searchTool },
      toolChoice: "auto",
      messages,
      onError({ error }) {
        hadError = true;
        console.warn(
          `[AI Search] ${modelStr} failed:`,
          error instanceof Error ? error.message : error,
        );
      },
    });

    const uiStream = toUIMessageStream<{ search: SearchTool }, ChatUIMessage>({
      stream: result.stream,
      tools: { search: searchTool },
    });

    const reader = uiStream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.type === "error") {
        hadError = true;
        break;
      }
      if (value.type === "text-delta") wroteText = true;
      bufferedParts.push(value);
    }
  } catch (err) {
    hadError = true;
    console.warn(
      `[AI Search] ${modelStr} threw:`,
      err instanceof Error ? err.message : "unknown error",
    );
  }

  if (hadError || !wroteText) {
    console.warn(
      `[AI Search] ${modelStr} produced no usable text answer, trying next model`,
    );
    return null;
  }

  return { parts: bufferedParts };
}

export async function POST(req: Request) {
  const reqJson = await req.json();

  const messages = await convertToModelMessages<ChatUIMessage>(
    reqJson.messages ?? [],
    {
      convertDataPart(part) {
        if (part.type === "data-client")
          return {
            type: "text",
            text: `[Client Context: ${JSON.stringify(part.data)}]`,
          };
      },
    },
  );

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  const userQuery = lastUserMessage
    ? typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : lastUserMessage.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ")
    : "";

  const modelList = (
    process.env.AI_MODELS ??
    "google:gemini-2.5-flash,openrouter:google/gemma-4-31b-it:free,openrouter:meta-llama/llama-3.3-70b-instruct:free"
  )
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      for (const modelStr of modelList) {
        const outcome = await tryModel(modelStr, messages);
        if (!outcome) continue;

        for (const part of outcome.parts) writer.write(part);
        return;
      }

      console.error(
        "[AI Search] All configured models failed, falling back to search",
      );

      let docsResultsMarkdown = "";
      if (userQuery) {
        try {
          const search = await searchServer;
          const searchResults = await search.searchAsync(userQuery, {
            limit: 5,
            enrich: true,
          });

          const matchingDocs: {
            title: string;
            url: string;
            description: string;
          }[] = [];
          const seenUrls = new Set<string>();

          for (const fieldResult of searchResults) {
            if (
              !("result" in fieldResult) ||
              !Array.isArray(fieldResult.result)
            )
              continue;

            for (const item of fieldResult.result) {
              const doc = item.doc as CustomDocument | undefined;
              if (doc?.url && !seenUrls.has(doc.url)) {
                seenUrls.add(doc.url);
                matchingDocs.push({
                  title: doc.title,
                  url: doc.url,
                  description: doc.description,
                });
              }
            }
          }

          if (matchingDocs.length > 0) {
            docsResultsMarkdown =
              "\n\nHere are the most relevant documentation guides for your question:\n\n" +
              matchingDocs
                .map(
                  (d) =>
                    `* [${d.title}](${d.url})${d.description ? ` — ${d.description}` : ""}`,
                )
                .join("\n");
          }
        } catch (searchErr) {
          console.error("[AI Search] Offline search failed:", searchErr);
        }
      }

      const fallbackContent =
        "Pole! The AI went for a quick chai break. " +
        (docsResultsMarkdown ||
          "Check the docs directly or try again in a sec.");

      const id = crypto.randomUUID();
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", delta: fallbackContent, id });
      writer.write({ type: "text-end", id });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

const searchTool = tool({
  description: "Search the docs content and return raw JSON results.",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer;
    return await search.searchAsync(query, {
      limit,
      merge: true,
      enrich: true,
    });
  },
}) satisfies SearchTool;
