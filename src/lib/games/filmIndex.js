import { createMatcher } from './fuzzy.js';

let loading;

/**
 * The films the guessing games search through, fetched once on first use. Everything after that
 * happens in the browser, so suggestions appear as you type.
 * @returns {Promise<((text: string, limit?: number) => any[]) | null>} null if it couldn't load.
 */
export function loadFilmSearch() {
	loading ??= fetch('/api/games/films')
		.then((response) => {
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		})
		.then(({ films, famous }) =>
			createMatcher(
				films.map(([id, title, year]) => ({
					id,
					title,
					type: 'movie',
					date: year ? `${year}` : ''
				})),
				(film) => film.title,
				(film) => film.date,
				famous
			)
		)
		.catch(() => {
			loading = undefined;
			return null;
		});
	return loading;
}
