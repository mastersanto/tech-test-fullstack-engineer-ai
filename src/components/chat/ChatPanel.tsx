"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChatView } from "./ChatView";

const WIDE_QUERY = "(min-width: 1024px)";

/** Drawer state shared by the panel and the "Ask AI" button. Not remembered across reloads. */
export function useChatPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const askButtonRef = useRef<HTMLButtonElement>(null);
  return { drawerOpen, setDrawerOpen, inputRef, askButtonRef };
}

export type ChatPanelState = ReturnType<typeof useChatPanel>;

function subscribeToWidth(onChange: () => void) {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Only used for ARIA/inert attributes; the chat itself is never mounted or unmounted by width. */
function useIsWide() {
  return useSyncExternalStore(
    subscribeToWidth,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  );
}

const quietButton =
  "rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

/**
 * The single chat instance on the page. From 1024 px it is a sticky column beside the table,
 * always shown; below that it is a drawer over the page. Both are CSS states of the same
 * element, so the conversation survives table edits and resizing across the breakpoint.
 */
export function ChatPanel({ state }: { state: ChatPanelState }) {
  const { drawerOpen, setDrawerOpen, inputRef, askButtonRef } = state;
  const isWide = useIsWide();
  const wasOpen = useRef(false);

  // Focus the input when the drawer opens; return focus to "Ask AI" when it closes.
  useEffect(() => {
    if (drawerOpen) inputRef.current?.focus();
    else if (wasOpen.current) askButtonRef.current?.focus();
    wasOpen.current = drawerOpen;
  }, [drawerOpen, inputRef, askButtonRef]);

  // Escape closes the drawer, unless a form dialog is open: that Escape belongs to the dialog.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  // /chat redirects to /#chat: reveal the assistant, then drop the hash.
  useEffect(() => {
    if (window.location.hash !== "#chat") return;
    history.replaceState(null, "", window.location.pathname);
    if (window.matchMedia(WIDE_QUERY).matches) inputRef.current?.focus();
    else setDrawerOpen(true);
  }, [inputRef, setDrawerOpen]);

  const isDrawer = !isWide;

  return (
    <>
      {drawerOpen && (
        <div aria-hidden className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setDrawerOpen(false)} />
      )}
      <aside
        id="assistant-panel"
        aria-label="Assistant"
        role={isDrawer && drawerOpen ? "dialog" : undefined}
        aria-modal={isDrawer && drawerOpen ? true : undefined}
        inert={isDrawer && !drawerOpen}
        className={[
          // Below 1024 px: off-canvas drawer.
          "fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col overflow-hidden bg-white shadow-xl transition-transform duration-200 dark:bg-zinc-900",
          drawerOpen ? "translate-x-0" : "translate-x-full",
          // From 1024 px: sticky column beside the table.
          "lg:sticky lg:top-6 lg:bottom-auto lg:z-auto lg:h-[calc(100dvh-7.5rem)] lg:max-w-none lg:translate-x-0 lg:rounded-lg lg:border lg:border-zinc-200 lg:shadow-none lg:transition-none dark:lg:border-zinc-800",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold">Assistant</h2>
            <p className="text-xs text-zinc-500">Answers come from live lookups against the catalog.</p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close assistant"
            className={`text-base lg:hidden ${quietButton}`}
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <ChatView inputRef={inputRef} />
        </div>
      </aside>
    </>
  );
}

/** "Ask AI" opens the drawer on narrow screens; on wide screens the panel is always shown. */
export function ChatToggle({ state }: { state: ChatPanelState }) {
  const { drawerOpen, setDrawerOpen, askButtonRef } = state;
  return (
    <button
      ref={askButtonRef}
      type="button"
      onClick={() => setDrawerOpen(true)}
      aria-controls="assistant-panel"
      aria-expanded={drawerOpen}
      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 lg:hidden dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      Ask AI
    </button>
  );
}
