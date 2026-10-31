import { formatDate, formatMoney, formatRuntime, languageName, yearOf } from './format.js';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

/** TMDB ids in a URL: plain positive integers only. */
export function parseId(value) {
	return /^[1-9]\d{0,9}$/.test(value ?? '') ? Number(value) : null;
}

export function imageUrl(path, size = 'w342') {
	return path ? `${IMAGE_BASE}/${size}${path}` : null;
}

/** Responsive candidates for 2:3 posters. */
export function posterSrcset(path) {
	if (!path) return undefined;
	return [185, 342, 500].map((width) => `${IMAGE_BASE}/w${width}${path} ${width}w`).join(', ');
}

export function mediaHref(media) {
	return `/${media.type === 'tv' ? 'series' : 'movie'}/${media.id}`;
}

/**
 * Brings every source of a title into one shape: TMDB lists, `films` rows,
 * saved favorites (including old ones made from daily challenge rows) and tagged images.
 */
export function normalizeMedia(raw, fallbackType = 'movie') {
	if (!raw) return null;
	const source = raw.media ?? raw;
	const type = raw.media_type ?? source.media_type ?? fallbackType;
	const id = source.films_id ?? source.id;
	if (id == null || (type !== 'movie' && type !== 'tv')) return null;

	return {
		id: Number(id),
		type,
		title: source.title || source.name || source.original_title || source.original_name || '',
		poster_path: source.poster_path ?? raw.file_path ?? null,
		backdrop_path: source.backdrop_path ?? null,
		date: source.release_date || source.first_air_date || '',
		rating: Number(source.vote_average) || 0,
		popularity: Number(source.popularity) || 0,
		overview: source.overview || '',
		language: source.original_language || ''
	};
}

export function normalizeList(items, fallbackType = 'movie') {
	return dedupe((items ?? []).map((item) => normalizeMedia(item, fallbackType)).filter(Boolean));
}

