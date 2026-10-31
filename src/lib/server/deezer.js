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

/**
 * A track's 30-second preview. Deezer's links only last about 15 minutes, so this is kept for
 * less than that and never stored with a puzzle.
 * @returns {Promise<any>} null if Deezer couldn't be reached, false if the track is gone.
 */
export function trackPreview(id) {
	return cached(`deezer:${id}`, TEN_MINUTES, async () => {
		const data = await deezer(`/track/${id}`);
		if (!data) return null;
		const track = data.readable === false ? data.alternative : data;
		if (data.error || !track?.preview) return false;
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
