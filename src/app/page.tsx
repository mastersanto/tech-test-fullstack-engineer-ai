import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { GamesTable } from "@/components/games/GamesTable";
import { getRepository } from "@/lib/games/repository";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading games…</p>}>
        <Catalog />
      </Suspense>
    </DashboardShell>
  );
}

async function Catalog() {
  // better-sqlite3 is synchronous: without this the query would run once at build time.
  await connection();
  const games = getRepository().listGames();
  return (
    <div className="flex flex-col gap-2">
      <GamesTable games={games} />
      <p className="text-xs text-zinc-500">
        {games.length} {games.length === 1 ? "game" : "games"}
      </p>
    </div>
  );
}