function dedupe(list) {
	const seen = new Set();
	return list.filter((item) => {
		const key = `${item.type}:${item.id}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

export function normalizePerson(person) {
	return {
		id: person.id,
		name: person.name || '',
		profile_path: person.profile_path ?? null,
		role: person.character || person.job || person.known_for_department || '',
		popularity: Number(person.popularity) || 0
	};
}

/** Official YouTube trailers first, then any trailer, then teasers. Other hosts cannot be embedded. */
export function pickTrailer(videos) {
	const playable = (videos ?? []).filter((video) => video.site === 'YouTube' && video.key);
	const score = (video) =>
		(video.type === 'Trailer' ? 2 : video.type === 'Teaser' ? 1 : -10) + (video.official ? 0.5 : 0);
	const best = [...playable].sort((a, b) => score(b) - score(a))[0];
	return best && score(best) > 0 ? { key: best.key, name: best.name || 'Trailer' } : null;
}

function fact(label, value, href) {
	return value ? { label, value: String(value), href } : null;
}

function billedCast(credits) {
	return [...(credits?.cast ?? [])]
		.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
		.slice(0, 20)
		.map(normalizePerson);
}

function base(source, type) {
	return {
		id: source.id,
		type,
		tagline: source.tagline || '',
		overview: source.overview || '',
		poster_path: source.poster_path ?? null,
		backdrop_path: source.backdrop_path ?? null,
		genres: (source.genres ?? []).map((genre) => genre.name).filter(Boolean),
		rating: Number(source.vote_average) || 0,
		voteCount: Number(source.vote_count) || 0,
		popularity: Number(source.popularity) || 0,
		adult: Boolean(source.adult),
		companies: (source.production_companies ?? []).map((company) => company.name).filter(Boolean),
		countries: (source.production_countries ?? []).map((country) => country.name).filter(Boolean),
		trailer: pickTrailer(source.videos?.results)
	};
}

function imdbFact(id) {
	return fact('IMDb', id, id ? `https://www.imdb.com/title/${id}` : undefined);
}

/** @param stored `film_detailed` row @param live TMDB response. Either may be missing. */
export function buildMovie(stored, live) {
	const source = { ...stored, ...live };
	if (source.id == null) return null;

	const credits = live?.credits ?? stored?.credits;
	const directors = (credits?.crew ?? []).filter((person) => person.job === 'Director');
	const imdb = source.imdb_id || live?.external_ids?.imdb_id;

	return {
		...base(source, 'movie'),
		title: source.title || source.original_title || 'Untitled',
		originalTitle: source.original_title || '',
		date: source.release_date || '',
		year: yearOf(source.release_date),
		runtime: formatRuntime(source.runtime),
		cast: billedCast(credits),
		creatorLabel: directors.length > 1 ? 'Directors' : 'Director',
		creators: directors.map((person) => ({ id: person.id, name: person.name })),
		seasons: [],
		facts: [
			fact('Released', formatDate(source.release_date)),
			fact('Status', source.status),
			fact('Language', languageName(source.original_language)),
			fact('Budget', formatMoney(source.budget)),
			fact('Box office', formatMoney(source.revenue)),
			imdbFact(imdb),
			fact('Website', source.homepage ? hostOf(source.homepage) : '', source.homepage)
		].filter(Boolean)
	};
}

export function buildSeries(live) {
	if (live?.id == null) return null;

	const runtime = live.episode_run_time?.[0];
	return {
		...base(live, 'tv'),
		title: live.name || live.original_name || 'Untitled',
		originalTitle: live.original_name || '',
		date: live.first_air_date || '',
		year: yearOf(live.first_air_date),
		runtime: runtime ? `${formatRuntime(runtime)} per episode` : '',
		cast: billedCast(live.credits),
		creatorLabel: 'Created by',
		creators: (live.created_by ?? []).map((person) => ({ id: person.id, name: person.name })),
		seasons: (live.seasons ?? [])
			.filter((season) => season.season_number > 0)
			.map((season) => ({
				id: season.id,
				name: season.name,
				year: yearOf(season.air_date),
				episodes: season.episode_count || 0,
				poster_path: season.poster_path ?? null
			})),
		facts: [
			fact('First aired', formatDate(live.first_air_date)),
			fact('Last aired', formatDate(live.last_air_date)),
			fact('Status', live.status),
			fact('Seasons', live.number_of_seasons),
			fact('Episodes', live.number_of_episodes),
			fact('Network', (live.networks ?? []).map((network) => network.name).join(', ')),
			fact('Language', languageName(live.original_language)),
			imdbFact(live.external_ids?.imdb_id),
			fact('Website', live.homepage ? hostOf(live.homepage) : '', live.homepage)
		].filter(Boolean)
	};
}

function hostOf(url) {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return 'Official site';
	}
}

/** Filmography from TMDB combined credits, falling back to the images stored in the database. */
export function buildFilmography(combinedCredits, storedImages) {
	const credits = [...(combinedCredits?.cast ?? []), ...(combinedCredits?.crew ?? [])];
	const list = normalizeList(credits.length ? credits : storedImages);
	return list.sort(
		(a, b) =>
			Number(Boolean(b.poster_path)) - Number(Boolean(a.poster_path)) || b.popularity - a.popularity
	);
}

export function buildPerson(stored, live) {
	const source = { ...stored, ...live };
	if (source.id == null) return null;

	const imdb = source.imdb_id || live?.external_ids?.imdb_id;
	const birth = formatDate(source.birthday);
	return {
		id: source.id,
		name: source.name || 'Unknown',
		profile_path: source.profile_path ?? null,
		biography: source.biography || '',
		department: source.known_for_department || '',
		born: [birth, source.place_of_birth].filter(Boolean).join(', '),
		died: formatDate(source.deathday),
		alsoKnownAs: (source.also_known_as ?? []).slice(0, 4),
		imdbUrl: imdb ? `https://www.imdb.com/name/${imdb}` : null,
		homepage: source.homepage || null,
		filmography: buildFilmography(live?.combined_credits, stored?.movies?.results)
	};
}
