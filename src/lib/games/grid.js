export const GRID_GUESSES = 9;

const genre = (id, label) => ({ id: `genre-${id}`, label, genre: id });
const decade = (from) => ({ id: `decade-${from}`, label: `${from}s`, from, to: from + 9 });

/** What a column can ask for. Only one decade per grid, or a row could be impossible to place. */
export const GRID_COLUMNS = [
	genre(28, 'Action'),
	genre(35, 'Comedy'),
	genre(18, 'Drama'),
	genre(53, 'Thriller'),
	genre(80, 'Crime'),
	genre(878, 'Sci-Fi'),
	genre(10749, 'Romance'),
	genre(12, 'Adventure'),
	genre(14, 'Fantasy'),
	decade(1990),
	decade(2000),
	decade(2010),
	decade(2020)
];

export function fitsColumn(film, column) {
	if (column.genre) return film.genres.includes(column.genre);
	const year = Number(film.date?.slice(0, 4));
	return year >= column.from && year <= column.to;
}
