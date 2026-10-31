import { gameFilePath, gameStorageKey, parseSavedGame } from '../game.js';
import { supabase } from '../supabase.js';

function readLocal(day) {
	try {
		return parseSavedGame(localStorage.getItem(gameStorageKey(day)));
	} catch {
		return null;
	}
}

function writeLocal(day, state) {
	try {
		localStorage.setItem(gameStorageKey(day), JSON.stringify(state));
	} catch {
		// Private browsing can refuse storage. The current game still works, it just won't persist.
	}
}

async function downloadGame(userId, day) {
	const { data, error } = await supabase.storage.from('games').download(gameFilePath(userId, day));
	if (error || !data) return null;
	return parseSavedGame(await data.text());
}

export async function loadGame(user, day) {
	if (user && supabase) {
		const saved = await downloadGame(user.id, day).catch(() => null);
		if (saved) return saved;
	}
	return readLocal(day);
}

export async function saveGame(user, day, state) {
	const record = { ...state, day, lastUpdated: new Date().toISOString() };
	if (user && supabase) {
		const body = new Blob([JSON.stringify(record)], { type: 'application/json' });
		const { error } = await supabase.storage
			.from('games')
			.upload(gameFilePath(user.id, day), body, { upsert: true });
		if (!error) return;
		console.error('Saving game failed:', error.message);
	}
	writeLocal(day, record);
}

/** Saved games by day. Only files that exist are downloaded, so nothing 404s for unplayed days. */
export async function loadAllGames(user, days) {
	const games = new Map();
	for (const day of days) {
		const saved = readLocal(day);
		if (saved) games.set(day, saved);
	}
	if (!user || !supabase) return games;

	const { data, error } = await supabase.storage
		.from('games')
		.list(`daily-challenge/${user.id}`, { limit: 1000 });
	if (error) return games;

	await Promise.all(
		(data ?? []).map(async (file) => {
			const day = parseInt(file.name, 10);
			if (!days.includes(day)) return;
			const saved = await downloadGame(user.id, day).catch(() => null);
			if (saved) games.set(day, saved);
		})
	);
	return games;
}
