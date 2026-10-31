import { yearOf } from '../format.js';
import { HITS } from '../games/hits.js';
import { GRID_ACTORS, FRAME_FILMS } from '../games/pool.js';
import { GRID_COLUMNS, fitsColumn } from '../games/grid.js';
import { LISTEN_TIERS } from '../games/listen.js';
import { hashString, pickForDay, seededShuffle } from '../games/seed.js';
import { YEAR_ROUNDS } from '../games/year.js';
import { cached } from './cache.js';
import { trackPreview } from './deezer.js';
import { EMOJI_FILMS } from './emojiFilms.js';
import { SOUNDTRACKS } from './soundtracks.js';
import { tmdb, tmdbList } from './tmdb.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const round1 = (value) => Math.round(value * 10) / 10;

const publicFilm = (movie) => ({
	id: movie.id,
	type: 'movie',
	title: movie.title,
	date: movie.release_date,
	poster_path: movie.poster_path,
	backdrop_path: movie.backdrop_path,
	overview: ''
});

/** A film with what the games compare, or null if TMDB is unavailable. */
export async function filmFacts(id) {
	const movie = await tmdb(
		`/movie/${id}`,
		{ language: 'en-US', append_to_response: 'credits' },
		WEEK
	);
	if (!movie) return null;
	const year = Number(yearOf(movie.release_date)) || null;
	return {
		...publicFilm(movie),
		year,
		rating: movie.vote_average ? round1(movie.vote_average) : null,
		runtime: movie.runtime || null,
		tagline: movie.tagline || '',
		genres: (movie.genres ?? []).map((genre) => genre.name),
		genreIds: (movie.genres ?? []).map((genre) => genre.id),
		directors: (movie.credits?.crew ?? [])
			.filter((person) => person.job === 'Director')
			.map((person) => person.name),
		cast: (movie.credits?.cast ?? []).slice(0, 8).map((person) => person.name),
		castIds: (movie.credits?.cast ?? []).map((person) => person.id)
	};
}

/**
 * The day's item from a list of tracks. A track Deezer has withdrawn is passed over, but a failed
 * request isn't: that would hand people different answers while Deezer is struggling.
 */
async function pickPlayable(items, trackIdOf, key, salt) {
	const order = seededShuffle(items, hashString(salt));
	const offset = order.indexOf(pickForDay(items, key, salt));
	for (let step = 0; step < 10; step++) {
		const item = order[(offset + step) % order.length];
		const preview = await trackPreview(trackIdOf(item));
		if (preview === null) return null;
		if (preview) return { item, preview };
	}
	return null;
}

/** One playable song from each difficulty. Null if any of them can't be had right now. */
async function listenRounds(items, trackIdOf, key, salt, build) {
	const rounds = await Promise.all(
		LISTEN_TIERS.map(async (label, index) => {
			const tier = items.filter((item) => item.tier === index + 1);
			const found = await pickPlayable(tier, trackIdOf, key, `${salt}:${index + 1}`);
			if (!found) return null;
			const round = await build(found);
			return round && { label, start: found.item.start, trackId: trackIdOf(found.item), ...round };
		})
	);
	return rounds.every(Boolean) ? { key, rounds } : null;
}

export function soundtrackPuzzle(key) {
	return cached(`soundtrack-v3:${key}`, DAY, () =>
		listenRounds(
			SOUNDTRACKS,
			(item) => item.trackId,
			key,
			'soundtrack-v3',
			async ({ item, preview }) => {
				const movie = await tmdb(`/movie/${item.film}`, { language: 'en-US' }, WEEK);
				if (!movie) return null;
				return {
					id: item.film,
					answer: {
						...publicFilm(movie),
						track: item.track,
						artist: item.artist,
						link: preview.link
					}
				};
			}
		)
	);
}

export function earwormPuzzle(key) {
	return cached(`earworm-v3:${key}`, DAY, () =>
		listenRounds(
			HITS,
			(item) => item.id,
			key,
			'earworm-v3',
			({ item, preview }) => ({
				id: item.id,
				answer: {
					id: item.id,
					title: item.title,
					artist: item.artist,
					artwork: preview.artwork,
					link: preview.link
				}
			})
		)
	);
}

export function filmlePuzzle(key) {
	return filmFacts(pickForDay(FRAME_FILMS, key, 'filmle-v1'));
}

function actorFilms(credits) {
	const seen = new Map();
	for (const credit of credits?.cast ?? []) {
		if (credit.vote_count < 300 || !credit.release_date || credit.genre_ids?.includes(99)) continue;
		seen.set(credit.id, {
			id: credit.id,
			title: credit.title,
			poster_path: credit.poster_path,
			date: credit.release_date,
			genres: credit.genre_ids ?? [],
			votes: credit.vote_count
		});
	}
	return [...seen.values()].sort((a, b) => b.votes - a.votes || a.id - b.id);
}

