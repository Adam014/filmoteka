export const FILMLE_GUESSES = 10;

function compareNumber(guess, answer, closeWithin) {
	const value = guess ?? null;
	if (value === null || answer === null || answer === undefined) {
		return { value, match: 'none', dir: null };
	}
	const gap = answer - value;
	if (gap === 0) return { value, match: 'exact', dir: null };
	return {
		value,
		match: Math.abs(gap) <= closeWithin ? 'close' : 'none',
		dir: gap > 0 ? 'up' : 'down'
	};
}

const shared = (guess, answer) => guess.filter((name) => answer.includes(name));

/** What a guess gives away about the answer: never anything beyond its own attributes. */
export function compareFilms(guess, answer) {
	return {
		year: compareNumber(guess.year, answer.year, 5),
		rating: compareNumber(guess.rating, answer.rating, 0.5),
		runtime: compareNumber(guess.runtime, answer.runtime, 15),
		genres: { names: guess.genres, hits: shared(guess.genres, answer.genres) },
		directors: { names: guess.directors, hits: shared(guess.directors, answer.directors) },
		cast: { names: guess.cast, hits: shared(guess.cast, answer.cast) }
	};
}

function numberRange(guesses, field) {
	let low = -Infinity;
	let high = Infinity;
	let exact = null;
	let close = false;
	for (const { compare } of guesses) {
		const { value, match, dir } = compare[field];
		if (value === null) continue;
		if (match === 'exact') exact = value;
		if (match === 'close') close = true;
		if (dir === 'up') low = Math.max(low, value);
		if (dir === 'down') high = Math.min(high, value);
	}
	return { low, high, exact, close };
}

function nameSummary(guesses, field) {
	const hits = new Set();
	const misses = new Set();
	for (const { compare } of guesses) {
		compare[field].hits.forEach((name) => hits.add(name));
		compare[field].names.forEach((name) => misses.add(name));
	}
	hits.forEach((name) => misses.delete(name));
	return { hits: [...hits], misses: [...misses] };
}

/** Everything learnt so far, in one view, so nobody has to remember ten rows of clues. */
export function summarise(guesses) {
	return {
		year: numberRange(guesses, 'year'),
		rating: numberRange(guesses, 'rating'),
		runtime: numberRange(guesses, 'runtime'),
		genres: nameSummary(guesses, 'genres'),
		directors: nameSummary(guesses, 'directors'),
		cast: nameSummary(guesses, 'cast')
	};
}
