import { tmdb } from '#lib/server/tmdb.js';

export async function load() {
	const data = await tmdb('/genre/movie/list', { language: 'en-US' }, 24 * 60 * 60 * 1000);
	return { genres: data?.genres ?? [] };
}
