import { DECADES, filterHref, parseFilters } from '#lib/library-filters.js';
import { normalizeList } from '#lib/media.js';
import { PAGE_SIZE, parsePage } from '#lib/pagination.js';
import { db } from '#lib/server/supabase.js';
import { redirect } from '@sveltejs/kit';

const ORDER = {
	popular: { column: 'popularity', ascending: false },
	newest: { column: 'release_date', ascending: false },
	rating: { column: 'vote_average', ascending: false },
	title: { column: 'title', ascending: true }
};

/** A rating only means something once enough people have voted. */
const MIN_VOTES = 100;

/**
 * `genre_ids` is a plain json column, so each position in the array is checked by hand.
 * The longest list in the catalogue has 9 genres.
 */
const GENRE_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function applyFilters(query, filters) {
	let filtered = query;
	for (const id of filters.genres) {
		filtered = filtered.or(GENRE_SLOTS.map((slot) => `genre_ids->>${slot}.eq.${id}`).join(','));
	}
	const decade = DECADES.find((item) => item.id === filters.decade);
	if (decade?.from)
		filtered = filtered.gte('release_date', decade.from).lte('release_date', decade.to);
	if (filters.rating !== 'any') filtered = filtered.gte('vote_average', Number(filters.rating));
	if (filters.rating !== 'any' || filters.sort === 'rating') {
		filtered = filtered.gte('vote_count', MIN_VOTES);
	}
	return filtered;
}

export async function load({ url }) {
	const page = parsePage(url.searchParams.get('page'));
	const filters = parseFilters(url.searchParams);
	const { column, ascending } = ORDER[filters.sort];
	const failed = { movies: [], page, filters, totalPages: 0, count: 0, failed: true };

	const client = db();
	if (!client) return failed;

	const from = (page - 1) * PAGE_SIZE;
	const { data, count, error } = await applyFilters(
		client.from('films').select('*', { count: 'exact' }),
		filters
	)
		.order(column, { ascending, nullsFirst: false })
		// The id tie-breaker keeps pages stable when many rows share a value.
		.order('id', { ascending: true })
		.range(from, from + PAGE_SIZE - 1);

	if (error) {
		// PostgREST answers 416 past the last row, so send people to the real last page.
		if (error.code === 'PGRST103') {
			const { count: total } = await applyFilters(
				client.from('films').select('id', { count: 'exact', head: true }),
				filters
			);
			const last = Math.max(Math.ceil((total ?? 0) / PAGE_SIZE), 1);
			redirect(307, filterHref(filters, {}, last));
		}
		console.error('Loading library failed:', error.message);
		return failed;
	}

	return {
		movies: normalizeList(data),
		page,
		filters,
		totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
		count: count ?? 0,
		failed: false
	};
}
