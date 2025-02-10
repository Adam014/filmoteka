import { supabase } from '../lib/db/supabaseClient';
import { TMDB_API_KEY } from '../lib/utils';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3/movie';

async function fetchMovieImage(movieId) {
	try {
		const response = await fetch(`${TMDB_BASE_URL}/${movieId}/images?api_key=${TMDB_API_KEY}`);
		const data = await response.json();

		if (data.backdrops && data.backdrops.length > 0) {
			return data.backdrops[0].file_path; // Get the first image file_path
		}
	} catch (error) {
		console.error(`Error fetching image for movie ID ${movieId}:`, error);
	}
	return null; // Return null if no image found
}

export async function load() {
	// Fetch top 10 movies
	const { data: movies, error: moviesError } = await supabase
		.from('films')
		.select('*')
		.order('popularity', { ascending: false })
		.limit(9);

	if (moviesError) {
		console.error('Error fetching top movies:', moviesError);
		return { movies: [], detailed_movies: [] };
	}

	// Fetch detailed info from film_detailed table
	const movieIds = movies.map((movie) => movie.id);
	const { data: detailedMovies, error: detailsError } = await supabase
		.from('film_detailed')
		.select('*')
		.in('id', movieIds);

	if (detailsError) {
		console.error('Error fetching movie details:', detailsError);
		return { movies, detailed_movies: [] };
	}

	// Fetch images for each movie
	const moviesWithImages = await Promise.all(
		movies.map(async (movie) => {
			const imagePath = await fetchMovieImage(movie.id);
			return {
				...movie,
				image: imagePath ? `https://image.tmdb.org/t/p/original${imagePath}` : null
			};
		})
	);

	return { movies: moviesWithImages, detailed_movies: detailedMovies };
}
