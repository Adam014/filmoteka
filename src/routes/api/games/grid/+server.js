import { GRID_GUESSES, fitsColumn } from '#lib/games/grid.js';
import { dayKey, dayNumber, isLiveDay } from '#lib/games/seed.js';
import { parseId } from '#lib/media.js';
import { filmFacts, gridPuzzle } from '#lib/server/dailyGames.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

export async function GET() {
	const key = dayKey();
	const puzzle = await gridPuzzle(key);
	if (!puzzle) return unavailable();
	return Response.json(
		{
			key,
			number: dayNumber(key),
			total: GRID_GUESSES,
			rows: puzzle.rows,
			columns: puzzle.columns
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

/** Checks a film against one square, or hands out example answers once the game is over. */
export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const puzzle = await gridPuzzle(isLiveDay(body?.key) ? body.key : dayKey());
	if (!puzzle) return unavailable();
	if (body?.reveal) return Response.json({ examples: puzzle.examples });

	const row = puzzle.rows[Number(body?.row)];
	const column = puzzle.columnRules[Number(body?.column)];
	const id = parseId(String(body?.id ?? ''));
	if (!row || !column || !id) return Response.json({ message: 'Invalid guess' }, { status: 400 });

	const film = await filmFacts(id);
	if (!film) return unavailable();
	const correct =
		film.castIds.includes(row.id) && fitsColumn({ genres: film.genreIds, date: film.date }, column);
	return Response.json({
		correct,
		film: { id: film.id, title: film.title, poster_path: film.poster_path }
	});
}
