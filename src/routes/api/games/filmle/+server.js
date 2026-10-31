import { FILMLE_GUESSES, compareFilms } from '#lib/games/filmle.js';
import { dayKey, dayNumber, isLiveDay } from '#lib/games/seed.js';
import { parseId } from '#lib/media.js';
import { filmFacts, filmlePuzzle } from '#lib/server/dailyGames.js';

const unavailable = () => Response.json({ message: 'Unavailable' }, { status: 503 });

function hintFor(attempt, answer) {
	if (attempt + 1 === 5) {
		const tagline = answer.tagline;
		const safe = tagline && !tagline.toLowerCase().includes(answer.title.toLowerCase());
		return safe ? `“${tagline}”` : `The title has ${answer.title.split(' ').length} words`;
	}
	if (attempt + 1 === 8) return `The title starts with “${answer.title[0]}”`;
	return null;
}

export async function GET() {
	const key = dayKey();
	return Response.json(
		{ key, number: dayNumber(key), total: FILMLE_GUESSES },
		{ headers: { 'cache-control': 'no-store' } }
	);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	const id = parseId(String(body?.id ?? ''));
	if (!id) return Response.json({ message: 'Invalid film' }, { status: 400 });

	const key = isLiveDay(body?.key) ? body.key : dayKey();
	const [answer, guess] = await Promise.all([filmlePuzzle(key), filmFacts(id)]);
	if (!answer || !guess) return unavailable();

	const attempt = Number(body?.attempt) || 0;
	const correct = id === answer.id;
	const finished = correct || attempt >= FILMLE_GUESSES - 1;
	return Response.json({
		correct,
		finished,
		guess: { id, title: guess.title, poster_path: guess.poster_path },
		compare: compareFilms(guess, answer),
		hint: correct ? null : hintFor(attempt, answer),
		answer: finished
			? {
					id: answer.id,
					title: answer.title,
					date: answer.date,
					poster_path: answer.poster_path,
					backdrop_path: answer.backdrop_path
				}
			: null
	});
}
