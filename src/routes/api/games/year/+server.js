import { dayKey, dayNumber, isLiveDay } from '#lib/games/seed.js';
import { yearPoints } from '#lib/games/year.js';
import { yearPuzzle } from '#lib/server/dailyGames.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

/** Only the stills go out. A film and its year stay here until that round has been guessed. */
export async function GET() {
	const key = dayKey();
	const puzzle = await yearPuzzle(key);
	if (!puzzle) return unavailable();
	return Response.json(
		{ key, number: dayNumber(key), stills: puzzle.rounds.map((round) => round.still) },
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const puzzle = await yearPuzzle(isLiveDay(body?.key) ? body.key : dayKey());
	if (!puzzle) return unavailable();

	const round = puzzle.rounds[Number(body?.round)];
	const guess = Number(body?.year);
	if (!round || !Number.isInteger(guess)) {
		return Response.json({ message: 'Invalid guess' }, { status: 400 });
	}
	return Response.json({
		actual: round.year,
		points: yearPoints(guess, round.year),
		id: round.id,
		title: round.title
	});
}
