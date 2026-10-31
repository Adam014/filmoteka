const dateFormat = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
	timeZone: 'UTC'
});

/** Accepts date-only and full ISO strings. Rendered in UTC so server and browser always agree. */
export function formatDate(value) {
	if (!value) return '';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

export function yearOf(value) {
	const match = /^\d{4}/.exec(value ?? '');
	return match ? match[0] : '';
}

export function formatMoney(value) {
	if (!value || value <= 0) return '';
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(value);
}

export function formatRuntime(minutes) {
	if (!minutes || minutes <= 0) return '';
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (!hours) return `${rest} min`;
	return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatRating(value) {
	return value > 0 ? value.toFixed(1) : '';
}

/**
 * @param {Intl.DisplayNamesType} type
 * @param {string} code
 */
function displayName(type, code) {
	if (!code) return '';
	try {
		return new Intl.DisplayNames(['en'], { type }).of(code) ?? code.toUpperCase();
	} catch {
		return code.toUpperCase();
	}
}

export const languageName = (code) => displayName('language', code);
export const countryName = (code) => displayName('region', code);

export function formatRelative(value, now = Date.now()) {
	const date = new Date(value).getTime();
	if (Number.isNaN(date)) return '';
	const seconds = Math.round((now - date) / 1000);
	if (seconds < 60) return 'just now';
	if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
	if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)} d ago`;
	return formatDate(value);
}

export function initials(name) {
	const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return '?';
	const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
	return letters.toUpperCase();
}

export function plural(count, one, many = `${one}s`) {
	return `${count} ${count === 1 ? one : many}`;
}
