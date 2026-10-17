import type { Game } from "@/lib/db/schema";
import { formatCount, formatRating, formatUsd } from "@/lib/games/format";
import { DeleteGameButton } from "./DeleteGameButton";
import { GameForm } from "./GameForm";

const COLUMNS = [
  { label: "Title" },
  { label: "Developer" },
  { label: "Genre" },
  { label: "Monthly revenue", numeric: true },
  { label: "Downloads", numeric: true },
  { label: "Rating", numeric: true },
  { label: "Actions", numeric: true, hidden: true },
];

export function GamesTable({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">No games yet</p>
        <p className="mt-1 text-sm">Add your first game to start tracking the catalog.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
          <tr>
            {COLUMNS.map(({ label, numeric, hidden }) => (
              <th key={label} scope="col" className={`whitespace-nowrap px-3 py-3 font-medium ${numeric ? "text-right" : ""}`}>
                {hidden ? <span className="sr-only">{label}</span> : label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {games.map((game) => (
            <tr key={game.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="px-3 py-3 font-medium">{game.title}</td>
              <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{game.developer}</td>
              <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400">{game.genre}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatUsd(game.monthly_revenue_usd)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatCount(game.monthly_downloads)}</td>
              <td className="px-3 py-3 text-right tabular-nums">{formatRating(game.average_rating)}</td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <GameForm mode="edit" game={game} />
                  <DeleteGameButton id={game.id} title={game.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
