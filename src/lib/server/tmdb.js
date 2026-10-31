import { cached } from './cache.js';
import { tmdbKey, tmdbToken, tmdbUrl } from './env.js';

const TEN_MINUTES = 10 * 60 * 1000;

/**
 * Raw TMDB request.
 * @returns {Promise<{ status: number, data: any }>} status 0 means TMDB could not be reached.
 */
export async function tmdbRequest(path, params = {}) {
	const token = tmdbToken();
	const key = tmdbKey();
	if (!token && !key) return { status: 0, data: null };

	const url = new URL(`${tmdbUrl()}${path}`);
	for (const [name, value] of Object.entries(params)) {
		if (value != null && value !== '') url.searchParams.set(name, String(value));
	}
	if (!token) url.searchParams.set('api_key', key);

	try {
		const response = await fetch(url, {
			headers: {
				accept: 'application/json',
				...(token ? { authorization: `Bearer ${token}` } : {})
			},
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) {
			if (response.status !== 404) console.error(`TMDB ${path}: HTTP ${response.status}`);
			return { status: response.status, data: null };
		}
		return { status: response.status, data: await response.json() };
	} catch (error) {
		console.error(`TMDB ${path}:`, error.message);
		return { status: 0, data: null };
	}
}

/** Cached TMDB read. Resolves to null on any failure, so callers can degrade gracefully. */
export function tmdb(path, params = {}, ttlMs = TEN_MINUTES) {
	return cached(`tmdb:${path}?${new URLSearchParams(params)}`, ttlMs, async () => {
		const { data } = await tmdbRequest(path, params);
		return data;
	});
}

/** First `limit` results of a TMDB list endpoint. Always an array. */
export async function tmdbList(path, params = {}, limit = 20) {
	const data = await tmdb(path, { language: 'en-US', ...params });
	return (data?.results ?? []).slice(0, limit);
}

/** Detail request that also tells "does not exist" apart from "could not check". */
export async function tmdbDetail(path, params = {}) {
	let notFound = false;
	const data = await cached(
		`tmdb:${path}?${new URLSearchParams(params)}`,
		TEN_MINUTES,
		async () => {
			const response = await tmdbRequest(path, { language: 'en-US', ...params });
			notFound = response.status === 404;
			return response.data;
		}
	);
	return { data, notFound };
}
