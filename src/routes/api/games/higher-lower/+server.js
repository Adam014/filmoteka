import { dayKey, dayNumber } from '#lib/games/seed.js';
import { parseId } from '#lib/media.js';
import { higherLowerPuzzle, ratingsOf } from '#lib/server/games.js';

const publicFilm = ({ id, title, date, backdrop_path }) => ({ id, title, date, backdrop_path });

/** Today's pairs, without their ratings. */
export async function GET() {
	const key = dayKey();
	const rounds = await higherLowerPuzzle(key);
	if (!rounds) return Response.json({ message: 'Unavailable' }, { status: 503 });

	return Response.json(
		{
			key,
			number: dayNumber(key),
			rounds: rounds.map(({ a, b }) => ({ a: publicFilm(a), b: publicFilm(b) }))
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}

/** Ratings are only handed out for a pair once the player has picked. */
export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const ids = Array.isArray(body?.ids) ? body.ids.map((id) => parseId(String(id))) : [];
	if (ids.length !== 2 || ids.includes(null)) {
		return Response.json({ message: 'Invalid pair' }, { status: 400 });
	}

	const ratings = await ratingsOf(ids);
	if (!ratings) return Response.json({ message: 'Unavailable' }, { status: 503 });
	return Response.json({ ratings });
}
