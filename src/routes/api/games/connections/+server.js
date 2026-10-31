import { dayKey, dayNumber, hashString, isLiveDay, seededShuffle } from '#lib/games/seed.js';
import { connectionsPuzzle } from '#lib/server/games.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });
const publicGroup = ({ label, level, films }) => ({ label, level, films });

export async function GET() {
	const key = dayKey();
	const puzzle = await connectionsPuzzle(key);
	if (!puzzle) return unavailable();

	const tiles = seededShuffle(
		puzzle.groups.flatMap((group) => group.films),
		hashString(`tiles:${key}`)
	);
	return Response.json(
		{ key, number: dayNumber(key), tiles },
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const puzzle = await connectionsPuzzle(isLiveDay(body?.key) ? body.key : dayKey());
	if (!puzzle) return unavailable();

	if (body?.hint) {
		const found = new Set(body.found ?? []);
		const next = puzzle.groups.find((group) => !found.has(group.level));
		return Response.json({ label: next?.label ?? null, level: next?.level ?? null });
	}

	if (body?.reveal) return Response.json({ groups: puzzle.groups.map(publicGroup) });

	const ids = new Set((body?.ids ?? []).map(Number));
	const overlaps = puzzle.groups.map(
		(group) => group.films.filter((film) => ids.has(film.id)).length
	);
	const match = overlaps.indexOf(4);
	return Response.json({
		correct: match >= 0,
		oneAway: match < 0 && overlaps.includes(3),
		group: match >= 0 ? publicGroup(puzzle.groups[match]) : null
	});
}
