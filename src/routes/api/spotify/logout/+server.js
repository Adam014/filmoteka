import { clearTokens } from '#lib/server/spotify.js';

export function POST({ cookies }) {
	clearTokens(cookies);
	return new Response(null, { status: 204 });
}
