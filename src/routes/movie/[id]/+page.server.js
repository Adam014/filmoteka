import { buildMovie, parseId } from '#lib/media.js';
import { safeQuery } from '#lib/server/catalog.js';
import { tmdbDetail } from '#lib/server/tmdb.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const id = parseId(params.id);
	if (!id) error(404, "We don't have a movie at this address.");

	const [{ data: live, notFound }, stored] = await Promise.all([
		tmdbDetail(`/movie/${id}`, { append_to_response: 'credits,videos,external_ids' }),
		safeQuery((client) =>
			client.from('film_detailed').select('*, films(poster_path)').eq('id', id).maybeSingle()
		)
	]);

	const movie = buildMovie(
		stored && { ...stored, poster_path: stored.poster_path ?? stored.films?.poster_path },
		live
	);
	if (!movie) {
		if (notFound) error(404, "We don't have a movie at this address.");
		error(503, 'Movie details are unavailable right now.');
	}
	return { movie };
}
