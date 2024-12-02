import { getDetailedMovie } from '../../../lib/utils';

export async function load({ params }) {
	try {
		// Attempt to retrieve detailed data from the local database using getDetailedMovie
		let detailedData = await getDetailedMovie(params.id);

		// If detailed data is found in the database, return it
		if (detailedData) {
			return {
				details: detailedData,
				videos: detailedData.videos || null,
				credits: detailedData.credits || null,
				similar_movies: detailedData.similar_movies || null
			};
		}
	} catch (error) {
		console.error('Error loading movie data:', error);
		return {
			details: null,
			videos: null,
			credits: null,
			error: true
		};
	}
}
