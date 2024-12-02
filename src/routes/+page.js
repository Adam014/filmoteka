import { supabase } from '../lib/db/supabaseClient';
import { getAllMovies } from '../lib/utils';

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page')) || 1;

	try {
		// Fetch total movies count from Supabase
		const { count, error: countError } = await supabase
			.from('films')
			.select('*', { count: 'exact', head: true });

			if (countError || count === 0) {
				console.warn('Count query failed or returned zero. Falling back to estimate.');
				return {
					data: { results: films },
					count: 0,
					currentPage: page,
				};
			}

		let films = await getAllMovies(page);

		if (films && films?.length > 0) {
			return {
				data: { results: films },
				count, 
				currentPage: page 
			};
		}
	} catch (error) {
		console.error('Error during data fetching process:', error);
		return {
			data: null,
			count: 0,
			currentPage: page,
			error: 'Failed to load data'
		};
	}
}
