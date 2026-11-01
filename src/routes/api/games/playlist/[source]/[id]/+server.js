import { markGuess } from '#lib/server/listenRoute.js';
import {
	PLAYLIST_MIN_TRACKS,
	QUICK_MIN_TRACKS,
	TryAgain,
	dealRounds,
	playlistSongs,
	readPlaylist,
	validId,
	validSeed,
	validSource
} from '#lib/server/playlists.js';

const LENGTHS = [1, 2, 4, 8, 15];
const QUICK_LENGTHS = [1, 4, 10];

const refuse = (message, status) => ({ error: Response.json({ message }, { status }) });

async function load({ params, url }) {
	const { source, id } = params;
	const seed = url.searchParams.get('seed');
	const deal = Number(url.searchParams.get('deal') ?? 0);
	const size = Number(url.searchParams.get('size'));
	const quick = url.searchParams.get('mode') === 'quick';
	if (
		!validSource(source) ||
		!validId(source, id) ||
		!validSeed(seed) ||
		!Number.isInteger(deal) ||
		deal < 0 ||
		!Number.isInteger(size) ||
		size < 1
	) {
		return refuse('Invalid playlist', 400);
	}
	const playlist = await readPlaylist(source, id);
	if (!playlist) return refuse('Not found', 404);
	const songs = await playlistSongs(source, id, size);
	if (songs.length < (quick ? QUICK_MIN_TRACKS : PLAYLIST_MIN_TRACKS)) {
		return refuse('Not enough songs', 409);
	}
	return {
		playlist,
		songs,
		seed,
		deal,
		quick,
		size,
		lengths: quick ? QUICK_LENGTHS : LENGTHS,
		rounds: await dealRounds(songs, seed, deal, quick ? 2 : 1)
	};
}

/** Storage hiccups come back as "try again" rather than as a crash. */
const guarded = (handler) => async (event) => {
	try {
		return await handler(event);
	} catch (error) {
		if (error instanceof TryAgain)
			return Response.json({ message: 'Unavailable' }, { status: 503 });
		throw error;
	}
};

export const GET = guarded(async (event) => {
	const { source, id } = event.params;
	// Without a deal this only says how far the playlist has got.
	if (!event.url.searchParams.has('seed')) {
		if (!validSource(source) || !validId(source, id)) {
			return Response.json({ message: 'Invalid playlist' }, { status: 400 });
		}
		const playlist = await readPlaylist(source, id);
		if (!playlist) return Response.json({ message: 'Not found' }, { status: 404 });
		return Response.json({ playlist }, { headers: { 'cache-control': 'no-store' } });
	}

	const { error, playlist, songs, seed, deal, quick, size, lengths, rounds } = await load(event);
	if (error) return error;
	const query = new URLSearchParams({ seed, deal: `${deal}`, size: `${size}` });
	if (quick) query.set('mode', 'quick');
	return Response.json(
		{
			key: `${source}:${id}:${seed}:${deal}:${size}:${quick ? 'quick' : 'full'}`,
			title: playlist.title,
			cover: playlist.cover,
			lengths,
			tracks: songs.map(({ id, title, artist }) => ({ id, title, artist })),
			rounds: rounds.map(({ label, tier, start }, round) => ({
				label,
				tier,
				start,
				clip: `/api/games/playlist/${source}/${id}/clip?${query}&round=${round}`
			}))
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
});

export const POST = guarded(async (event) => {
	const { error, songs, lengths, rounds } = await load(event);
	if (error) return error;
	const body = await event.request.json().catch(() => null);
	const artistOf = (id) => songs.find((track) => track.id === id)?.artist;
	return markGuess({ rounds }, body, lengths, (id, round) => artistOf(id) === round.answer.artist);
});
