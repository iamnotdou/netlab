"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { CATEGORY_LABELS, type CategoryId } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  group: string;
  href: string;
  /** Extra terms to match against beyond the visible label. */
  keywords?: string;
}

const ITEMS: CommandItem[] = [
  { id: "home", label: "Home", group: "Navigate", href: "/", keywords: "landing start" },
  ...MODULES.map((m) => ({
    id: m.slug,
    label: m.title,
    group: "Labs",
    href: m.href,
    keywords: `${m.tagline} ${m.topics.join(" ")} ${m.chapter}`,
  })),
  { id: "quiz", label: "Quiz Arena", group: "Quiz", href: "/quiz", keywords: "test exam questions" },
  {
    id: "quiz-mixed",
    label: "Mixed Challenge",
    group: "Quiz",
    href: "/quiz/mixed",
    keywords: "random all categories 25",
  },
  ...(Object.keys(CATEGORY_LABELS) as CategoryId[]).map((id) => ({
    id: `quiz-${id}`,
    label: `Quiz · ${CATEGORY_LABELS[id]}`,
    group: "Quiz",
    href: `/quiz/${id}`,
    keywords: id,
  })),
  {
    id: "dashboard",
    label: "Dashboard",
    group: "Navigate",
    href: "/dashboard",
    keywords: "stats progress history score",
  },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter((it) =>
      `${it.label} ${it.group} ${it.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const go = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      close();
      router.push(item.href);
    },
    [close, router],
  );

  // Global hotkeys: ⌘K / Ctrl+K toggles, "/" opens when not already typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (!open && k === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("netlab:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("netlab:open-command", onOpen);
    };
  }, [open]);

  // Focus the input and reset selection each time the palette opens.
  useEffect(() => {
    if (open) {
      setActive(0);
      // Defer so the input is mounted before we focus it.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Keep the active row clamped and scrolled into view as results change.
  useEffect(() => {
    if (active > results.length - 1) setActive(Math.max(0, results.length - 1));
  }, [results, active]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-glow)]"
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search labs, quizzes, pages…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:block">
                ESC
              </kbd>
            </div>

            <div ref={listRef} className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No matches for “{query}”.
                </p>
              ) : (
                results.map((it, i) => {
                  const showGroup = it.group !== lastGroup;
                  lastGroup = it.group;
                  return (
                    <div key={it.id}>
                      {showGroup && (
                        <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1">
                          {it.group}
                        </p>
                      )}
                      <button
                        type="button"
                        data-index={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(it)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                          i === active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                        )}
                      >
                        <span>{it.label}</span>
                        {i === active && <CornerDownLeft className="h-3.5 w-3.5 opacity-80" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ArrowUp className="h-3 w-3" />
                <ArrowDown className="h-3 w-3" /> navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeft className="h-3 w-3" /> open
              </span>
              <span className="ml-auto inline-flex items-center gap-1">
                <kbd className="rounded border border-border px-1 py-0.5">⌘K</kbd> toggle
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
