const DAY_MS = 24 * 60 * 60 * 1000;
const FIRST_DAY = Date.UTC(2026, 0, 1);

/** Puzzles change at midnight UTC, so everyone plays the same one. */
export function dayKey(date = new Date()) {
	return date.toISOString().slice(0, 10);
}

/** Running puzzle number, used in titles and shared results. */
export function dayNumber(key) {
	return Math.floor((Date.parse(`${key}T00:00:00Z`) - FIRST_DAY) / DAY_MS) + 1;
}

export function previousDay(key) {
	return dayKey(new Date(Date.parse(`${key}T00:00:00Z`) - DAY_MS));
}

/** Today, or yesterday for a game started just before the puzzle changed. */
export function isLiveDay(key) {
	const today = dayKey();
	return key === today || key === previousDay(today);
}

export function msUntilNextDay(now = Date.now()) {
	return DAY_MS - (now % DAY_MS);
}

export function hashString(text) {
	let hash = 2166136261;
	for (let index = 0; index < text.length; index++) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

/** Small seedable generator (mulberry32): the same seed always gives the same order. */
function random(seed) {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

export function seededShuffle(items, seed) {
	const next = random(seed);
	const result = [...items];
	for (let index = result.length - 1; index > 0; index--) {
		const other = Math.floor(next() * (index + 1));
		[result[index], result[other]] = [result[other], result[index]];
	}
	return result;
}

/** Walks through a fixed shuffled order, so a film can't come back until all others have been used. */
export function pickForDay(items, key, salt) {
	const order = seededShuffle(items, hashString(salt));
	const position = Math.abs(dayNumber(key)) % order.length;
	return order[position];
}
