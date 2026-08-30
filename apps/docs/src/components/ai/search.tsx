"use client";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import {
  KeyRound,
  Loader2,
  MessageCircleIcon,
  RefreshCw,
  SearchIcon,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button, buttonVariants } from "../ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "../ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../ui/message-scroller";
import { useChat, type UseChatHelpers } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type Tool,
  type UIMessage,
  type UIToolInvocation,
} from "ai";
import { Markdown } from "../markdown";
import { string } from "zod";

export type ChatUIMessage = UIMessage<
  never,
  {
    client: {
      location: string;
    };
  }
>;

export type SearchTool = Tool<{ query: string; limit: number }>;

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  chat: UseChatHelpers<ChatUIMessage>;
} | null>(null);

export function AISearchPanelHeader({
  className,
  ...props
}: ComponentProps<"div">) {
  const { setOpen } = useAISearchContext();
  const { messages, setMessages, regenerate, status } = useChatContext();
  const visibleMessages = messages.filter(
    (message) => message.role !== "system",
  );
  const lastMessage = visibleMessages.at(-1);
  const isLoading = status === "streaming";
  const hasMessages = visibleMessages.length > 0;
  const canRetry = !isLoading && lastMessage?.role === "assistant";

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between gap-3",
        "mb-2 rounded-xl border bg-fd-secondary/60 backdrop-blur-md px-3 py-2",
        "text-fd-secondary-foreground shadow-xs",
        className,
      )}
      {...props}
    >
      <span className="text-sm font-medium tracking-tight px-1">
        Ask Daraja
      </span>

      <div className="flex items-center gap-1">
        {hasMessages && (
          <>
            {canRetry && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2 text-xs text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground transition-colors"
                onClick={() => regenerate()}
              >
                <RefreshCw className="size-3.5" />
                <span>Retry</span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-2 text-xs text-fd-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              onClick={() => setMessages([])}
            >
              Clear
            </Button>
          </>
        )}
        <Button
          type="button"
          aria-label="Close Ask Daraja"
          title="Close"
          tabIndex={-1}
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-full text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-accent-foreground"
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function AISearchPanelFooter({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "w-full flex items-center justify-center py-2 px-4",
        className,
      )}
      {...props}
    >
      <p className="text-[11px] text-fd-muted-foreground/70 tracking-tight text-center">
        AI can be inaccurate, please verify the answers.
      </p>
    </div>
  );
}

export function AISearchInputActions() {
  const { messages, status, setMessages, regenerate } = useChatContext();
  const isLoading = status === "streaming";

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === "assistant" && (
        <Button
          type="button"
          className={cn(
            buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "rounded-full gap-1.5",
            }),
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </Button>
      )}
      <Button
        type="button"
        className={cn(
          buttonVariants({
            variant: "secondary",
            size: "sm",
            className: "rounded-full",
          }),
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </Button>
    </>
  );
}

const StorageKeyInput = "__ai_search_input";

