export const GAMES = [
	{
		slug: 'frames',
		href: '/games/frames',
		name: 'Frames',
		blurb: 'Name the film from a single still.',
		film: 27205
	},
	{
		slug: 'connections',
		href: '/games/connections',
		name: 'Connections',
		blurb: 'Sort 16 films into 4 hidden groups.',
		film: 238
	},
	{
		slug: 'higher-lower',
		href: '/games/higher-lower',
		name: 'Higher or Lower',
		blurb: 'Two films, five rounds. Pick the higher rated.',
		film: 155
	},
	{
		slug: 'daily',
		href: '/games/daily',
		name: 'Daily poster',
		blurb: 'Every miss sharpens a blurred poster.',
		film: 157336
	}
];

/** Where to send someone who just finished a game. */
export function nextGame(slug) {
	const index = GAMES.findIndex((game) => game.slug === slug);
	return GAMES[(index + 1) % GAMES.length];
}
