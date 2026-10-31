export const USERNAME_RULE = /^[\p{L}\p{N}][\p{L}\p{N}_.-]{1,29}$/u;

export function isGuest(user) {
	return Boolean(user?.is_anonymous || !user?.email);
}

export function displayName(user) {
	return user?.user_metadata?.display_name?.trim() || '';
}

export function profileHref(name) {
	return `/profile/${encodeURIComponent(name)}`;
}

/** Keeps auth records from ever exposing e-mail addresses or provider metadata. */
export function toPublicUser(user) {
	return {
		id: user.id,
		name: displayName(user),
		avatar: user.user_metadata?.avatar_url || null,
		lastSeen: user.last_sign_in_at || null
	};
}

/** Registered people that can be listed: confirmed accounts with a name, no guests. */
export function isListedUser(user) {
	return Boolean(displayName(user) && user.confirmed_at && !user.is_anonymous);
}

/** @type {Array<[RegExp, string]>} */
const AUTH_MESSAGES = [
	[/invalid login credentials/i, "That email and password don't match."],
	[/email not confirmed/i, 'Please confirm your email first. Check your inbox for the link.'],
	[/already registered|already been registered/i, 'An account with this email already exists.'],
	[/anonymous sign-ins are disabled/i, 'Guest access is switched off at the moment.'],
	[/rate limit|too many requests|security purposes/i, 'Too many attempts. Please wait a moment.'],
	[/session missing|session.*expired/i, 'This link has expired. Please request a new one.'],
	[/should be different/i, 'Please choose a password you have not used before.'],
	[/failed to fetch|network|load failed/i, "We can't reach the server. Check your connection."]
];

/** Turns raw auth errors into something a person can act on. */
export function friendlyAuthError(error) {
	const message = error?.message ?? '';
	for (const [pattern, friendly] of AUTH_MESSAGES) {
		if (pattern.test(message)) return friendly;
	}
	return message || 'Something went wrong. Please try again.';
}
