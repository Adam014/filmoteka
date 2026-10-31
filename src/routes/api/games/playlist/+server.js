import { TryAgain, addPlaylist, parsePlaylistLink, readLibrary } from '#lib/server/playlists.js';
import { accessToken, isLoggedIn, spotifyConfigured } from '#lib/server/spotify.js';

const noStore = { 'cache-control': 'no-store' };

export async function GET({ cookies }) {
	try {
		return Response.json(
			{
				playlists: await readLibrary(),
				spotify: { available: spotifyConfigured(), loggedIn: isLoggedIn(cookies) }
			},
			{ headers: noStore }
		);
	} catch (error) {
		if (error instanceof TryAgain) {
			return Response.json({ message: 'Unavailable' }, { status: 503 });
		}
		throw error;
	}
}

export async function POST(event) {
	const body = await event.request.json().catch(() => null);
	const parsed = await parsePlaylistLink(body?.link);
	if (!parsed) {
		return Response.json(
			{ message: "That doesn't look like a Spotify or Deezer playlist link." },
			{ status: 400 }
		);
	}
	try {
		const token = parsed.source === 'spotify' ? await accessToken(event) : null;
		const playlist = await addPlaylist(parsed.source, parsed.id, token);
		if (playlist === false) {
			return Response.json({ message: 'The library is full.' }, { status: 409 });
		}
		if (!playlist) {
			return Response.json(
				{ message: "We couldn't read that playlist. Is it public?" },
				{ status: 404 }
			);
		}
		return Response.json({ playlist }, { headers: noStore });
	} catch (error) {
		if (error instanceof TryAgain) {
			return Response.json({ message: 'Please try again in a moment.' }, { status: 503 });
		}
		throw error;
	}
}
