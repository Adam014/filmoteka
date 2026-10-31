import { saveTokens } from '#lib/server/spotify.js';
import { redeemTicket } from '#lib/server/spotifyTickets.js';

export function GET({ url, cookies }) {
	const tokens = redeemTicket(url.searchParams.get('ticket'));
	if (tokens) saveTokens(cookies, url, tokens);
	const location = `/games/playlist?spotify=${tokens ? 'ok' : 'failed'}`;
	return new Response(null, { status: 302, headers: { location } });
}
