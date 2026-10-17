"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { flattenFieldErrors, gameInputSchema, type FieldErrors, type Game, type GameInput } from "@/lib/db/schema";

type Field = { name: keyof GameInput; label: string; step?: string };

const FIELDS: Field[] = [
  { name: "title", label: "Title" },
  { name: "developer", label: "Developer" },
  { name: "genre", label: "Genre" },
  { name: "monthly_revenue_usd", label: "Monthly revenue (USD)", step: "0.01" },
  { name: "monthly_downloads", label: "Monthly downloads", step: "1" },
  { name: "average_rating", label: "Average rating (0–5)", step: "0.1" },
];

type Values = Record<keyof GameInput, string>;

const EMPTY: Values = {
  title: "",
  developer: "",
  genre: "",
  monthly_revenue_usd: "",
  monthly_downloads: "",
  average_rating: "",
};

function toValues(game?: Game): Values {
  if (!game) return EMPTY;
  return Object.fromEntries(FIELDS.map(({ name }) => [name, String(game[name])])) as Values;
}

/** Blank numeric inputs become undefined so the schema reports them with the field's rule. */
function toInput(values: Values): Record<string, unknown> {
  const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));
  return {
    title: values.title,
    developer: values.developer,
    genre: values.genre,
    monthly_revenue_usd: toNumber(values.monthly_revenue_usd),
    monthly_downloads: toNumber(values.monthly_downloads),
    average_rating: toNumber(values.average_rating),
  };
}

type Props = { mode: "create"; game?: undefined } | { mode: "edit"; game: Game };

export function GameForm({ mode, game }: Props) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Values>(() => toValues(game));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function open() {
    setValues(toValues(game));
    setErrors({});
    setFormError(null);
    dialogRef.current?.showModal();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = gameInputSchema.safeParse(toInput(values));
    if (!parsed.success) {
      setErrors(flattenFieldErrors(parsed.error));
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError(null);
    try {
      const response = await fetch(mode === "edit" ? `/api/games/${game.id}` : "/api/games", {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        dialogRef.current?.close();
        router.refresh();
        return;
      }
      const { error } = await response.json();
      if (response.status === 404) {
        setFormError("This game no longer exists.");
        router.refresh();
      } else {
        setErrors(error.fields ?? {});
        setFormError(error.fields ? null : error.message);
      }
    } catch {
      setFormError("Could not reach the server. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {mode === "create" ? (
        <button
          type="button"
          onClick={open}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add game
        </button>
      ) : (
        <button
          type="button"
          onClick={open}
          className="rounded-md px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          Edit<span className="sr-only"> {game.title}</span>
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-lg bg-white p-0 text-left text-zinc-900 shadow-xl dark:bg-zinc-900 dark:text-zinc-100"
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">{mode === "edit" ? `Edit ${game.title}` : "Add game"}</h2>

          {FIELDS.map(({ name, label, step }) => {
            const message = errors[name]?.[0];
            return (
              <label key={name} className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{label}</span>
                <input
                  name={name}
                  type={step ? "number" : "text"}
                  step={step}
                  min={step ? 0 : undefined}
                  value={values[name]}
                  onChange={(event) => setValues({ ...values, [name]: event.target.value })}
                  aria-invalid={Boolean(message)}
                  className={`rounded-md border px-3 py-2 tabular-nums dark:bg-zinc-950 ${
                    message ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
                  }`}
                />
                {message && <span className="text-xs text-red-600 dark:text-red-400">{message}</span>}
              </label>
            );
          })}

          {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
