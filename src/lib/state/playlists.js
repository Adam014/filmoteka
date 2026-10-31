const KEY = 'fk-playlists';
const HIDDEN = 'fk-playlists-hidden';
const MAX_SAVED = 200;

const sameAs = (source, id) => (item) => item.source === source && item.id === id;

function read(key) {
	try {
		const saved = JSON.parse(localStorage.getItem(key));
		return Array.isArray(saved) ? saved : [];
	} catch {
		return [];
	}
}

function write(key, list) {
	try {
		localStorage.setItem(key, JSON.stringify(list.slice(0, MAX_SAVED)));
	} catch {
		// Private browsing can refuse storage. The game still works, it just won't remember.
	}
}

/** What this device has played, most recent first. The playlists themselves live on the server. */
export const readPlaylists = () => read(KEY);

export const findPlaylist = (source, id) => readPlaylists().find(sameAs(source, id));

/**
 * Where to carry on: an unfinished round stays, a finished one moves on to the next five songs.
 * @returns {{ seed: string, deal: number, size: number | null }}
 */
export function nextRound(source, id) {
	const known = findPlaylist(source, id);
	if (!known?.seed) {
		return { seed: Math.random().toString(36).slice(2, 10), deal: 0, size: null };
	}
	const deal = known.deal ?? 0;
	return known.score === null || known.score === undefined
		? { seed: known.seed, deal, size: known.size ?? null }
		: { seed: known.seed, deal: deal + 1, size: null };
}

/** Notes that a round is being played. Coming back to the same round keeps its score. */
export function rememberRound({ source, id, title, cover, seed, deal, size }) {
	const list = readPlaylists();
	const known = list.find(sameAs(source, id));
	const same = known?.seed === seed && (known.deal ?? 0) === deal;
	const entry = {
		source,
		id,
		title,
		cover,
		seed,
		deal,
		size,
		score: same ? (known.score ?? null) : null,
		best: known?.best ?? null
	};
	write(KEY, [entry, ...list.filter((item) => item !== known)]);
}

export function recordScore(source, id, seed, deal, score) {
	write(
		KEY,
		readPlaylists().map((item) =>
			sameAs(source, id)(item) && item.seed === seed && (item.deal ?? 0) === deal
				? { ...item, score, best: Math.max(item.best ?? 0, score) }
				: item
		)
	);
}

export const readHidden = () => read(HIDDEN);

/** Takes a playlist off this device's list. It stays there for everyone else. */
export function hidePlaylist(source, id) {
	write(HIDDEN, [`${source}:${id}`, ...read(HIDDEN)]);
	return readHidden();
}

export function showPlaylist(source, id) {
	write(
		HIDDEN,
		read(HIDDEN).filter((key) => key !== `${source}:${id}`)
	);
	return readHidden();
}
