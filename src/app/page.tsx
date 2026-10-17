import { connection } from "next/server";
import { Suspense } from "react";
import { GameForm } from "@/components/games/GameForm";
import { GamesTable } from "@/components/games/GamesTable";
import { getRepository } from "@/lib/games/repository";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Games catalog</h1>
          <p className="mt-1 text-sm text-zinc-500">Monthly revenue, downloads and ratings for every tracked title.</p>
        </div>
        <GameForm mode="create" />
      </div>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading games…</p>}>
        <Catalog />
      </Suspense>
    </div>
  );
}

async function Catalog() {
  // better-sqlite3 is synchronous: without this the query would run once at build time.
  await connection();
  const games = getRepository().listGames();
  return (
    <>
      <GamesTable games={games} />
      <p className="text-xs text-zinc-500">
        {games.length} {games.length === 1 ? "game" : "games"}
      </p>
    </>
  );
}