export function AISearchInput(props: ComponentProps<"form">) {
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState(
    () => localStorage.getItem(StorageKeyInput) ?? "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "streaming" || status === "submitted";

  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault();
    const message = input.trim();
    if (message.length === 0) return;

    void sendMessage({
      role: "user",
      parts: [
        {
          type: "data-client",
          data: {
            location: location.href,
          },
        },
        {
          type: "text",
          text: message,
        },
      ],
    });
    setInput("");
    localStorage.removeItem(StorageKeyInput);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  useEffect(() => {
    if (isLoading) document.getElementById("nd-ai-input")?.focus();
  }, [isLoading]);

  // Auto-grow the textarea as the user types. This is the one place a
  // dynamic inline style is genuinely necessary rather than a static
  // decorative value — the target height is computed per keystroke from
  // scrollHeight, so no fixed Tailwind/global class could express it.
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    localStorage.setItem(StorageKeyInput, e.target.value);
    const el = e.target;
    // skipcq JS-0440
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <form {...props} onSubmit={onStart}>
      <InputGroup>
        <InputGroupTextarea
          id="nd-ai-input"
          ref={textareaRef}
          value={input}
          rows={1}
          placeholder={isLoading ? "AI is answering..." : "Ask a question"}
          autoFocus
          disabled={isLoading}
          className="max-h-40 resize-none"
          onChange={handleInput}
          onKeyDown={(event) => {
            if (!event.shiftKey && event.key === "Enter") {
              onStart(event);
            }
          }}
        />
        <InputGroupAddon align="block-end">
          {isLoading ? (
            <InputGroupButton
              type="button"
              variant="secondary"
              size="icon-sm"
              className="ml-auto rounded-full"
              onClick={stop}
              aria-label="Stop generating"
            >
              <Loader2 className="size-4 animate-spin" />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              className="ml-auto rounded-full"
              disabled={input.trim().length === 0}
              aria-label="Send"
            >
              <Send className="size-4" />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

const roleName: Record<string, string> = {
  user: "You",
  assistant: "Daraja",
};

// ---------------------------------------------------------------------------
// Message — the piece that was actually making the panel look flat. User
// turns are right-aligned with a filled bubble; assistant turns are
// left-aligned with a bordered bubble. Each gets its own avatar, and the
// bubble corner nearest the avatar is squared off (the classic "speech
// bubble tail" cue) so the two roles are visually distinguishable at a
// glance, not just by which side of the panel they're on.
// ---------------------------------------------------------------------------

function Message({
  message,
  ...props
}: { message: ChatUIMessage } & ComponentProps<"div">) {
  const isUser = message.role === "user";
  let markdown = "";
  const searchCalls: UIToolInvocation<SearchTool>[] = [];

  for (const part of message.parts ?? []) {
    if (part.type === "text") {
      markdown += part.text;
      continue;
    }

    if (part.type.startsWith("tool-")) {
      const toolName = part.type.slice("tool-".length);
      const p = part as UIToolInvocation<Tool>;

      if (toolName !== "search" || !p.toolCallId) continue;
      searchCalls.push(p);
    }
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      {...props}
      className={cn(
        "flex gap-2.5",
        isUser && "flex-row-reverse",
        props.className,
      )}
    >
      <Avatar className="size-7 shrink-0 border">
        {isUser ? (
          <AvatarFallback className="bg-fd-secondary text-fd-secondary-foreground">
            <UserRound className="size-3.5" style={{ color: "#00A651" }} />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/ChatBot.png" alt="Daraja" />
            <AvatarFallback className="bg-fd-secondary text-fd-secondary-foreground">
              <KeyRound className="size-3.5" />
            </AvatarFallback>
          </>
        )}
      </Avatar>

      <div
        className={cn(
          "flex min-w-0 flex-col gap-1",
          isUser ? "max-w-[85%] items-end" : "w-full flex-1",
        )}
      >
        <p className="px-1 text-xs font-medium text-fd-muted-foreground">
          {roleName[message.role] ?? "unknown"}
        </p>

        <div
          className={cn(
            "prose prose-sm min-w-0 text-sm dark:prose-invert",
            isUser
              ? "rounded-2xl rounded-tr-sm bg-fd-primary px-3.5 py-2 text-fd-primary-foreground"
              : "w-full max-w-none bg-transparent px-0 py-1",
          )}
        >
          <Markdown text={markdown} />
        </div>

        {searchCalls.length > 0 &&
          (() => {
            const isSearching = searchCalls.some(
              (call) =>
                call.state !== "output-available" &&
                call.state !== "output-error" &&
                call.state !== "output-denied",
            );
            const hasFailure = searchCalls.some(
              (call) =>
                call.state === "output-error" || call.state === "output-denied",
            );
            const totalResults = searchCalls.reduce((sum, call) => {
              if (
                call.state === "output-available" &&
                Array.isArray(call.output)
              ) {
                return sum + call.output.length;
              }
              return sum;
            }, 0);

            if (isSearching) {
              return (
                <div className="flex w-fit items-center gap-2 rounded-lg border bg-fd-secondary px-3 py-1.5 text-xs text-fd-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-fd-muted-foreground" />
                  </span>
                  Searching documentation…
                </div>
              );
            }

            return (
              <details className="w-fit rounded-lg border bg-fd-secondary text-xs text-fd-muted-foreground">
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 marker:content-none [&::-webkit-details-marker]:hidden">
                  <SearchIcon className="size-3.5 shrink-0" />
                  {hasFailure ? (
                    <span className="text-fd-error">Search failed</span>
                  ) : (
                    <span>
                      Searched docs · {totalResults} result
                      {totalResults === 1 ? "" : "s"}
                    </span>
                  )}
                </summary>
                <div className="flex flex-col gap-1 border-t px-3 py-2">
                  {searchCalls.map((call) => (
                    <p key={call.toolCallId}>
                      {call.state === "output-error" ||
                      call.state === "output-denied"
                        ? (call.errorText ?? "Failed to search")
                        : `${Array.isArray(call.output) ? call.output.length : 0} result${
                            Array.isArray(call.output) &&
                            call.output.length === 1
                              ? ""
                              : "s"
                          }`}
                    </p>
                  ))}
                </div>
              </details>
            );
          })()}
      </div>
    </div>
  );
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const chat = useChat<ChatUIMessage>({
    id: "search",
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen }), [chat, open])}>
      {children}
    </Context>
  );
}

export function AISearchTrigger({
  position = "default",
  className,
  ...props
}: ComponentProps<"button"> & { position?: "default" | "float" }) {
  const { open, setOpen } = useAISearchContext();

  return (
    <Button
      data-state={open ? "open" : "closed"}
      className={cn(
        position === "float" && [
          "fixed bottom-4 gap-2 px-4 h-10 w-auto inset-e-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] shadow-lg z-20 transition-[translate,opacity]",
          open && "translate-y-10 opacity-0",
        ],
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {props.children}
    </Button>
  );
}

export function AISearchPanel() {
  const { open, setOpen } = useAISearchContext();
  const [actualOpen, setActualOpen] = useState(open);
  useHotKey();

  if (open && !actualOpen) setActualOpen(open);

  return (
    <>
      <style>
        {`
        @keyframes ask-ai-open {
          from {
            translate: 100% 0;
          }
          to {
            translate: 0 0;
          }
        }
        @keyframes ask-ai-close {
          from {
            width: var(--ai-chat-width);
          }
          to {
            width: 0px;
          }
        }`}
      </style>
      {actualOpen && (
        <div
          className={cn(
            "fixed inset-0 z-30 backdrop-blur-xs bg-fd-overlay lg:hidden",
            open ? "animate-fd-fade-in" : "animate-fd-fade-out",
          )}
          onClick={() => setOpen(false)}
          onAnimationEnd={() => {
            if (!open) flushSync(() => setActualOpen(false));
          }}
        />
      )}
      {actualOpen && (
        <div
          className={cn(
            "overflow-hidden z-30 bg-fd-card text-fd-card-foreground [--ai-chat-width:400px] 2xl:[--ai-chat-width:460px]",
            "max-lg:fixed max-lg:inset-x-2 max-lg:inset-y-4 max-lg:border max-lg:rounded-2xl max-lg:shadow-xl",
            "lg:sticky lg:top-0 lg:h-dvh lg:border-s lg:ms-auto lg:in-[#nd-docs-layout]:[grid-area:toc] lg:in-[#nd-notebook-layout]:row-span-full lg:in-[#nd-notebook-layout]:col-start-5",
            open
              ? "animate-fd-dialog-in lg:animate-[ask-ai-open_200ms]"
              : "animate-fd-dialog-out lg:animate-[ask-ai-close_200ms]",
          )}
          onAnimationEnd={() => {
            if (!open) flushSync(() => setActualOpen(false));
          }}
        >
          <MessageScrollerProvider>
            <div className="flex flex-col size-full p-2 lg:p-3 lg:w-(--ai-chat-width)">
              <AISearchPanelHeader />
              <AISearchPanelList className="flex-1" />
              <div className="rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm has-focus-visible:shadow-md">
                <AISearchInput />
                <AISearchPanelFooter />
              </div>
            </div>
          </MessageScrollerProvider>
        </div>
      )}
    </>
  );
}

export function AISearchPanelList({
  className,
  ...props
}: ComponentProps<"div">) {
  const chat = useChatContext();
  const messages = chat.messages.filter((msg) => msg.role !== "system");
  const isBusy = chat.status === "streaming" || chat.status === "submitted";

  if (messages.length === 0) {
    return (
      <Empty className={cn("size-full", className)} {...props}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageCircleIcon fill="currentColor" stroke="none" />
          </EmptyMedia>
          <EmptyTitle>Ask about Daraja</EmptyTitle>
          <EmptyDescription onClick={(e) => e.stopPropagation()}>
            Start a new chat below.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <MessageScroller className={cn("min-h-0 flex-1", className)} {...props}>
      <MessageScrollerViewport>
        <MessageScrollerContent
          aria-busy={isBusy}
          className="flex flex-col gap-4 px-3 py-4"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)",
          }}
        >
          {chat.error && (
            <div className="p-2 bg-fd-secondary text-fd-secondary-foreground border rounded-lg">
              <p className="text-xs text-fd-muted-foreground mb-1">
                Request Failed: {chat.error.name}
              </p>
              <p className="text-sm">{chat.error.message}</p>
            </div>
          )}
          {messages.map((item) => (
            <Message key={item.id} message={item} />
          ))}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

export function useHotKey() {
  const { open, setOpen } = useAISearchContext();

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === "/" && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onKeyPress);
    return () => window.removeEventListener("keydown", onKeyPress);
  }, []);
}

export function useAISearchContext() {
  return use(Context)!;
}

function useChatContext() {
  return use(Context)!.chat;
}
