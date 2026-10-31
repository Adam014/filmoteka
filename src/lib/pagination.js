export const PAGE_SIZE = 60;

/** Parses a page query parameter. Anything that is not a positive integer becomes page 1. */
export function parsePage(value) {
	const page = Number(value);
	return Number.isInteger(page) && page > 0 ? page : 1;
}

/**
 * Compact page list, e.g. `[1, '…', 4, 5, 6, '…', 20]`.
 * Gaps of a single page are filled in, because an ellipsis standing for one page is pointless.
 */
export function pageWindow(current, total, spread = 1) {
	if (total < 1) return [];
	const pages = new Set([1, total]);
	for (let page = current - spread; page <= current + spread; page++) {
		if (page >= 1 && page <= total) pages.add(page);
	}

	const sorted = [...pages].sort((a, b) => a - b);
	const result = [];
	for (const page of sorted) {
		const previous = result[result.length - 1];
		if (typeof previous === 'number') {
			if (page - previous === 2) result.push(previous + 1);
			else if (page - previous > 2) result.push('…');
		}
		result.push(page);
	}
	return result;
}
