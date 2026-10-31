import { normalizeList } from '../media.js';
import { db } from './supabase.js';
import { tmdb, tmdbList } from './tmdb.js';

const FEATURED_COUNT = 9;
const PERSON_COLUMNS = 'id, name, profile_path, popularity, known_for_department';

/** Database query that reports failure as null instead of throwing. */
export async function safeQuery(run) {
	const client = db();
	if (!client) return null;
	try {
		const { data, error } = await run(client);
		if (error) {
			console.error('Database query failed:', error.message);
			return null;
		}
		return data;
	} catch (error) {
		console.error('Database query failed:', error.message);
		return null;
	}
}

async function backdropFor(id) {
	const images = await tmdb(`/movie/${id}/images`);
	return images?.backdrops?.[0]?.file_path ?? null;
}

/** Most popular titles in the database with artwork, or trending ones if the database is empty. */
export async function featuredMovies(trending) {
	const rows = await safeQuery((client) =>
		client.from('films').select('*').order('popularity', { ascending: false }).limit(FEATURED_COUNT)
	);
	if (!rows?.length) return trending.filter((item) => item.backdrop_path).slice(0, FEATURED_COUNT);

	const details = await safeQuery((client) =>
		client
			.from('film_detailed')
			.select('id, overview')
			.in(
				'id',
				rows.map((row) => row.id)
			)
	);
	const detailById = new Map((details ?? []).map((detail) => [detail.id, detail]));

	const movies = await Promise.all(
		normalizeList(rows).map(async (movie) => ({
			...movie,
			overview: detailById.get(movie.id)?.overview || movie.overview,
			backdrop_path: movie.backdrop_path || (await backdropFor(movie.id))
		}))
	);
	return movies.filter((movie) => movie.backdrop_path);
}

/** Popular actors from the database, or from TMDB if the database has none. */
export async function popularActors(limit = 12) {
	const rows = await safeQuery((client) =>
		client
			.from('person_detailed')
			.select(PERSON_COLUMNS)
			.eq('known_for_department', 'Acting')
			.not('movies', 'is', null)
			.order('popularity', { ascending: false })
			.limit(limit)
	);
	if (rows?.length) return rows;
	return tmdbList('/person/popular', {}, limit);
}

/** Upcoming lists from TMDB also contain recent releases, so anything already out is dropped. */
export function onlyUpcoming(list, today = new Date().toISOString().slice(0, 10)) {
	return list.filter((item) => item.date && item.date >= today);
}
