import { dayKey, dayNumber, isLiveDay } from '../games/seed.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

/** Marks a guess. An answer only goes out once its song is over. */
export function markGuess(puzzle, body, lengths, isClose) {
	const round = puzzle.rounds[Number(body?.round)];
	if (!round) return Response.json({ message: 'Invalid round' }, { status: 400 });

	const id = Number(body?.id);
	const correct = id === round.id;
	const finished = correct || (Number(body?.attempt) || 0) >= lengths.length - 1;
	return Response.json({
		correct,
		finished,
		close: !correct && Boolean(isClose?.(id, round)),
		answer: finished ? round.answer : null
	});
}

/**
 * The API behind a daily game of five songs.
 *
 * @param {string} game
 * @param {(key: string) => Promise<any>} puzzleFor
 * @param {number[]} lengths
 * @param {(id: number, round: any) => boolean} [isClose]
 */
export function listenRoute(game, puzzleFor, lengths, isClose) {
	return {
		async GET() {
			const key = dayKey();
			const puzzle = await puzzleFor(key);
			if (!puzzle) return unavailable();
			return Response.json(
				{
					key,
					number: dayNumber(key),
					lengths,
					rounds: puzzle.rounds.map(({ label, start }, round) => ({
						label,
						start,
						clip: `/api/games/clip?game=${game}&key=${key}&round=${round}`
					}))
				},
				{ headers: { 'cache-control': 'no-store' } }
			);
		},

		async POST({ request }) {
			const body = await request.json().catch(() => null);
			const puzzle = await puzzleFor(isLiveDay(body?.key) ? body.key : dayKey());
			if (!puzzle) return unavailable();
			return markGuess(puzzle, body, lengths, isClose);
		}
	};
}
