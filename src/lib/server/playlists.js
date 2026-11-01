import { LISTEN_TIERS } from '../games/listen.js';
import { hashString, seededShuffle } from '../games/seed.js';
import { cached } from './cache.js';
import { deezer, isSameSong, normaliseSong as normalise, trackPreview } from './deezer.js';
import { spotify } from './spotify.js';
import { adminDb } from './supabase.js';

const LISTS = 'game_playlists';
const SONGS = 'game_playlist_tracks';
const COLUMNS = 'source,id,title,cover,total,processed,found,skipped,via,status,updated_at';
const TEN_MINUTES = 10 * 60 * 1000;
const DB_PAGE = 1000;
const MAX_PLAYLISTS = 300;
const MAX_LIBRARY = 100;
const MAX_SONGS = 10000;
const SPOTIFY_STEP = 25;
const DEEZER_STEP = 100;
const SEARCH_AT_ONCE = 4;
const SHORT_LINK_HOSTS = new Set(['link.deezer.com', 'deezer.page.link', 'spotify.link']);
const BROWSER = {
	'user-agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
};

/** Something on the way failed for now: the same step is safe to try again. */
export class TryAgain extends Error {
	constructor(retryAfter = 0) {
		super('Try again');
		this.retryAfter = retryAfter;
	}
}

const fromAddress = (text) => {
	const spotifyLink =
		/(?:open\.spotify\.com\/(?:intl-[a-z]+\/)?playlist\/|spotify:playlist:)([A-Za-z0-9]{10,40})/;
	const match = text.match(spotifyLink);
	if (match) return { source: 'spotify', id: match[1] };
	const deezerMatch = text.match(/deezer\.com\/(?:[a-z]{2}\/)?playlist\/(\d{1,20})/);
	return deezerMatch ? { source: 'deezer', id: deezerMatch[1] } : null;
};

/** Reads a pasted link. Share links redirect, and only well-known ones are ever followed. */
export async function parsePlaylistLink(link) {
	const text = String(link ?? '').trim();
	const direct = fromAddress(text);
	if (direct) return direct;
	try {
		const url = new URL(text);
		if (url.protocol !== 'https:' || !SHORT_LINK_HOSTS.has(url.hostname)) return null;
		const response = await fetch(url, {
			headers: BROWSER,
			redirect: 'follow',
			signal: AbortSignal.timeout(8000)
		});
		return fromAddress(response.url) ?? fromAddress(await response.text());
	} catch {
		return null;
	}
}

/** The list Spotify shows in its public embeddable player: about the first 100 songs. */
function spotifyEmbed(id) {
	return cached(`spotify-embed:${id}`, TEN_MINUTES, async () => {
		try {
			const response = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
				headers: BROWSER,
				signal: AbortSignal.timeout(8000)
			});
			if (!response.ok) return null;
			const block = (await response.text()).match(
				/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s
			);
			const entity = block && JSON.parse(block[1])?.props?.pageProps?.state?.data?.entity;
			if (!entity?.trackList?.length) return null;
			return {
				title: entity.title ?? entity.name ?? 'Spotify playlist',
				entries: entity.trackList.map((item) => ({
					title: item.title,
					artist: (item.subtitle ?? '').split(',')[0].trim()
				}))
			};
		} catch (error) {
			console.error('Reading a Spotify playlist failed:', error.message);
			return null;
		}
	});
}

/** @returns {Promise<any>} null if Deezer doesn't have it. */
async function findOnDeezer({ title, artist }) {
	const wanted = normalise(title);
	const singer = normalise(artist);
	for (const q of [`${artist} ${wanted}`, wanted]) {
		const results = await deezer('/search', { q, limit: 25 });
		if (!results?.data) throw new TryAgain(3);
		const hit = results.data.find((item) => isSameSong(item, wanted, singer));
		if (hit) return hit;
	}
	return null;
}

