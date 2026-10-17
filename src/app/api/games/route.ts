import { readGameInput } from "@/lib/api/http";
import { getRepository } from "@/lib/games/repository";

export async function POST(request: Request) {
  const input = await readGameInput(request);
  if (!input.ok) return input.response;
  return Response.json(getRepository().createGame(input.data), { status: 201 });
}
