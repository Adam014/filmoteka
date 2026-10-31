import { previousDay } from '../games/seed.js';

const storageKey = (game) => `fk-arcade-${game}`;

function read(game) {
	try {
		return JSON.parse(localStorage.getItem(storageKey(game))) ?? {};
	} catch {
		return {};
	}
}

function write(game, value) {
	try {
		localStorage.setItem(storageKey(game), JSON.stringify(value));
	} catch {
		// Private browsing can refuse storage. The game still works, it just won't persist.
	}
}

export function getPlay(game, key) {
	return read(game).plays?.[key] ?? null;
}

export function savePlay(game, key, play) {
	const data = read(game);
	write(game, { ...data, plays: { ...data.plays, [key]: play } });
}

/** Days won in a row, counting back from today (or yesterday, if today isn't played yet). */
export function getStreak(game, today) {
	const plays = read(game).plays ?? {};
	let day = plays[today]?.status === 'won' ? today : previousDay(today);
	let streak = 0;
	while (plays[day]?.status === 'won') {
		streak++;
		day = previousDay(day);
	}
	return streak;
}

const PICKS_KEY = 'fk-picks';

export function readPicks() {
	try {
		return JSON.parse(localStorage.getItem(PICKS_KEY)) ?? [];
	} catch {
		return [];
	}
}

export function writePicks(picks) {
	try {
		localStorage.setItem(PICKS_KEY, JSON.stringify(picks.slice(0, 100)));
	} catch {
		// See above: picks simply stay in memory for this visit.
	}
}