const toRow = (key, title, artist, item) => ({
	key,
	title: item?.title_short ?? item?.title ?? title,
	artist: item?.artist?.name ?? artist,
	deezer_id: item?.id ?? null,
	rank: item?.rank ?? 0,
	artwork: item?.album?.cover_big ?? null
});

const scopeOf = (query, source, id) => query.eq('source', source).eq('playlist_id', id);

const fail = (error) => {
	if (error) {
		console.error('Playlist storage failed:', error.message);
		throw new TryAgain(2);
	}
};

function database() {
	const client = adminDb();
	if (!client) throw new TryAgain(5);
	return client;
}

export async function readPlaylist(source, id) {
	const { data, error } = await database()
		.from(LISTS)
		.select(COLUMNS)
		.eq('source', source)
		.eq('id', id)
		.maybeSingle();
	fail(error);
	return data;
}

/** Every loaded playlist, for everyone: one person loads it and the whole group can play it. */
export async function readLibrary() {
	const { data, error } = await database()
		.from(LISTS)
		.select(COLUMNS)
		.order('updated_at', { ascending: false })
		.limit(MAX_LIBRARY);
	fail(error);
	return data;
}

async function spotifyHeader(id, token) {
	if (token) {
		const items = await spotify(`/playlists/${id}/items?limit=1`, token);
		if (items.status === 429) throw new TryAgain(items.retryAfter);
		if (items.status === 200) {
			const about = await spotify(`/playlists/${id}?fields=name`, token);
			if (about.status === 429) throw new TryAgain(about.retryAfter);
			return { title: about.data?.name ?? 'Spotify playlist', total: items.data.total, via: 'api' };
		}
	}
	const embed = await spotifyEmbed(id);
	return embed && { title: embed.title, total: embed.entries.length, via: 'embed' };
}

async function deezerHeader(id) {
	const data = await deezer(`/playlist/${id}`);
	if (!data) throw new TryAgain(3);
	if (!data.title) return null;
	return { title: data.title, total: data.nb_tracks, cover: data.picture_big, via: 'deezer' };
}

/**
 * Finds a playlist, or starts it off the first time anyone adds it.
 * @returns {Promise<any>} null if it can't be read, false if the library is full.
 */
export async function addPlaylist(source, id, token) {
	const known = await readPlaylist(source, id);
	if (known) return known;
	const { count, error: countError } = await database()
		.from(LISTS)
		.select('id', { count: 'exact', head: true });
	fail(countError);
	if (count >= MAX_PLAYLISTS) return false;

	const header = source === 'spotify' ? await spotifyHeader(id, token) : await deezerHeader(id);
	if (!header) return null;
	const { data, error } = await database()
		.from(LISTS)
		.upsert({ source, id, cover: null, ...header })
		.select(COLUMNS)
		.single();
	fail(error);
	return data;
}

/** One screenful of a Spotify playlist. Who is logged in decides whether we can see all of it. */
async function spotifyPage(list, token) {
	let via = list.via;
	if (via !== 'embed') {
		if (!token) return { login: true };
		const path = `/playlists/${list.id}/items?limit=${SPOTIFY_STEP}&offset=${list.processed}`;
		const page = await spotify(path, token);
		if (page.status === 429) throw new TryAgain(page.retryAfter || 5);
		if (page.status === 401) return { login: true };
		if (page.status === 200) {
			const entries = page.data.items
				.map((entry) => entry.item ?? entry.track)
				.filter((item) => item?.name && item.type !== 'episode')
				.map((item) => ({ title: item.name, artist: item.artists?.[0]?.name ?? '' }));
			return {
				via,
				entries,
				total: page.data.total,
				seen: page.data.items.length
			};
		}
		if (page.status !== 403 && page.status !== 404) throw new TryAgain(3);
		via = 'embed';
	}
	const embed = await spotifyEmbed(list.id);
	if (!embed) throw new TryAgain(3);
	const entries = embed.entries.slice(list.processed, list.processed + SPOTIFY_STEP);
	return { via, entries, total: embed.entries.length, seen: entries.length };
}

