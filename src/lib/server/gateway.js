const OPEN_AUTH = /^auth\/v1\/(token|signup|logout|recover|user|verify|otp|resend|settings)$/;
const SIGNED_IN = /^(rest\/v1|storage\/v1)\//;
const AVATAR_UPLOAD = /^storage\/v1\/object\/avatars\/public\/[\w.-]+\/[\w.-]+$/;
const MAX_AVATAR_REQUEST_BYTES = 5 * 1024 * 1024;

/** A visitor's session token, as opposed to the placeholder sent while logged out. */
export function userToken(authorization) {
	const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
	return token.split('.').length === 3 ? token : null;
}

/**
 * What the browser may reach through the gateway. Row level security still applies, because
 * signed-in requests run under the visitor's own token. Admin endpoints are never reachable.
 * @returns {'forward' | 'avatar' | 'unauthorized' | 'forbidden'}
 */
export function gatewayDecision({ method, path, hasUserToken, contentLength }) {
	if (OPEN_AUTH.test(path)) return 'forward';
	if (!SIGNED_IN.test(path)) return 'forbidden';
	if (hasUserToken) return 'forward';

	// New accounts have no session yet, but may upload a profile picture while signing up.
	if (method === 'POST' && AVATAR_UPLOAD.test(path) && contentLength <= MAX_AVATAR_REQUEST_BYTES) {
		return 'avatar';
	}
	return 'unauthorized';
}