/** Nine different films, one per square, or null if the squares can't all be filled at once. */
function solveGrid(cells) {
	const squares = cells
		.flatMap((row, rowIndex) => row.map((films, column) => ({ rowIndex, column, films })))
		.sort((a, b) => a.films.length - b.films.length);
	const used = new Set();
	const chosen = cells.map(() => []);
	const fill = (index) => {
		if (index === squares.length) return true;
		const { rowIndex, column, films } = squares[index];
		for (const film of films) {
			if (used.has(film.id)) continue;
			used.add(film.id);
			chosen[rowIndex][column] = film;
			if (fill(index + 1)) return true;
			used.delete(film.id);
		}
		return false;
	};
	return fill(0) ? chosen : null;
}

/** Three actors against three columns, with at least two known films in every square. */
export function gridPuzzle(key) {
	return cached(`grid-v1:${key}`, WEEK, async () => {
		const loaded = await Promise.all(
			GRID_ACTORS.map(async (id) => ({
				id,
				credits: await tmdb(`/person/${id}/movie_credits`, { language: 'en-US' }, WEEK)
			}))
		);
		if (loaded.some((person) => !person.credits)) return null;
		const actors = loaded.map((person) => ({ id: person.id, films: actorFilms(person.credits) }));

		const seed = hashString(`grid-v1:${key}`);
		for (let attempt = 0; attempt < 500; attempt++) {
			const rows = seededShuffle(actors, seed + attempt * 2).slice(0, 3);
			const columns = seededShuffle(GRID_COLUMNS, seed + attempt * 2 + 1).slice(0, 3);
			if (columns.filter((column) => column.from).length > 1) continue;

			const cells = rows.map((row) =>
				columns.map((column) => row.films.filter((film) => fitsColumn(film, column)))
			);
			if (cells.flat().some((films) => films.length < 2)) continue;
			// No film may be used twice, so the grid has to work out with nine different ones.
			const solution = solveGrid(cells);
			if (!solution) continue;

			const people = await Promise.all(
				rows.map((row) => tmdb(`/person/${row.id}`, { language: 'en-US' }, WEEK))
			);
			if (people.some((person) => !person)) return null;
			return {
				key,
				rows: people.map((person) => ({
					id: person.id,
					name: person.name,
					profile_path: person.profile_path
				})),
				columns: columns.map(({ id, label }) => ({ id, label })),
				columnRules: columns,
				examples: solution.map((row) =>
					row.map(({ id, title, poster_path }) => ({ id, title, poster_path }))
				)
			};
		}
		return null;
	});
}

const ERAS = [
	[1960, 1979],
	[1980, 1989],
	[1990, 1999],
	[2000, 2009],
	[2010, 2024]
];

/** One well-known film from each era, shown as a still without any text on it. */
export function yearPuzzle(key) {
	return cached(`year-v1:${key}`, WEEK, async () => {
		const seed = hashString(`year-v1:${key}`);
		const rounds = await Promise.all(
			ERAS.map(async ([from, to], index) => {
				const films = await tmdbList(
					'/discover/movie',
					{
						language: 'en-US',
						sort_by: 'vote_count.desc',
						include_adult: 'false',
						'primary_release_date.gte': `${from}-01-01`,
						'primary_release_date.lte': `${to}-12-31`,
						page: (seed + index) % 4 === 0 ? 1 : ((seed + index) % 4) + 1
					},
					20
				);
				for (const film of seededShuffle(
					[...films].sort((a, b) => a.id - b.id),
					seed + index
				)) {
					const images = await tmdb(
						`/movie/${film.id}/images`,
						{ include_image_language: 'null' },
						WEEK
					);
					const stills = (images?.backdrops ?? [])
						.filter((image) => !image.iso_639_1 && image.width >= 1280)
						.sort((a, b) => b.vote_count - a.vote_count || a.file_path.localeCompare(b.file_path));
					if (stills.length && yearOf(film.release_date)) {
						return {
							id: film.id,
							title: film.title,
							year: Number(yearOf(film.release_date)),
							still: stills[0].file_path
						};
					}
				}
				return null;
			})
		);
		if (rounds.some((round) => !round)) return null;
		return { key, rounds: seededShuffle(rounds, seed).slice(0, YEAR_ROUNDS) };
	});
}

/** The clues run from vague to obvious. */
export function emojiPuzzle(key) {
	return cached(`emoji-v1:${key}`, WEEK, async () => {
		const pick = pickForDay(EMOJI_FILMS, key, 'emoji-v1');
		const movie = await tmdb(`/movie/${pick.film}`, { language: 'en-US' }, WEEK);
		if (!movie) return null;
		return {
			key,
			id: pick.film,
			emoji: [...pick.emoji].reverse().slice(-7),
			year: yearOf(movie.release_date),
			answer: publicFilm(movie)
		};
	});
}
