import { getDetailedMovie } from '../../../lib/utils';

export async function load({ params }) {
	try {
		let detailedData = await getDetailedMovie(params.id);

		if (detailedData) {
			return {
				details: detailedData,
				videos: detailedData.videos || null,
				credits: detailedData.credits || null,
				poster_path: detailedData.poster_path || null, // Include poster_path
				similar_movies: detailedData.similar_movies || null
			};
		}
	} catch (error) {
		console.error('Error loading movie data:', error);
		return {
			details: null,
			videos: null,
			credits: null,
			poster_path: null,
			error: true
		};
	}
}

