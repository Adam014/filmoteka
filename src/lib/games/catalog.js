export const GROUPS = [
	{ id: 'listen', label: 'Listen' },
	{ id: 'guess', label: 'Guess' },
	{ id: 'solve', label: 'Solve' }
];

export const GAMES = [
	{
		slug: 'soundtrack',
		href: '/games/soundtrack',
		name: 'Soundtrack',
		blurb: 'Five film themes, easy to legend. One second each.',
		film: 313369,
		group: 'listen',
		landing: true
	},
	{
		slug: 'earworm',
		href: '/games/earworm',
		name: 'Earworm',
		blurb: 'Five hits, easy to legend. A tenth of a second each.',
		film: 424694,
		group: 'listen',
		landing: true
	},
	{
		slug: 'playlist',
		href: '/games/playlist',
		name: 'Your playlist',
		blurb: 'Load a whole Spotify or Deezer playlist and guess from it.',
		film: 339403,
		group: 'listen'
	},
	{
		slug: 'frames',
		href: '/games/frames',
		name: 'Frames',
		blurb: 'Name the film from a single still.',
		film: 27205,
		group: 'guess',
		landing: true
	},
	{
		slug: 'filmle',
		href: '/games/filmle',
		name: 'Filmle',
		blurb: 'Close in on the film, clue by clue.',
		film: 546554,
		group: 'guess',
		landing: true
	},
	{
		slug: 'grid',
		href: '/games/grid',
		name: 'Movie Grid',
		blurb: 'Fill nine squares with the right films.',
		film: 120467,
		group: 'solve',
		landing: true
	},
	{
		slug: 'year',
		href: '/games/year',
		name: 'Year',
		blurb: 'Five stills. How close can you get to the year?',
		film: 105,
		group: 'guess'
	},
	{
		slug: 'connections',
		href: '/games/connections',
		name: 'Connections',
		blurb: 'Sort 16 films into 4 hidden groups.',
		film: 238,
		group: 'solve'
	},
	{
		slug: 'emoji',
		href: '/games/emoji',
		name: 'Emoji',
		blurb: 'Name the film from a line of emoji.',
		film: 150540,
		group: 'guess'
	},
	{
		slug: 'higher-lower',
		href: '/games/higher-lower',
		name: 'Higher or Lower',
		blurb: 'Two films, five rounds. Pick the higher rated.',
		film: 155,
		group: 'solve'
	},
	{
		slug: 'daily',
		href: '/games/daily',
		name: 'Daily poster',
		blurb: 'Name the film as a blurred poster sharpens.',
		film: 157336,
		group: 'guess'
	}
];

/** Where to send someone who just finished a game. */
export function nextGame(slug) {
	const daily = GAMES.filter((game) => game.slug !== 'playlist');
	const index = daily.findIndex((game) => game.slug === slug);
	return daily[(index + 1) % daily.length];
}
