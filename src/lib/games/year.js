export const YEAR_ROUNDS = 5;
export const YEAR_MIN = 1960;
export const YEAR_MAX = 2026;
export const ROUND_POINTS = 200;

/** Spot on scores 200, a year out about 170, five out about 90, and twenty out next to nothing. */
export function yearPoints(guess, actual) {
	return Math.round(ROUND_POINTS * Math.exp(-Math.abs(guess - actual) / 6));
}

export function yearSquare(points) {
	if (points >= 140) return '🟩';
	if (points >= 60) return '🟨';
	return '🟥';
}
