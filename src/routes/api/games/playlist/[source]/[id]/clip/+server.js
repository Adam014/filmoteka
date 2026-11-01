import { clipRedirect } from '#lib/server/deezer.js';
import {
	TryAgain,
	dealRounds,
	playlistSongs,
	validId,
	validSeed,
	validSource
} from '#lib/server/playlists.js';

export async function GET({ params, url }) {
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
		return Response.json({ message: 'Invalid playlist' }, { status: 400 });
	}
	try {
		const songs = await playlistSongs(source, id, size);
		const rounds = songs.length ? await dealRounds(songs, seed, deal, quick ? 2 : 1) : [];
		const round = rounds[Number(url.searchParams.get('round'))];
		if (!round) return Response.json({ message: 'Unavailable' }, { status: 503 });
		return clipRedirect(round.trackId);
	} catch (error) {
		if (error instanceof TryAgain)
			return Response.json({ message: 'Unavailable' }, { status: 503 });
		throw error;
	}
}
