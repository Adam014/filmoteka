import { accessToken, clearTokens, spotify } from '#lib/server/spotify.js';

const PAGE = 50;
const MAX_PAGES = 6;

/** The logged-in person's playlists. Spotify only opens up in full the ones they own or help edit. */
export async function GET(event) {
	const token = await accessToken(event);
	if (!token) return Response.json({ message: 'Log in to Spotify' }, { status: 401 });

	const me = await spotify('/me', token);
	if (me.status === 401) {
		// A login Spotify no longer accepts is no use: ask for a new one.
		clearTokens(event.cookies);
		return Response.json({ message: 'Log in to Spotify' }, { status: 401 });
	}
	if (me.status === 403) return Response.json({ message: 'Not approved' }, { status: 403 });
	if (!me.data) return Response.json({ message: 'Unavailable' }, { status: 503 });

	const playlists = [];
	for (let page = 0; page < MAX_PAGES; page++) {
		const { data } = await spotify(`/me/playlists?limit=${PAGE}&offset=${page * PAGE}`, token);
		if (!data) {
			if (page === 0) return Response.json({ message: 'Unavailable' }, { status: 503 });
			break;
		}
		playlists.push(...data.items.filter(Boolean));
		if (!data.next) break;
	}

	const summary = playlists.map((item) => ({
		id: item.id,
		name: item.name,
		image: item.images?.at(-1)?.url ?? null,
		total: item.items?.total ?? item.tracks?.total ?? 0,
		full: item.owner?.id === me.data.id || item.collaborative === true
	}));
	return Response.json(
		{
			name: me.data.display_name ?? '',
			image: me.data.images?.at(-1)?.url ?? null,
			playlists: [...summary.filter((item) => item.full), ...summary.filter((item) => !item.full)]
		},
		{ headers: { 'cache-control': 'no-store' } }
	);
}
