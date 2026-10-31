import { GAMES } from '../games/catalog.js';
import { ACTORS, DIRECTORS, FRAME_FILMS } from '../games/pool.js';
import { yearOf } from '../format.js';
import { hashString, pickForDay, seededShuffle } from '../games/seed.js';
import { cached } from './cache.js';
import { tmdb } from './tmdb.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;
const STILL_COUNT = 6;
const GROUP_SIZE = 4;
const MIN_VOTES = 2500;
const DOCUMENTARY = 99;

/**
 * Today's film and six stills, hardest first. The most-voted stills tend to be the most iconic
 * ones, so they are kept for the last guesses.
 */
export function framesPuzzle(key) {
	return cached(`frames-v2:${key}`, WEEK, async () => {
		const id = pickForDay(FRAME_FILMS, key, 'frames-v1');
		const [images, movie] = await Promise.all([
			tmdb(`/movie/${id}/images`, { include_image_language: 'null' }, WEEK),
			tmdb(`/movie/${id}`, { language: 'en-US' }, WEEK)
		]);
		if (!images || !movie) return null;

		const pool = (images.backdrops ?? [])
			.filter((image) => !image.iso_639_1 && image.width >= 1280)
			.sort((a, b) => b.vote_count - a.vote_count || a.file_path.localeCompare(b.file_path))
			.slice(0, 40);
		if (!pool.length) return null;

		const iconic = pool.slice(0, 3);
		const rest = seededShuffle(pool.slice(3), hashString(key)).slice(
			0,
			STILL_COUNT - iconic.length
		);
		const stills = [...rest.reverse(), ...iconic.slice(0, STILL_COUNT - rest.length).reverse()];

		return {
			key,
			id,
			stills: stills.map((image) => image.file_path),
			year: yearOf(movie.release_date),
			genres: (movie.genres ?? []).slice(0, 2).map((genre) => genre.name),
			answer: {
				id,
				type: 'movie',
				title: movie.title,
				date: movie.release_date,
				poster_path: movie.poster_path,
				backdrop_path: movie.backdrop_path,
				overview: ''
			}
		};
	});
}

async function filmsOf(personId, kind) {
	const credits = await tmdb(`/person/${personId}/movie_credits`, { language: 'en-US' }, WEEK);
	if (!credits) return null;
	const source =
		kind === 'director'
			? (credits.crew ?? []).filter((credit) => credit.job === 'Director')
			: (credits.cast ?? []);
	const films = source.filter((credit) => !credit.genre_ids?.includes(DOCUMENTARY));
	return [...new Map(films.map((credit) => [credit.id, credit])).values()];
}

async function personName(id) {
	const person = await tmdb(`/person/${id}`, { language: 'en-US' }, WEEK);
	return person?.name ?? null;
}

/** Four groups of four films. A film that fits two of today's groups is never used. */
export function connectionsPuzzle(key) {
	return cached(`connections-v2:${key}`, WEEK, async () => {
		const seed = hashString(`connections-v2:${key}`);
		const candidates = [
			...seededShuffle(DIRECTORS, seed)
				.slice(0, 5)
				.map((id) => ({ id, kind: 'director' })),
			...seededShuffle(ACTORS, seed + 1)
				.slice(0, 4)
				.map((id) => ({ id, kind: 'actor' }))
		];

		const loaded = await Promise.all(
			candidates.map(async (person) => ({
				...person,
				films: await filmsOf(person.id, person.kind)
			}))
		);
		const people = seededShuffle(
			loaded.filter((person) => person.films),
			seed + 2
		);

		const groups = [];
		const taken = new Set();
		for (const person of people) {
			if (groups.length === GROUP_SIZE) break;

			const others = new Set(
				people
					.filter((other) => other.id !== person.id)
					.flatMap((other) => other.films.map((film) => film.id))
			);
			const eligible = person.films
				.filter(
					(film) =>
						film.poster_path &&
						film.backdrop_path &&
						film.vote_count >= MIN_VOTES &&
						!others.has(film.id) &&
						!taken.has(film.id)
				)
				// Ordered by id, so every server instance deals the same tiles from a shuffle.
				.sort((a, b) => a.id - b.id);
			if (eligible.length < GROUP_SIZE) continue;

			const name = await personName(person.id);
			if (!name) continue;

			const films = seededShuffle(eligible, seed + person.id).slice(0, GROUP_SIZE);
			films.forEach((film) => taken.add(film.id));
			groups.push({
				label: `${person.kind === 'director' ? 'Directed by' : 'Starring'} ${name}`,
				level: groups.length,
				films: films.map((film) => ({
					id: film.id,
					title: film.title,
					poster_path: film.poster_path,
					backdrop_path: film.backdrop_path
				}))
			});
		}
		return groups.length === GROUP_SIZE ? { key, groups } : null;
	});
}

/** Game tiles with a backdrop from each game's signature film. */
export function gameTiles() {
	return Promise.all(
		GAMES.map(async (game) => {
			const movie = await tmdb(`/movie/${game.film}`, { language: 'en-US' }, WEEK);
			return { ...game, image: movie?.backdrop_path ?? null };
		})
	);
}
