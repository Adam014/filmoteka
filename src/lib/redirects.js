/** Only same-site paths are honoured, so `?next=` can never send someone to another domain. */
export function safeNext(value, fallback = '/') {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
		return fallback;
	}
	return value;
}

export function loginHref(next) {
	return next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';
}
