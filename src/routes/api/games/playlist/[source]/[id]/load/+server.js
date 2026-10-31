import { TryAgain, loadStep, validId, validSource } from '#lib/server/playlists.js';
import { accessToken } from '#lib/server/spotify.js';

/** One step of loading a playlist. The browser keeps asking until it's all in. */
export async function POST(event) {
	const { source, id } = event.params;
	if (!validSource(source) || !validId(source, id)) {
		return Response.json({ message: 'Invalid playlist' }, { status: 400 });
	}
	const body = await event.request.json().catch(() => null);
	try {
		const token = source === 'spotify' ? await accessToken(event) : null;
		const result = await loadStep(source, id, token, body?.update === true);
		if (!result) return Response.json({ message: 'Not found' }, { status: 404 });
		if (result.login) return Response.json({ message: 'Log in to Spotify' }, { status: 401 });
		return Response.json({ playlist: result }, { headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		if (error instanceof TryAgain) {
			return Response.json({ message: 'Try again', retryAfter: error.retryAfter }, { status: 503 });
		}
		throw error;
	}
}
