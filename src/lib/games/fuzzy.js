const ROMAN = {
	ii: '2',
	iii: '3',
	iv: '4',
	v: '5',
	vi: '6',
	vii: '7',
	viii: '8',
	ix: '9',
	x: '10'
};
const ARTICLE = new Set(['the', 'a', 'an']);
const FILLER = new Set(['the', 'a', 'an', 'of', 'and', 'in', 'on', 'to']);

/** "Don't Stop", "E.T." and "Amélie & Co" become "dont stop", "et" and "amelie and co". */
function words(text) {
	return text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/['’.]/g, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim()
		.split(' ')
		.filter(Boolean)
		.map((word) => ROMAN[word] ?? word);
}

function prepare(text) {
	const list = words(text);
	return {
		words: list,
		compact: list.join(''),
		initials: (ARTICLE.has(list[0]) ? list.slice(1) : list).map((word) => word[0]).join('')
	};
}

/** Edits between two strings, a swap of neighbours counting as one. Gives up past `limit`. */
function distance(a, b, limit) {
	if (Math.abs(a.length - b.length) > limit) return limit + 1;
	let before = [];
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let smallest = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			let value = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				value = Math.min(value, before[j - 2] + 1);
			}
			current[j] = value;
			smallest = Math.min(smallest, value);
		}
		if (smallest > limit) return limit + 1;
		before = previous;
		previous = current;
	}
	return previous[b.length];
}

/** How many typos a word of this length may have. */
const allowance = (length) => (length < 4 ? 0 : length < 8 ? 1 : 2);

function wordScore(wanted, list) {
	let best = 0;
	for (const word of list) {
		if (word === wanted) return 100;
		if (word.startsWith(wanted)) best = Math.max(best, 70);
		else if (wanted.length >= 3 && word.includes(wanted)) best = Math.max(best, 40);
		else if (best < 60) {
			const limit = allowance(wanted.length);
			if (limit && word[0] === wanted[0]) {
				// A word still being typed counts too: "intersteller" and "interst" both reach it.
				const whole = distance(wanted, word, limit);
				const start = distance(wanted, word.slice(0, wanted.length), limit);
				const typos = Math.min(whole, start);
				if (typos <= limit) best = Math.max(best, 60 - typos * 12);
			} else if (limit && wanted.length >= 5 && distance(wanted, word, limit) <= limit) {
				best = Math.max(best, 30);
			}
		}
	}
	return best;
}

function score(query, target) {
	if (!query.compact) return 0;
	if (target.compact === query.compact) return 1000;
	if (target.words[0] === query.compact) return 950;
	if (target.compact.startsWith(query.compact)) return 800;
	// "lotr": the list's order decides, so the best known film of a series comes first.
	if (query.compact.length >= 2 && target.initials.startsWith(query.compact)) {
		return query.compact.length > 2 || target.initials === query.compact ? 750 : 0;
	}

	const needed = query.words.filter((word) => !FILLER.has(word));
	const required = needed.length ? needed : query.words;
	const scores = required.map((word) => wordScore(word, target.words));
	const missed = scores.filter((value) => !value).length;
	// One stray word in a longer search shouldn't lose the film it clearly means.
	if (missed > (required.length >= 3 ? 1 : 0)) {
		const start = target.compact.slice(0, query.compact.length);
		const spare = query.compact.length >= 10 ? 2 : 1;
		if (query.compact.length >= 6 && distance(query.compact, start, spare) <= spare) return 200;
		return 0;
	}
	const sum = scores.reduce((total, value) => total + value, 0);
	const lead = ARTICLE.has(target.words[0]) ? target.words[1] : target.words[0];
	const first = lead?.startsWith(required[0]) ? 40 : 0;
	const share = Math.min(query.compact.length / target.compact.length, 1) * 30;
	return (sum / required.length) * 5 + first + share - missed * 150;
}

const FAMOUS_BOOST = 130;

/** Near enough the same match: the list's order decides, so the better known one comes first. */
const band = (value) => Math.floor(value / 60);

/**
 * A forgiving search over a fixed list, in the order the list is in when scores tie. It doesn't mind
 * capitals, accents, punctuation, missing spaces, word order, small words or typos.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} titleOf The name people will mostly type.
 * @param {(item: T) => string} [extraOf] Also searched, but counts for less: an artist, a year.
 * @param {number} [famous] How many items at the top of the list are household names: a typo of
 *   one of those beats an exact start of something nobody has heard of.
 * @returns {(text: string, limit?: number) => T[]}
 */
export function createMatcher(items, titleOf, extraOf, famous = 0) {
	const entries = items.map((item) => {
		const title = titleOf(item);
		return {
			item,
			title: prepare(title),
			full: extraOf ? prepare(`${title} ${extraOf(item)}`) : null
		};
	});
	return (text, limit = 8) => {
		const query = prepare(text);
		if (!query.compact) return [];
		const hits = [];
		entries.forEach((entry, position) => {
			const value = Math.max(
				score(query, entry.title),
				entry.full ? score(query, entry.full) * 0.9 : 0
			);
			if (value > 0) {
				const boost = position < famous && value < 900 ? FAMOUS_BOOST : 0;
				hits.push({ item: entry.item, value: value + boost, position });
			}
		});
		return hits
			.sort((a, b) => band(b.value) - band(a.value) || a.position - b.position)
			.slice(0, limit)
			.map((hit) => hit.item);
	};
}
