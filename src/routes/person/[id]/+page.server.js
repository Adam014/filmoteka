import { buildPerson, parseId } from '#lib/media.js';
import { safeQuery } from '#lib/server/catalog.js';
import { tmdbDetail } from '#lib/server/tmdb.js';
import { error } from '@sveltejs/kit';

export async function load({ params }) {
	const id = parseId(params.id);
	if (!id) error(404, "We don't have anyone at this address.");

	const [{ data: live, notFound }, stored] = await Promise.all([
		tmdbDetail(`/person/${id}`, { append_to_response: 'combined_credits,external_ids' }),
		safeQuery((client) => client.from('person_detailed').select('*').eq('id', id).maybeSingle())
	]);

	const person = buildPerson(stored, live);
	if (!person) {
		if (notFound) error(404, "We don't have anyone at this address.");
		error(503, 'This profile is unavailable right now.');
	}
	return { person };
}
