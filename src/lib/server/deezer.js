import { cached } from './cache.js';

const TEN_MINUTES = 10 * 60 * 1000;
const API = 'https://api.deezer.com';
const SPACING = 110;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let nextSlot = 0;

/** Deezer allows 50 requests per 5 seconds, so a big playlist has to queue for its turn. */
async function waitForTurn() {
	const now = Date.now();
	const slot = Math.max(now, nextSlot);
	nextSlot = slot + SPACING;
	if (slot > now) await sleep(slot - now);
}

/**
 * A read from Deezer's public API.
 * @returns {Promise<any>} null if Deezer couldn't be reached or is rate limiting us.
 */
export async function deezer(path, params = {}) {
	const url = `${API}${path}?${new URLSearchParams(params)}`;
	for (let attempt = 0; attempt < 3; attempt++) {
		await waitForTurn();
		try {
			const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
			if (!response.ok) return null;
			const data = await response.json();
			// Code 4 is the quota: it clears within seconds.
			if (data.error?.code !== 4) return data;
			await sleep(2500);
		} catch (error) {
			console.error('Deezer request failed:', error.message);
			return null;
		}
	}
	return null;
}

export const normaliseSong = (text) =>
	text
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/\(.*?\)|\[.*?\]|feat\..*$| - .*$/g, ' ')
		.replace(/[^a-z0-9 ]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

/** Whether a Deezer result is this song by this artist, and can be played from here. */
export function isSameSong(item, wanted, singer) {
	const name = normaliseSong(item.title);
	const by = normaliseSong(item.artist.name);
	return (
		item.preview &&
		item.readable !== false &&
		(name === wanted || name.startsWith(wanted)) &&
		(by.includes(singer) || singer.includes(by))
	);
}

/** Songs are often on Deezer several times, and each release is only licensed for some countries. */
async function otherVersion(track) {
	const wanted = normaliseSong(track.title_short ?? track.title);
	const singer = normaliseSong(track.artist?.name ?? '');
	const results = await deezer('/search', { q: `${singer} ${wanted}`, limit: 25 });
	if (!results?.data) return null;
	return results.data.find((item) => isSameSong(item, wanted, singer)) ?? false;
}

/**
 * A track's 30-second preview. Deezer's links only last about 15 minutes, so this is kept for
 * less than that and never stored with a puzzle.
 * @returns {Promise<any>} null if Deezer couldn't be reached, false if the song can't be played.
 */
export function trackPreview(id) {
	return cached(`deezer:${id}`, TEN_MINUTES, async () => {
		const data = await deezer(`/track/${id}`);
		if (!data) return null;
		if (data.error) return false;
		const playable = data.preview ? data : data.alternative?.preview ? data.alternative : null;
		const track = playable ?? (await otherVersion(data));
		if (!track) return track;
		return {
			clip: track.preview,
			link: track.link ?? data.link,
			artwork: track.album?.cover_big ?? data.album?.cover_big ?? null
		};
	});
}

/** Sends the audio element to a fresh link: ours stays valid however long the page is open. */
export async function clipRedirect(id) {
	const preview = await trackPreview(id);
	if (!preview) return Response.json({ message: 'Unavailable' }, { status: 503 });
	return new Response(null, {
		status: 302,
		headers: { location: preview.clip, 'cache-control': 'no-store' }
	});
}
