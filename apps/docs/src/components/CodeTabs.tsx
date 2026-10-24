"use client";

import * as React from "react";
import { AnimatePresence, motion, type Transition } from "motion/react";
import { useTheme } from "next-themes";

import { CopyButton } from "@/components/Copy";
import { cn } from "@/lib/utils";

type TabsContextType = {
  activeValue: string;
  handleValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

function useTabs() {
  const context = React.useContext(TabsContext);
  if (context === undefined) {
    throw new Error("useContext must be used within TabsContext");
  }
  return context;
}

type TabsContentProps = Omit<
  React.ComponentProps<typeof motion.div>,
  "children" | "value"
> & {
  value: string;
  children: React.ReactNode;
};

function TabsContent({ value, children, style, ...props }: TabsContentProps) {
  const { activeValue } = useTabs();
  const isActive = activeValue === value;

  return (
    <motion.div
      role="tabpanel"
      data-slot="tabs-content"
      inert={!isActive}
      style={{ overflow: "hidden", ...style }}
      initial={{ filter: "blur(0px)" }}
      animate={{ filter: isActive ? "blur(0px)" : "blur(4px)" }}
      exit={{ filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type TabsContentsProps = Omit<
  React.ComponentProps<typeof motion.div>,
  "children" | "transition"
> & {
  children: React.ReactNode;
  transition?: Transition;
  /** Stretch to the parent's height instead of auto-sizing to content. Use this when two CodeTabs need to match each other's height (e.g. side by side or in a ComparisonSlider). */
  fillHeight?: boolean;
};

function TabsContents({
  children,
  transition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    bounce: 0,
    restDelta: 0.01,
  },
  fillHeight = false,
  className,
  ...props
}: TabsContentsProps) {
  const { activeValue } = useTabs();
  const childrenArray = React.Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    (child): child is React.ReactElement<{ value: string }> =>
      React.isValidElement(child) &&
      typeof child.props === "object" &&
      child.props !== null &&
      "value" in child.props &&
      child.props.value === activeValue,
  );

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLDivElement | null>>([]);
  const [height, setHeight] = React.useState(0);
  const roRef = React.useRef<ResizeObserver | null>(null);

  const measure = React.useCallback((index: number) => {
    const pane = itemRefs.current[index];
    const container = containerRef.current;
    if (!pane || !container) return 0;

    const base = pane.getBoundingClientRect().height || 0;
    const cs = getComputedStyle(container);
    const isBorderBox = cs.boxSizing === "border-box";
    const paddingY =
      (parseFloat(cs.paddingTop || "0") || 0) +
      (parseFloat(cs.paddingBottom || "0") || 0);
    const borderY =
      (parseFloat(cs.borderTopWidth || "0") || 0) +
      (parseFloat(cs.borderBottomWidth || "0") || 0);

    let total = base + (isBorderBox ? paddingY + borderY : 0);
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    total = Math.ceil(total * dpr) / dpr;

    return total;
  }, []);

  React.useEffect(() => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }

    const pane = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!pane || !container) return;

    setHeight(measure(activeIndex));

    const ro = new ResizeObserver(() => {
      const next = measure(activeIndex);
      requestAnimationFrame(() => setHeight(next));
    });

    ro.observe(pane);
    ro.observe(container);

    roRef.current = ro;
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
  }, [activeIndex, childrenArray.length, measure]);

  React.useLayoutEffect(() => {
    if (height === 0 && activeIndex >= 0) {
      const next = measure(activeIndex);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (next !== 0) setHeight(next);
    }
  }, [activeIndex, height, measure]);

  if (fillHeight) {
    return (
      <div
        data-slot="tabs-contents"
        className={cn("h-full overflow-hidden", className)}
      >
        <motion.div
          className="flex h-full -mx-2"
          animate={{ x: activeIndex * -100 + "%" }}
          transition={transition}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              className="w-full h-full shrink-0 overflow-hidden px-2"
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      data-slot="tabs-contents"
      className={className}
      style={{ overflow: "hidden" }}
      animate={{ height }}
      transition={transition}
      {...props}
    >
      <motion.div
        className="flex -mx-2"
        animate={{ x: activeIndex * -100 + "%" }}
        transition={transition}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            className="w-full shrink-0 px-2 h-full"
          >
            {child}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

type CodeEntry =
  string | { code: string; lang?: string; icon?: React.ReactNode };

type CodeTabsBaseProps = Omit<
  React.ComponentProps<"div">,
  "children" | "defaultValue" | "value" | "onValueChange"
> & {
  codes: Record<string, CodeEntry>;
  icons?: Record<string, React.ReactNode>;
  lang?: string;
  themes?: { light: string; dark: string };
  copyButton?: boolean;
  showFileNames?: boolean;
  fillHeight?: boolean;
  onCopiedChange?: (copied: boolean, content?: string) => void;
};

type UncontrolledCodeTabsProps = CodeTabsBaseProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

type ControlledCodeTabsProps = CodeTabsBaseProps & {
  value: string;
  onValueChange?: (value: string) => void;
  defaultValue?: never;
};

type CodeTabsProps = UncontrolledCodeTabsProps | ControlledCodeTabsProps;

function getEntryCode(entry: CodeEntry) {
  return typeof entry === "string" ? entry : entry.code;
}

function getEntryLang(entry: CodeEntry, fallback: string) {
  return typeof entry === "string" ? fallback : (entry.lang ?? fallback);
}

function CodeTabs({
  codes,
  icons,
  lang = "typescript",
  themes = {
    light: "github-light",
    dark: "github-dark",
  },
  className,
  defaultValue,
  value,
  onValueChange,
  copyButton = true,
  showFileNames = true,
  fillHeight = false,
  onCopiedChange,
  ...props
}: CodeTabsProps) {
  const { resolvedTheme } = useTheme();
  const [highlightedCodes, setHighlightedCodes] = React.useState<Record<
    string,
    string
  > | null>(null);
  const [selectedCode, setSelectedCode] = React.useState<string>(
    value ?? defaultValue ?? Object.keys(codes)[0] ?? "",
  );
  const highlightId = React.useId();
  const highlightTransition: Transition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  };

  React.useEffect(() => {
    async function loadHighlightedCode() {
      try {
        const { codeToHtml } = await import("shiki");
        const newHighlightedCodes: Record<string, string> = {};

        for (const [key, entry] of Object.entries(codes)) {
          const highlighted = await codeToHtml(getEntryCode(entry), {
            lang: getEntryLang(entry, lang),
            themes: {
              light: themes.light,
              dark: themes.dark,
            },
            defaultColor: resolvedTheme === "dark" ? "dark" : "light",
          });

          newHighlightedCodes[key] = highlighted;
        }

        setHighlightedCodes(newHighlightedCodes);
      } catch (error) {
        console.error("Error highlighting codes", error);
        const fallback: Record<string, string> = {};
        for (const [key, entry] of Object.entries(codes)) {
          fallback[key] = getEntryCode(entry);
        }
        setHighlightedCodes(fallback);
      }
    }

    loadHighlightedCode();
  }, [resolvedTheme, lang, themes.light, themes.dark, codes]);

  const handleValueChange = (nextValue: string) => {
    setSelectedCode(nextValue);
    onValueChange?.(nextValue);
  };

  const hasHeader = showFileNames || copyButton;

  return (
    <TabsContext.Provider
      value={{ activeValue: selectedCode, handleValueChange }}
    >
      <div
        data-slot="install-tabs"
        className={cn(
          "w-full gap-0 bg-zinc-50 dark:bg-black rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden",
          fillHeight && "h-full flex flex-col",
          className,
        )}
        {...props}
      >
        {hasHeader && (
          <div
            role={showFileNames ? "tablist" : undefined}
            data-slot="install-tabs-list"
            className={cn(
              "w-full relative flex items-center h-10 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-current py-0 px-4",
              showFileNames ? "justify-between" : "justify-end",
            )}
          >
            {showFileNames && (
              <div className="flex gap-x-3 h-full">
                {highlightedCodes &&
                  Object.keys(highlightedCodes).map((code) => (
                    <div
                      key={code}
                      data-slot="motion-highlight-item-container"
                      data-active={selectedCode === code ? "true" : "false"}
                      aria-selected={selectedCode === code}
                      data-disabled={false}
                      data-value={code}
                      data-highlight="true"
                      className="relative flex items-center justify-center"
                    >
                      <AnimatePresence initial={false} mode="wait">
                        {selectedCode === code && (
                          <motion.div
                            layoutId={`transition-background-${highlightId}`}
                            data-slot="motion-highlight"
                            style={{ position: "absolute", zIndex: 0 }}
                            className="absolute z-0 inset-0 rounded-none shadow-none bg-transparent after:content-[''] after:absolute after:inset-x-0 after:h-0.5 after:bottom-0 dark:after:bg-white after:bg-black after:rounded-t-full"
                            transition={highlightTransition}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                              opacity: 0,
                              transition: {
                                ...highlightTransition,
                                delay: (highlightTransition.delay ?? 0) + 0.2,
                              },
                            }}
                            data-active={
                              selectedCode === code ? "true" : "false"
                            }
                            aria-selected={selectedCode === code}
                            data-disabled={false}
                            data-value={code}
                            data-highlight="true"
                          />
                        )}
                      </AnimatePresence>
                      <div
                        data-slot="motion-highlight-item"
                        style={{ position: "relative", zIndex: 1 }}
                        className="flex items-center justify-center"
                        data-active={selectedCode === code ? "true" : "false"}
                        aria-selected={selectedCode === code}
                        data-disabled={false}
                        data-value={code}
                        data-highlight="true"
                      >
                        <motion.button
                          type="button"
                          data-slot="tabs-trigger"
                          role="tab"
                          onClick={() => handleValueChange(code)}
                          data-state={
                            selectedCode === code ? "active" : "inactive"
                          }
                          className="text-zinc-500 dark:text-zinc-400 h-full text-sm font-medium data-[state=active]:text-zinc-950 dark:data-[state=active]:text-white px-0 flex items-center gap-1.5"
                        >
                          {((typeof codes[code] === "object" &&
                            codes[code].icon) ||
                            icons?.[code]) && (
                            <span className="[&_svg]:size-3.5 [&_svg]:shrink-0">
                              {(typeof codes[code] === "object" &&
                                codes[code].icon) ||
                                icons?.[code]}
                            </span>
                          )}
                          <span>{code}</span>
                        </motion.button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {copyButton && highlightedCodes && (
              <CopyButton
                content={getEntryCode(codes[selectedCode])}
                size="xs"
                variant="ghost"
                className="-me-2.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                onCopiedChange={onCopiedChange}
              />
            )}
          </div>
        )}

        <TabsContents
          data-slot="install-tabs-contents"
          fillHeight={fillHeight}
          className={fillHeight ? "flex-1 min-h-0" : undefined}
        >
          {highlightedCodes &&
            Object.entries(highlightedCodes).map(([code, val]) => (
              <TabsContent
                data-slot="install-tabs-content"
                key={code}
                className={cn("w-full", fillHeight && "h-full")}
                value={code}
              >
                <div
                  className={cn(
                    "w-full text-sm overflow-auto flex p-4 [&>pre,_&_code]:!bg-transparent [&_code_.line]:!px-0 [&>pre,_&_code]:[background:transparent_!important] [&>pre,_&_code]:border-none [&_code]:!text-[13px]",
                    fillHeight ? "h-full items-start" : "items-center",
                  )}
                  dangerouslySetInnerHTML={{ __html: val }}
                />
              </TabsContent>
            ))}
        </TabsContents>
      </div>
    </TabsContext.Provider>
  );
}

export { CodeTabs, type CodeTabsProps };
