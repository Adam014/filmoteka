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
	writeLocal(day, record);
	if (user && supabase) {
		const body = new Blob([JSON.stringify(record)], { type: 'application/json' });
		const { error } = await supabase.storage
			.from('games')
			.upload(gameFilePath(user.id, day), body, { upsert: true });
		if (error) console.error('Saving game failed:', error.message);
	}
}
