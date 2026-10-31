export const DEFAULT_REGION = 'CZ';

/** Markets offered in the region picker. Any valid ISO code still works through the URL. */
export const REGIONS = [
	'AR', 'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'CZ', 'DE', 'DK', 'ES', 'FI', 'FR', 'GB', 'GR', 'HU',
	'IE', 'IN', 'IT', 'JP', 'KR', 'MX', 'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SK', 'TR', 'UA', 'US'
]; // prettier-ignore

const VALID_REGION = /^[A-Z]{2}$/;

export function normalizeRegion(value) {
	const region = (value ?? '').trim().toUpperCase();
	return VALID_REGION.test(region) ? region : null;
}

/** First country mentioned in an Accept-Language header, e.g. `cs-CZ,cs;q=0.9` gives `CZ`. */
export function regionFromLanguage(header) {
	for (const part of (header ?? '').split(',')) {
		const match = /^[a-z]{2,3}-([a-z]{2})\b/i.exec(part.trim());
		if (match) return match[1].toUpperCase();
	}
	return null;
}

/** Picks the catalogue region without ever asking the visitor for location permission. */
export function resolveRegion({ query, cookie, geo, acceptLanguage }) {
	return (
		normalizeRegion(query) ??
		normalizeRegion(cookie) ??
		normalizeRegion(geo) ??
		regionFromLanguage(acceptLanguage) ??
		DEFAULT_REGION
	);
}
