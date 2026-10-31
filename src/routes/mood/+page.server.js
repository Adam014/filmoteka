import { normalizeList } from '#lib/media.js';
import { ERAS, LENGTHS, MOODS, discoverParams } from '#lib/moods.js';
import { tmdb } from '#lib/server/tmdb.js';

const PAGES = 12;

export async function load({ url }) {
	const mood = MOODS.find((item) => item.id === url.searchParams.get('mood')) ?? MOODS[0];
	const length = LENGTHS.find((item) => item.id === url.searchParams.get('length'))?.id ?? 'any';
	const era = ERAS.find((item) => item.id === url.searchParams.get('era'))?.id ?? 'any';
	const spin = Math.max(parseInt(url.searchParams.get('spin') ?? '0', 10) || 0, 0);

	const params = (page) => ({ language: 'en-US', ...discoverParams({ mood, length, era, page }) });

	// Narrow filters can have few pages, so a spin only lands on pages that exist.
	const first = await tmdb('/discover/movie', params(1));
	const page = (spin % Math.max(Math.min(first?.total_pages ?? 1, PAGES), 1)) + 1;
	const data = page === 1 ? first : await tmdb('/discover/movie', params(page));

	return {
		moodId: mood.id,
		length,
		era,
		spin,
		failed: !data,
		movies: normalizeList(data?.results).filter((movie) => movie.poster_path)
	};
}
