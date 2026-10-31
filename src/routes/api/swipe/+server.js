import { normalizeList } from '#lib/media.js';
import { tmdbList } from '#lib/server/tmdb.js';

const MAX_PAGE = 40;

export async function GET({ url }) {
	const page = Math.floor(Math.random() * MAX_PAGE) + 1;
	const seen = new Set((url.searchParams.get('seen') ?? '').split(',').map(Number));

	const list = await tmdbList('/discover/movie', {
		sort_by: 'popularity.desc',
		include_adult: 'false',
		'vote_count.gte': 500,
		page
	});
	const movies = normalizeList(list)
		.filter((movie) => movie.poster_path && !seen.has(movie.id))
		.map((movie) => [Math.random(), movie])
		.sort((a, b) => a[0] - b[0])
		.map(([, movie]) => movie);
	return Response.json({ movies }, { headers: { 'cache-control': 'no-store' } });
}