async function spotifyRows(list, entries) {
	const keyed = entries.map((entry) => ({
		...entry,
		key: `${normalise(entry.artist)}|${normalise(entry.title)}`
	}));
	const { data, error } = await scopeOf(
		database().from(SONGS).select('key'),
		list.source,
		list.id
	).in(
		'key',
		keyed.map((entry) => entry.key)
	);
	fail(error);
	const known = new Set(data.map((row) => row.key));
	const queue = [...new Map(keyed.map((entry) => [entry.key, entry])).values()].filter(
		(entry) => !known.has(entry.key)
	);
	const rows = [];
	const worker = async () => {
		while (queue.length) {
			const entry = queue.shift();
			const hit = await findOnDeezer(entry);
			rows.push(toRow(entry.key, entry.title, entry.artist, hit));
		}
	};
	await Promise.all(Array.from({ length: SEARCH_AT_ONCE }, worker));
	return rows;
}

async function deezerPage(list) {
	const page = await deezer(`/playlist/${list.id}/tracks`, {
		index: list.processed,
		limit: DEEZER_STEP
	});
	if (!page?.data) throw new TryAgain(3);
	const rows = page.data.map((item) => {
		const playable = item.preview && item.readable !== false;
		return toRow(`${item.id}`, item.title, item.artist?.name ?? '', playable ? item : null);
	});
	return {
		via: 'deezer',
		rows,
		total: page.total ?? list.total,
		seen: page.data.length
	};
}

async function countSongs(list, column) {
	const query = scopeOf(
		database().from(SONGS).select('key', { count: 'exact', head: true }),
		list.source,
		list.id
	);
	const { count, error } = await (column === 'found'
		? query.not('deezer_id', 'is', null)
		: query.is('deezer_id', null));
	fail(error);
	return count;
}

/** Saves new songs behind the ones we have, so the first N songs of a playlist never change. */
async function appendRows(list, rows) {
	if (!rows.length) return;
	const { data, error } = await scopeOf(
		database().from(SONGS).select('position'),
		list.source,
		list.id
	)
		.order('position', { ascending: false })
		.limit(1);
	fail(error);
	const next = (data[0]?.position ?? -1) + 1;
	const { error: saveError } = await database()
		.from(SONGS)
		.upsert(
			rows.map((row, index) => ({
				...row,
				source: list.source,
				playlist_id: list.id,
				position: next + index
			})),
			{ onConflict: 'source,playlist_id,key', ignoreDuplicates: true }
		);
	fail(saveError);
}

/**
 * Loads the next stretch of a playlist. Each call fits in one short request and picks up from what's
 * saved, so a closed tab or a failed call never loses anything.
 *
 * @returns {Promise<any>} The playlist with its progress, `{ login: true }` if it takes a Spotify
 *   login to go on, or null if there's no such playlist.
 */
export async function loadStep(source, id, token, update = false) {
	let list = await readPlaylist(source, id);
	if (!list) return null;

	if (update) {
		// A login may now open up the whole of a playlist that only gave us its first 100 songs.
		const via = source === 'spotify' ? (token ? 'api' : list.via) : list.via;
		const { data, error } = await database()
			.from(LISTS)
			.update({ status: 'loading', processed: 0, via, updated_at: new Date().toISOString() })
			.eq('source', source)
			.eq('id', id)
			.select(COLUMNS)
			.single();
		fail(error);
		list = data;
	}
	if (list.status === 'ready') return list;

	let page;
	let rows;
	if (source === 'deezer') {
		page = await deezerPage(list);
		rows = page.rows;
	} else {
		page = await spotifyPage(list, token);
		if (page.login) return page;
		rows = await spotifyRows(list, page.entries);
	}
	await appendRows(list, rows);

	const processed = Math.min(list.processed + page.seen, MAX_SONGS);
	const total = Math.min(page.total, MAX_SONGS);
	const found = await countSongs(list, 'found');
	const skipped = await countSongs(list, 'skipped');
	const cover = list.cover ?? rows.find((row) => row.artwork)?.artwork ?? null;
	const { data, error } = await database()
		.from(LISTS)
		.update({
			processed,
			total,
			found,
			skipped,
			cover,
			via: page.via,
			status: page.seen === 0 || processed >= total ? 'ready' : 'loading',
			updated_at: new Date().toISOString()
		})
		.eq('source', source)
		.eq('id', id)
		.select(COLUMNS)
		.single();
	fail(error);
	return data;
}

