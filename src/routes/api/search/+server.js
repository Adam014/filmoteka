import { ilikePattern, rankResults, toResult } from '#lib/search.js';
import { safeQuery } from '#lib/server/catalog.js';
import { tmdb, tmdbList } from '#lib/server/tmdb.js';

const SHORT_CACHE = 60 * 1000;

function respond(results) {
	return Response.json({ results }, { headers: { 'cache-control': 'private, max-age=60' } });
}

async function trending() {
	const list = await tmdbList('/trending/all/week', {}, 6);
	return list.map((item) => toResult(item)).filter(Boolean);
}

export async function GET({ url }) {
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	const onlyMovies = url.searchParams.get('type') === 'movie';

	if (!query) return respond(onlyMovies ? [] : await trending());

	const pattern = ilikePattern(query);
	const [remote, films, people] = await Promise.all([
		tmdb(
			onlyMovies ? '/search/movie' : '/search/multi',
			{ query, language: 'en-US', include_adult: 'false' },
			SHORT_CACHE
		),
		safeQuery((client) =>
			client
				.from('films')
				.select('id, title, poster_path, popularity, release_date')
				.ilike('title', pattern)
				.order('popularity', { ascending: false })
				.limit(8)
		),
		onlyMovies
			? null
			: safeQuery((client) =>
					client
						.from('person_detailed')
						.select('id, name, profile_path, popularity, known_for_department')
						.ilike('name', pattern)
						.order('popularity', { ascending: false })
						.limit(8)
				)
	]);

	const results = [
		...(remote?.results ?? []).map((item) => toResult(item, onlyMovies ? 'movie' : undefined)),
		...(films ?? []).map((item) => toResult(item, 'movie')),
		...(people ?? []).map((item) => toResult(item, 'person'))
	];

	return respond(rankResults(results, query, onlyMovies ? 6 : 8));
}
