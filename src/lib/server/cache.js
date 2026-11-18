const entries = new Map();
const MAX_ENTRIES = 500;

/** Small in-process TTL cache. Concurrent callers share one in-flight request. */
export async function cached(key, ttlMs, load) {
	const hit = entries.get(key);
	if (hit && hit.expires > Date.now()) return hit.value;

	const value = Promise.resolve().then(load);
	if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
	entries.set(key, { value, expires: Date.now() + ttlMs });

	try {
		const result = await value;
		// Failures are not worth remembering: the next visitor should retry.
		if (result == null) entries.delete(key);
		return result;
	} catch (error) {
		entries.delete(key);
		throw error;
	}
}

/**
 * Lets Vercel's CDN answer repeat visits (crawlers above all) without running the function.
 * Only for pages that look the same for everyone: no cookies, no region, no user.
 */
export function cdnCache(hours) {
	const seconds = hours * 60 * 60;
	return {
		'cache-control': `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 7}`
	};
}
