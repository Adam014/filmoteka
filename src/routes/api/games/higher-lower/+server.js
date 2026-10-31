import { normalizeList } from '#lib/media.js';
import { tmdbList } from '#lib/server/tmdb.js';

const PAGES = [1, 2, 3, 4, 5, 6, 7, 8];

export async function GET() {
	const pages = await Promise.all(
		PAGES.map((page) =>
			tmdbList('/discover/movie', {
				sort_by: 'vote_count.desc',
				include_adult: 'false',
				page
			})
		)
	);
	const movies = normalizeList(pages.flat()).filter((movie) => movie.backdrop_path && movie.rating);
	if (movies.length < 2) return Response.json({ message: 'Unavailable' }, { status: 503 });

	// Fresh order for every game.
	const shuffled = movies
		.map((movie) => [Math.random(), movie])
		.sort((a, b) => a[0] - b[0])
		.map(([, movie]) => ({
			...movie,
			rating: Math.round(movie.rating * 10) / 10,
			overview: ''
		}));
	return Response.json({ movies: shuffled }, { headers: { 'cache-control': 'no-store' } });
}
