"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import type { ChatMessage } from "@/lib/ai/agent";
import { MessageParts } from "./MessageParts";

const MAX_LENGTH = 2000;
const COUNTER_FROM = 1800;

const SUGGESTIONS = [
  "Which game made the most revenue last month?",
  "How many games are rated above 4?",
  "Compare revenue of Hollow Depths vs Stardust Farm.",
];

/** Route errors arrive as the JSON body text; show their message rather than raw JSON. */
function errorMessage(error: Error): string {
  try {
    return JSON.parse(error.message).error.message;
  } catch {
    return error.message || "Something went wrong.";
  }
}

export function ChatView({ inputRef }: { inputRef?: Ref<HTMLInputElement> }) {
  const { messages, sendMessage, status, error, stop, regenerate } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !busy;

  // Scroll the message list itself; scrollIntoView would also scroll the page around the panel.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, status]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    sendMessage({ text: text.trim() });
    setInput("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  const lastMessage = messages.at(-1);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 && (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-sm text-zinc-500">
              Ask about revenue, downloads, ratings, genres or developers. The assistant looks up the live catalog for
              every answer.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                message.role === "user"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              <MessageParts message={message} />
              {status === "error" && message.role === "assistant" && message === lastMessage && (
                <p className="mt-1 text-xs italic text-zinc-500">Incomplete answer</p>
              )}
            </div>
          </div>
        ))}

        {status === "submitted" && <p className="text-sm text-zinc-500">Thinking…</p>}

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            <span>{errorMessage(error)}</span>
            <button
              type="button"
              onClick={() => regenerate()}
              className="shrink-0 rounded-md border border-red-300 px-3 py-1 font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-1 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Ask about the games catalog…"
            aria-label="Message"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
          {status === "streaming" ? (
            <button
              type="button"
              onClick={() => stop()}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Send
            </button>
          )}
        </div>
        {input.length >= COUNTER_FROM && (
          <p className="self-end text-xs text-zinc-500 tabular-nums">
            {input.length} / {MAX_LENGTH}
          </p>
        )}
      </form>
    </div>
  );
}
