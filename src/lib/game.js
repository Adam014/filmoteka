export const MAX_GUESSES = 3;
export const HINT_COUNT = 3;

const BLUR_BY_HINT = { 1: 22, 2: 12, 3: 6 };

export const newGame = () => ({
	guessedCorrectly: false,
	guessesLeft: MAX_GUESSES,
	currentHint: 1
});

export function isFinished(state) {
	return Boolean(state.guessedCorrectly) || state.guessesLeft <= 0;
}

export function posterBlur(state) {
	return isFinished(state) ? 0 : BLUR_BY_HINT[state.currentHint];
}

/** Each miss reveals exactly one more hint. */
function miss(state) {
	return {
		...state,
		guessesLeft: state.guessesLeft - 1,
		currentHint: Math.min(state.currentHint + 1, HINT_COUNT)
	};
}

export function skip(state) {
	return isFinished(state) ? state : miss(state);
}

export function guess(state, correct) {
	if (isFinished(state)) return state;
	return correct ? { ...state, guessedCorrectly: true } : miss(state);
}

export function isCorrectGuess(challenge, movie) {
	if (challenge.films_id != null && Number(movie.id) === Number(challenge.films_id)) return true;
	const answer = (challenge.title ?? '').trim().toLowerCase();
	return Boolean(answer) && (movie.title ?? '').trim().toLowerCase() === answer;
}

/**
 * Reads a saved game, tolerating every format written so far. Older versions could store hint
 * numbers above the maximum and marked a win by setting guessesLeft to 0.
 */
export function parseSavedGame(raw) {
	const saved = typeof raw === 'string' ? safeJson(raw) : raw;
	if (!saved || typeof saved !== 'object') return null;

	const guessesLeft = Number.isInteger(saved.guessesLeft) ? saved.guessesLeft : MAX_GUESSES;
	const currentHint = Number.isInteger(saved.currentHint) ? saved.currentHint : 1;
	return {
		guessedCorrectly: saved.guessedCorrectly === true,
		guessesLeft: Math.min(Math.max(guessesLeft, 0), MAX_GUESSES),
		currentHint: Math.min(Math.max(currentHint, 1), HINT_COUNT)
	};
}

function safeJson(text) {
	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

/** @returns {'won' | 'lost' | 'playing' | 'new'} */
export function gameStatus(state) {
	if (!state) return 'new';
	if (state.guessedCorrectly) return 'won';
	if (state.guessesLeft <= 0) return 'lost';
	return state.guessesLeft < MAX_GUESSES ? 'playing' : 'new';
}

export const gameStorageKey = (day) => `daily-challenge-day-${day}`;
export const gameFilePath = (userId, day) => `daily-challenge/${userId}/${day}.json`;

/** Accepts only plain positive integers, so `day-abc` or `day-1x` become a clean 404. */
export function parseDay(value) {
	return /^[1-9]\d{0,5}$/.test(value ?? '') ? Number(value) : null;
}
