import { normalizeList } from '#lib/media.js';
import { PAGE_SIZE, parsePage } from '#lib/pagination.js';
import { db } from '#lib/server/supabase.js';
import { redirect } from '@sveltejs/kit';

const SORTS = {
	popular: { column: 'popularity', ascending: false },
	newest: { column: 'release_date', ascending: false },
	title: { column: 'title', ascending: true }
};

export async function load({ url }) {
	const page = parsePage(url.searchParams.get('page'));
	const sort = SORTS[url.searchParams.get('sort')] ? url.searchParams.get('sort') : 'popular';
	const { column, ascending } = SORTS[sort];
	const failed = { movies: [], page, sort, totalPages: 0, count: 0, failed: true };

	const client = db();
	if (!client) return failed;

	const from = (page - 1) * PAGE_SIZE;
	const { data, count, error } = await client
		.from('films')
		.select('*', { count: 'exact' })
		.order(column, { ascending, nullsFirst: false })
		// The id tie-breaker keeps pages stable when many rows share a value.
		.order('id', { ascending: true })
		.range(from, from + PAGE_SIZE - 1);

	if (error) {
		// PostgREST answers 416 past the last row, so send people to the real last page.
		if (error.code === 'PGRST103') {
			const { count: total } = await client
				.from('films')
				.select('id', { count: 'exact', head: true });
			const last = Math.max(Math.ceil((total ?? 0) / PAGE_SIZE), 1);
			redirect(307, `/library?${new URLSearchParams({ sort, page: String(last) })}`);
		}
		console.error('Loading library failed:', error.message);
		return failed;
	}

	const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

	return { movies: normalizeList(data), page, sort, totalPages, count: count ?? 0, failed: false };
}
