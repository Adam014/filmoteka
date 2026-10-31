import { dayKey, isLiveDay } from '#lib/games/seed.js';
import { earwormPuzzle, soundtrackPuzzle } from '#lib/server/dailyGames.js';
import { clipRedirect } from '#lib/server/deezer.js';

const PUZZLES = { soundtrack: soundtrackPuzzle, earworm: earwormPuzzle };

export async function GET({ url }) {
	const puzzleFor = PUZZLES[url.searchParams.get('game')];
	if (!puzzleFor) return Response.json({ message: 'Unknown game' }, { status: 404 });

	const key = url.searchParams.get('key');
	const puzzle = await puzzleFor(isLiveDay(key) ? key : dayKey());
	const round = puzzle?.rounds[Number(url.searchParams.get('round'))];
	if (!round) return Response.json({ message: 'Unavailable' }, { status: 503 });
	return clipRedirect(round.trackId);
}