async function readSongs(source, id) {
	const songs = new Map();
	for (let from = 0; ; from += DB_PAGE) {
		const { data, error } = await scopeOf(
			database().from(SONGS).select('deezer_id,title,artist,rank,artwork'),
			source,
			id
		)
			.not('deezer_id', 'is', null)
			.order('position')
			.range(from, from + DB_PAGE - 1);
		fail(error);
		for (const row of data) {
			if (!songs.has(row.deezer_id)) {
				songs.set(row.deezer_id, {
					id: row.deezer_id,
					title: row.title,
					artist: row.artist,
					rank: row.rank,
					artwork: row.artwork
				});
			}
		}
		if (data.length < DB_PAGE) return [...songs.values()];
	}
}

/**
 * The first `size` songs of a playlist. Songs are only ever added behind them, so this stays the
 * same for a game in progress and for a shared link while the list goes on growing.
 */
export async function playlistSongs(source, id, size) {
	const songs = await cached(`playlist:${source}:${id}:${size}`, TEN_MINUTES, () =>
		readSongs(source, id)
	);
	return songs.slice(0, size);
}

const dealOf = (track, label, tier) => ({
	label,
	tier,
	start: null,
	trackId: track.id,
	id: track.id,
	answer: {
		id: track.id,
		title: track.title,
		artist: track.artist,
		artwork: track.artwork,
		link: `https://www.deezer.com/track/${track.id}`
	}
});

/**
 * The songs of one round, from most to least popular. Each difficulty walks through its own fixed
 * shuffle, so the next deal brings new songs until that difficulty has been through them all. A song
 * Deezer can't play at all gives way to the next one, so nobody gets stuck on a silent clip.
 *
 * @param {any[]} tracks
 * @param {string} seed
 * @param {number} deal
 * @param {number} perTier
 */
export async function dealRounds(tracks, seed, deal = 0, perTier = 1) {
	const ranked = [...tracks].sort((a, b) => b.rank - a.rank);
	const tiers = await Promise.all(
		LISTEN_TIERS.map(async (label, tier) => {
			const from = Math.floor((tier * ranked.length) / LISTEN_TIERS.length);
			const to = Math.floor(((tier + 1) * ranked.length) / LISTEN_TIERS.length);
			const shuffled = seededShuffle(ranked.slice(from, to), hashString(`${seed}:${tier}`));
			const picked = [];
			let position = deal * perTier;
			for (let tries = 0; picked.length < perTier && tries < shuffled.length; tries++) {
				const track = shuffled[position++ % shuffled.length];
				const unplayable =
					tries < shuffled.length - perTier && (await trackPreview(track.id)) === false;
				if (!unplayable) picked.push(dealOf(track, label, tier));
			}
			return picked;
		})
	);
	return tiers.flat();
}

export const PLAYLIST_MIN_TRACKS = LISTEN_TIERS.length;
export const QUICK_MIN_TRACKS = LISTEN_TIERS.length * 2;
export const validSource = (source) => source === 'spotify' || source === 'deezer';
export const validSeed = (seed) => /^[a-z0-9]{1,16}$/.test(seed ?? '');
export const validId = (source, id) =>
	source === 'deezer' ? /^\d{1,20}$/.test(id) : /^[A-Za-z0-9]{10,40}$/.test(id);
