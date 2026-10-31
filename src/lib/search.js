const clean = (text) => (text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

/** Higher is better: exact title, then prefix, then a word prefix, then anywhere, then no match. */
export function matchScore(title, query) {
	const name = clean(title);
	const needle = clean(query);
	if (!needle || !name) return 0;
	if (name === needle) return 4;
	if (name.startsWith(needle)) return 3;
	if (name.split(/[\s:,-]+/).some((word) => word.startsWith(needle))) return 2;
	return name.includes(needle) ? 1 : 0;
}

/** Normalizes a TMDB multi-search hit or a database row into one search result shape. */
export function toResult(raw, fallbackType) {
	const type = raw.media_type ?? fallbackType;
	if (raw.id == null || !['movie', 'tv', 'person'].includes(type)) return null;
	return {
		id: raw.id,
		type,
		title: raw.title || raw.name || '',
		image: raw.poster_path ?? raw.profile_path ?? null,
		date: raw.release_date || raw.first_air_date || '',
		detail: raw.known_for_department || '',
		popularity: Number(raw.popularity) || 0
	};
}

/** Merges sources, removes duplicates and ranks by relevance first and popularity second. */
export function rankResults(results, query, limit = 8) {
	const unique = new Map();
	for (const result of results) {
		if (!result?.title) continue;
		const key = `${result.type}:${result.id}`;
		const existing = unique.get(key);
		unique.set(
			key,
			existing ? { ...result, ...existing, image: existing.image ?? result.image } : result
		);
	}

	return [...unique.values()]
		.map((result) => ({ result, score: matchScore(result.title, query) }))
		.sort((a, b) => b.score - a.score || b.result.popularity - a.result.popularity)
		.slice(0, limit)
		.map(({ result }) => result);
}

export function resultHref(result) {
	const section = { movie: 'movie', tv: 'series', person: 'person' }[result.type];
	return `/${section}/${result.id}`;
}

export function resultLabel(result) {
	if (result.type === 'person') return result.detail || 'Person';
	const kind = result.type === 'tv' ? 'Series' : 'Movie';
	const year = /^\d{4}/.exec(result.date ?? '')?.[0];
	return year ? `${kind} · ${year}` : kind;
}

/** Escapes characters that have a special meaning in a PostgREST `ilike` pattern. */
export function ilikePattern(query) {
	return `%${query.replace(/[\\%_]/g, '\\$&')}%`;
}
