import { normalizeList } from '#lib/media.js';
import { db } from '#lib/server/supabase.js';

const ALLOWED_COUNTS = new Set([1, 5, 10, 15, 30]);
const NO_STORE = { headers: { 'cache-control': 'no-store' } };

export async function GET({ url }) {
	const requested = Number(url.searchParams.get('count'));
	const count = ALLOWED_COUNTS.has(requested) ? requested : 5;
	const genre = Number(url.searchParams.get('genre'));

	const client = db();
	if (!client) return Response.json({ message: 'Catalogue unavailable' }, { status: 503 });

	const { data, error } = genre
		? await client.rpc('get_random_movies_by_genre', { count, genre_id: genre })
		: await client.rpc('get_all_random_movies', { count });

	if (error) {
		console.error('Random movies failed:', error.message);
		return Response.json({ message: 'Catalogue unavailable' }, { status: 502 });
	}
	return Response.json({ movies: normalizeList(data) }, NO_STORE);
}
