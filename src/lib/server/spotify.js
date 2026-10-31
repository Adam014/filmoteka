import { spotifyAccountsUrl, spotifyApiUrl, spotifyClientId, spotifyClientSecret } from './env.js';

const SCOPES = 'playlist-read-private playlist-read-collaborative';
const ACCESS = 'sp_access';
const REFRESH = 'sp_refresh';
const SIX_MONTHS = 60 * 60 * 24 * 180;

export const spotifyConfigured = () => Boolean(spotifyClientId() && spotifyClientSecret());

/** Spotify refuses `localhost`, so a local login has to go through the loopback address. */
export const redirectUri = (url) => `${url.origin}/api/spotify/callback`;

export function loginUrl(url, state) {
	const query = new URLSearchParams({
		client_id: spotifyClientId(),
		response_type: 'code',
		redirect_uri: redirectUri(url),
		scope: SCOPES,
		state
	});
	return `${spotifyAccountsUrl()}/authorize?${query}`;
}

async function requestToken(params) {
	const basic = btoa(`${spotifyClientId()}:${spotifyClientSecret()}`);
	const response = await fetch(`${spotifyAccountsUrl()}/api/token`, {
		method: 'POST',
		headers: {
			authorization: `Basic ${basic}`,
			'content-type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams(params),
		signal: AbortSignal.timeout(8000)
	});
	return response.ok ? response.json() : null;
}

export const exchangeCode = (code, url) =>
	requestToken({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(url) });

const cookieOptions = (url, maxAge) => ({
	path: '/',
	httpOnly: true,
	sameSite: /** @type {const} */ ('lax'),
	secure: url.protocol === 'https:',
	maxAge
});

/** Both tokens stay in cookies the page's scripts can't read. */
export function saveTokens(cookies, url, tokens) {
	cookies.set(ACCESS, tokens.access_token, cookieOptions(url, tokens.expires_in - 60));
	if (tokens.refresh_token) {
		cookies.set(REFRESH, tokens.refresh_token, cookieOptions(url, SIX_MONTHS));
	}
}

export function clearTokens(cookies) {
	cookies.delete(ACCESS, { path: '/' });
	cookies.delete(REFRESH, { path: '/' });
}

export const isLoggedIn = (cookies) => Boolean(cookies.get(ACCESS) || cookies.get(REFRESH));

/** @returns {Promise<string | null>} null when nobody is logged in. */
export async function accessToken({ cookies, url }) {
	const current = cookies.get(ACCESS);
	if (current) return current;
	const refresh = cookies.get(REFRESH);
	if (!refresh || !spotifyConfigured()) return null;
	const tokens = await requestToken({ grant_type: 'refresh_token', refresh_token: refresh }).catch(
		() => null
	);
	if (!tokens?.access_token) return null;
	saveTokens(cookies, url, tokens);
	return tokens.access_token;
}

/**
 * A read from the Spotify API.
 * @returns {Promise<{status: number, data: any, retryAfter: number}>}
 */
export async function spotify(path, token) {
	const response = await fetch(`${spotifyApiUrl()}${path}`, {
		headers: { authorization: `Bearer ${token}` },
		signal: AbortSignal.timeout(8000)
	});
	return {
		status: response.status,
		data: response.ok ? await response.json() : null,
		retryAfter: Number(response.headers.get('retry-after')) || 0
	};
}
