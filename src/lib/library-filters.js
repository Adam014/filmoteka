import { GENRES } from './genres.js';

export const SORTS = [
	{ id: 'popular', label: 'Popular' },
	{ id: 'newest', label: 'Newest' },
	{ id: 'rating', label: 'Top rated' },
	{ id: 'title', label: 'A–Z' }
];

export const DECADES = [
	{ id: 'any', label: 'Any' },
	{ id: '2020', label: '2020s', from: '2020-01-01', to: '2029-12-31' },
	{ id: '2010', label: '2010s', from: '2010-01-01', to: '2019-12-31' },
	{ id: '2000', label: '2000s', from: '2000-01-01', to: '2009-12-31' },
	{ id: '1990', label: '1990s', from: '1990-01-01', to: '1999-12-31' },
	{ id: '1980', label: '1980s', from: '1980-01-01', to: '1989-12-31' },
	{ id: '1970', label: '1970s', from: '1970-01-01', to: '1979-12-31' },
	{ id: 'classic', label: 'Older', from: '1800-01-01', to: '1969-12-31' }
];

export const RATINGS = [
	{ id: 'any', label: 'Any' },
	{ id: '6', label: '6+' },
	{ id: '7', label: '7+' },
	{ id: '8', label: '8+' }
];

const MAX_GENRES = 3;

/** Reads filters from a URL, ignoring anything that isn't a real option. */
export function parseFilters(params) {
	const pick = (list, value) => list.find((item) => item.id === value)?.id ?? list[0].id;
	const known = new Set(GENRES.map((genre) => genre.id));
	const genres = [
		...new Set(
			(params.get('genre') ?? '')
				.split(',')
				.map(Number)
				.filter((id) => known.has(id))
		)
	].slice(0, MAX_GENRES);

	return {
		sort: pick(SORTS, params.get('sort')),
		decade: pick(DECADES, params.get('decade')),
		rating: pick(RATINGS, params.get('rating')),
		genres
	};
}

/**
 * Only non-default values, so shared links stay short.
 * @returns {Record<string, string>}
 */
export function filterParams(filters) {
	/** @type {Record<string, string>} */
	const params = {};
	if (filters.sort !== 'popular') params.sort = filters.sort;
	if (filters.genres.length) params.genre = filters.genres.join(',');
	if (filters.decade !== 'any') params.decade = filters.decade;
	if (filters.rating !== 'any') params.rating = filters.rating;
	return params;
}

export function filterHref(filters, changes = {}, page = 1) {
	const query = new URLSearchParams(filterParams({ ...filters, ...changes }));
	if (page > 1) query.set('page', String(page));
	const text = query.toString();
	return text ? `/library?${text}` : '/library';
}

export function toggleGenre(filters, id) {
	return filters.genres.includes(id)
		? filters.genres.filter((genre) => genre !== id)
		: [...filters.genres, id].slice(-MAX_GENRES);
}
