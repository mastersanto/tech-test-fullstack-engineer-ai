import type { Metadata } from "next";
import { ChatView } from "@/components/chat/ChatView";

export const metadata: Metadata = { title: "Chat · Indie Games Dashboard" };

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ask the catalog</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Answers come from live lookups against the catalog. Each lookup is shown above the answer.
        </p>
      </div>
      <ChatView />
    </div>
  );
}
