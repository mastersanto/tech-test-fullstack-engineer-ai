"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteGameButton({ id, title }: { id: number; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/games/${id}`, { method: "DELETE" });
      if (response.status === 404) window.alert("This game no longer exists.");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={deleting}
      className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
    >
      {deleting ? "Deleting…" : "Delete"}
      <span className="sr-only"> {title}</span>
    </button>
  );
}
