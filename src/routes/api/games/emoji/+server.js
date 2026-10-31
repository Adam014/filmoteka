import { dayKey, dayNumber, isLiveDay } from '#lib/games/seed.js';
import { emojiPuzzle } from '#lib/server/dailyGames.js';

const TOTAL = 3;
const SHOWN = [3, 5, 7];
const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

/** Only the emoji earned so far are sent. */
export async function GET({ url }) {
	const asked = url.searchParams.get('key');
	const key = isLiveDay(asked) ? asked : dayKey();
	const puzzle = await emojiPuzzle(key);
	if (!puzzle) return unavailable();
	const attempt = Math.min(Math.max(Number(url.searchParams.get('attempt')) || 0, 0), TOTAL - 1);
	return Response.json(
		{
			key,
			number: dayNumber(key),
			total: TOTAL,
			slots: SHOWN[TOTAL - 1],
			emoji: puzzle.emoji.slice(0, SHOWN[attempt]),
			year: attempt === TOTAL - 1 ? puzzle.year : null
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const puzzle = await emojiPuzzle(isLiveDay(body?.key) ? body.key : dayKey());
	if (!puzzle) return unavailable();
	const attempt = Number(body?.attempt) || 0;
	const correct = Number(body?.id) === puzzle.id;
	const finished = correct || attempt >= TOTAL - 1;
	return Response.json({ correct, finished, answer: finished ? puzzle.answer : null });
}
