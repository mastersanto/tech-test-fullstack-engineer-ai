"use client";

import type { ReactNode } from "react";
import { ChatPanel, ChatToggle, useChatPanel } from "@/components/chat/ChatPanel";
import { GameForm } from "@/components/games/GameForm";

/**
 * Home page frame: catalog on the left, assistant on the right. The catalog arrives as
 * `children` (a server component), so refreshing it after an edit never remounts ChatPanel
 * and the conversation is kept.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const chat = useChatPanel();
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Games catalog</h1>
            <p className="mt-1 text-sm text-zinc-500">Monthly revenue, downloads and ratings for every tracked title.</p>
          </div>
          <div className="flex gap-2">
            <ChatToggle state={chat} />
            <GameForm mode="create" />
          </div>
        </div>
        {children}
      </div>
      <ChatPanel state={chat} />
    </div>
  );
}
