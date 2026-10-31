/** Moods translated into TMDB genre filters: `|` means any of, and `without` removes a genre. */
export const MOODS = [
	{
		id: 'cozy',
		label: 'Cozy',
		line: 'Warm, gentle and easy to love.',
		genres: '35|10751|16',
		without: '27,53,80'
	},
	{
		id: 'mind-bending',
		label: 'Mind-bending',
		line: 'Stories that keep you guessing.',
		genres: '878|9648',
		without: '16,10751'
	},
	{
		id: 'adrenaline',
		label: 'Adrenaline',
		line: 'Fast, loud and impossible to pause.',
		genres: '28|53',
		without: '10751,16'
	},
	{
		id: 'laugh',
		label: 'Laugh out loud',
		line: 'Guaranteed to lift the room.',
		genres: '35',
		without: '18,27'
	},
	{
		id: 'tearjerker',
		label: 'A good cry',
		line: 'Bring tissues. You will need them.',
		genres: '18,10749',
		without: '28,27'
	},
	{
		id: 'dark',
		label: 'Dark',
		line: 'Crime, dread and long shadows.',
		genres: '80|27',
		without: '35,10751'
	},
	{
		id: 'epic',
		label: 'Epic',
		line: 'Big worlds worth a whole evening.',
		genres: '12|14|36|10752',
		without: '35,27'
	},
	{
		id: 'date-night',
		label: 'Date night',
		line: 'Romance with a smile.',
		genres: '10749,35',
		without: '27,53'
	}
];

export const LENGTHS = [
	{ id: 'any', label: 'Any length' },
	{ id: 'short', label: 'Under 100 min' },
	{ id: 'long', label: 'Over 150 min' }
];

export const ERAS = [
	{ id: 'any', label: 'Any era' },
	{ id: '2020', label: '2020s' },
	{ id: '2010', label: '2010s' },
	{ id: '2000', label: '2000s' },
	{ id: '1990', label: '1990s' },
	{ id: '1980', label: '1980s' },
	{ id: 'classic', label: 'Classics' }
];

export function discoverParams({ mood, length, era, page }) {
	const params = {
		sort_by: 'vote_average.desc',
		'vote_count.gte': 800,
		include_adult: 'false',
		with_genres: mood.genres,
		without_genres: mood.without,
		page
	};
	if (length === 'short') params['with_runtime.lte'] = 100;
	if (length === 'long') params['with_runtime.gte'] = 150;
	if (era === 'classic') {
		params['primary_release_date.lte'] = '1979-12-31';
		params['vote_count.gte'] = 300;
	} else if (/^\d{4}$/.test(era ?? '')) {
		params['primary_release_date.gte'] = `${era}-01-01`;
		params['primary_release_date.lte'] = `${Number(era) + 9}-12-31`;
	}
	return params;
}
