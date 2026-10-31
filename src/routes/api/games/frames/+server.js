import { dayKey, dayNumber, isLiveDay } from '#lib/games/seed.js';
import { framesPuzzle } from '#lib/server/games.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

/** Only the stills earned so far are sent, and the answer stays here until the game ends. */
export async function GET({ url }) {
	const asked = url.searchParams.get('key');
	const key = isLiveDay(asked) ? asked : dayKey();
	const puzzle = await framesPuzzle(key);
	if (!puzzle) return unavailable();

	const attempt = Math.max(Number(url.searchParams.get('attempt')) || 0, 0);
	return Response.json(
		{
			key,
			number: dayNumber(key),
			total: puzzle.stills.length,
			stills: puzzle.stills.slice(0, attempt + 1),
			// Two small nudges for anyone still stuck after a few frames.
			year: attempt >= 2 ? puzzle.year : null,
			genres: attempt >= 4 ? puzzle.genres : []
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const puzzle = await framesPuzzle(isLiveDay(body?.key) ? body.key : dayKey());
	if (!puzzle) return unavailable();

	const attempt = Number(body?.attempt) || 0;
	const correct = Number(body?.id) === puzzle.id;
	const finished = correct || attempt >= puzzle.stills.length - 1;
	return Response.json({ correct, finished, answer: finished ? puzzle.answer : null });
}
