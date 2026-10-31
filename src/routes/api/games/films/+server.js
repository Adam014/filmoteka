import { FRAME_FILMS } from '#lib/games/pool.js';
import { cached } from '#lib/server/cache.js';
import { EMOJI_FILMS } from '#lib/server/emojiFilms.js';
import { SOUNDTRACKS } from '#lib/server/soundtracks.js';
import { db } from '#lib/server/supabase.js';
import { tmdbRequest } from '#lib/server/tmdb.js';

const DAY = 24 * 60 * 60 * 1000;
const DB_PAGE = 1000;
const DB_FILMS = 20000;
const FAMOUS_PAGES = 150;
const AT_ONCE = 8;

const row = (film) => [film.id, film.title, Number(film.release_date?.slice(0, 4)) || 0];

/** Runs `work` over a list, a few at a time. */
async function inTurns(list, work) {
	const queue = [...list];
	const results = [];
	const worker = async () => {
		while (queue.length) results.push(await work(queue.shift()));
	};
	await Promise.all(Array.from({ length: AT_ONCE }, worker));
	return results;
}

/** The films most people know: those with the most votes on TMDB, most voted first. */
async function famousFilms() {
	const pages = await inTurns(
		Array.from({ length: FAMOUS_PAGES }, (_, index) => index + 1),
		async (page) => {
			const { data } = await tmdbRequest('/discover/movie', {
				sort_by: 'vote_count.desc',
				include_adult: 'false',
				language: 'en-US',
				page
			});
			return { page, films: data?.results ?? [] };
		}
	);
	return pages.sort((a, b) => a.page - b.page).flatMap(({ films }) => films.map(row));
}

async function catalogueFilms() {
	const client = db();
	if (!client) return [];
	const films = [];
	for (let from = 0; from < DB_FILMS; from += DB_PAGE) {
		const { data, error } = await client
			.from('films')
			.select('id, title, release_date')
			.not('title', 'is', null)
			.order('popularity', { ascending: false })
			.order('id')
			.range(from, from + DB_PAGE - 1);
		if (error) {
			console.error('Reading the film list failed:', error.message);
			break;
		}
		films.push(...data.map(row));
		if (data.length < DB_PAGE) break;
	}
	return films;
}

/** Whatever a game can have as its answer has to be findable, however obscure. */
async function answerFilms(known) {
	const ids = new Set([
		...FRAME_FILMS,
		...SOUNDTRACKS.map((item) => item.film),
		...EMOJI_FILMS.map((item) => item.film)
	]);
	const missing = [...ids].filter((id) => !known.has(id));
	const films = await inTurns(missing, async (id) => {
		const { data } = await tmdbRequest(`/movie/${id}`, { language: 'en-US' });
		return data?.title ? row(data) : null;
	});
	return films.filter(Boolean);
}

async function readFilms() {
	const [famous, catalogue] = await Promise.all([famousFilms(), catalogueFilms()]);
	const unique = new Map();
	for (const film of [...famous, ...catalogue]) {
		if (!unique.has(film[0])) unique.set(film[0], film);
	}
	const answers = await answerFilms(new Set(unique.keys()));
	const films = [...unique.values(), ...answers];
	return films.length ? { films, famous: famous.length } : null;
}

/** Best known films first, for the search in the guessing games. */
export async function GET() {
	const list = await cached('game-film-list', DAY, readFilms);
	if (!list) return Response.json({ message: 'Unavailable' }, { status: 503 });
	return Response.json(list, {
		headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400' }
	});
}
