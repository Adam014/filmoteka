import { loginUrl, spotifyConfigured } from '#lib/server/spotify.js';

const go = (location) => new Response(null, { status: 302, headers: { location } });

export function GET({ url, cookies }) {
	if (!spotifyConfigured()) return go('/games/playlist?spotify=off');
	// Spotify won't send anyone back to `localhost`, so a local login goes through its IP address.
	if (url.hostname === 'localhost') {
		return go(`http://[::1]:${url.port}/api/spotify/login?back=${url.port}`);
	}
	const state = crypto.randomUUID();
	const back = url.hostname === '[::1]' ? (url.searchParams.get('back') ?? '') : '';
	const options = {
		path: '/api/spotify',
		httpOnly: true,
		sameSite: /** @type {const} */ ('lax'),
		secure: url.protocol === 'https:',
		maxAge: 600
	};
	cookies.set('sp_state', state, options);
	cookies.set('sp_back', /^\d{1,5}$/.test(back) ? back : '', options);
	return go(loginUrl(url, state));
}
