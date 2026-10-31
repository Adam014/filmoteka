import { exchangeCode, saveTokens } from '#lib/server/spotify.js';
import { issueTicket } from '#lib/server/spotifyTickets.js';

const go = (location) => new Response(null, { status: 302, headers: { location } });

export async function GET({ url, cookies }) {
	const state = cookies.get('sp_state');
	const back = cookies.get('sp_back');
	cookies.delete('sp_state', { path: '/api/spotify' });
	cookies.delete('sp_back', { path: '/api/spotify' });

	const home = back ? `http://localhost:${back}/games/playlist` : '/games/playlist';
	const code = url.searchParams.get('code');
	if (!code || !state || url.searchParams.get('state') !== state) {
		return go(`${home}?spotify=cancelled`);
	}
	const tokens = await exchangeCode(code, url).catch(() => null);
	if (!tokens?.access_token) return go(`${home}?spotify=failed`);
	if (back) return go(`http://localhost:${back}/api/spotify/finish?ticket=${issueTicket(tokens)}`);
	saveTokens(cookies, url, tokens);
	return go(`${home}?spotify=ok`);
}
