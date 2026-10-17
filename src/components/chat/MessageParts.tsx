"use client";

import { getToolName, isTextUIPart, isToolUIPart } from "ai";
import type { ChatMessage } from "@/lib/ai/agent";

type ToolPart = Extract<ChatMessage["parts"][number], { toolCallId: string }>;

const TOOL_LABELS: Record<string, { pending: string; done: string }> = {
  search_games: { pending: "Searching games", done: "Searched games" },
  rank_games: { pending: "Ranking games", done: "Ranked games" },
  count_games: { pending: "Counting games", done: "Counted games" },
  get_games: { pending: "Fetching games", done: "Fetched games" },
};

function describeInput(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  return Object.entries(input)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" · ");
}

function ToolChip({ part }: { part: ToolPart }) {
  const name = getToolName(part);
  const labels = TOOL_LABELS[name] ?? { pending: `Running ${name}`, done: `Ran ${name}` };
  const details = describeInput(part.input);

  if (part.state === "output-error") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        <span aria-hidden>⚠</span>
        <span className="font-medium">{labels.pending} failed</span>
        <span className="truncate">{part.errorText}</span>
      </div>
    );
  }

  const done = part.state === "output-available";
  return (
    <div className="flex max-w-full items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {done ? (
        <span aria-hidden className="text-emerald-600 dark:text-emerald-400">✓</span>
      ) : (
        <span aria-hidden className="size-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      )}
      <span className="font-medium">{done ? labels.done : `${labels.pending}…`}</span>
      {details && <span className="truncate font-mono text-zinc-500 dark:text-zinc-400">{details}</span>}
    </div>
  );
}

/** Text parts as paragraphs; tool calls as lookup chips so the user sees where answers come from. */
export function MessageParts({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col gap-2">
      {message.parts.map((part, index) => {
        if (isToolUIPart(part)) return <ToolChip key={part.toolCallId} part={part} />;
        if (isTextUIPart(part) && part.text.trim()) {
          return (
            <p key={index} className="whitespace-pre-wrap leading-relaxed">
              {part.text}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
