import { buildSeries, parseId } from '#lib/media.js';
import { tmdbDetail } from '#lib/server/tmdb.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const id = parseId(params.id);
	if (!id) error(404, "We don't have a series at this address.");

	const { data, notFound } = await tmdbDetail(`/tv/${id}`, {
		append_to_response: 'credits,videos,external_ids'
	});
	const series = buildSeries(data);
	if (!series) {
		if (notFound) error(404, "We don't have a series at this address.");
		error(503, 'Series details are unavailable right now.');
	}
	return { series };
}
