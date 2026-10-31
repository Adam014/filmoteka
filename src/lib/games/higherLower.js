export const ROUNDS = 5;

/** How far apart two ratings may be in each round: obvious first, close calls last. */
const GAPS = [
	[1.2, 9],
	[0.9, 1.6],
	[0.6, 1.1],
	[0.4, 0.8],
	[0.2, 0.5]
];

function findPartner(first, candidates, range) {
	const [min, max] = range;
	return candidates.find((movie) => {
		const gap = Math.abs(movie.rating - first.rating);
		return movie.id !== first.id && gap >= min && gap <= max;
	});
}

/**
 * Builds five pairs from a shuffled pool, never with a tie and never using a film twice.
 * @returns {{ a: object, b: object }[] | null}
 */
export function buildRounds(pool) {
	const taken = new Set();
	const rounds = [];

	for (const gap of GAPS) {
		const open = pool.filter((movie) => !taken.has(movie.id));
		let pair = null;
		for (const first of open) {
			const second =
				findPartner(first, open, gap) ?? findPartner(first, open, [0.1, Number.POSITIVE_INFINITY]);
			if (second) {
				pair = { a: first, b: second };
				break;
			}
		}
		if (!pair) return null;
		taken.add(pair.a.id);
		taken.add(pair.b.id);
		rounds.push(pair);
	}
	return rounds;
}

export function verdict(score) {
	return (
		[
			'Rough one. Back tomorrow?',
			'Rough one. Back tomorrow?',
			'Not bad. Beat it tomorrow.',
			'Solid.',
			'So close to perfect.',
			'Perfect. You know your films.'
		][score] ?? ''
	);
}

/** A day counts towards the streak with three or more right. */
export const WIN_SCORE = 3;
