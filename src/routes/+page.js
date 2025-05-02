import { supabase } from '../lib/db/supabaseClient';
import { TMDB_API_KEY, TMDB_FETCH_API_KEY, TMDB_BASE_URL } from '../lib/utils';

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

async function fetchData(page_num, url, key, number, region) {
	try {
		const response = await fetch(`${url}&page=${page_num}&region=${region}`, {
			headers: {
				accept: 'application/json',
				Authorization: `Bearer ${key}`
			}
		});

		const data = await response.json();

		if (!response.ok) {
			console.error(response);
		}

		return data?.results?.slice(0, number);
	} catch (error) {
		console.error(error);
	}
}

export async function load({ url }) {
	const region = url.searchParams.get('region') || 'CZ';

	// Fetch top 9 movies
	const { data: movies, error: moviesError } = await supabase
		.from('films')
		.select('*')
		.order('popularity', { ascending: false })
		.limit(9);

	const { data: actors, error: actorsError } = await supabase
		.from('person_detailed')
		.select('*')
		.eq('known_for_department', 'Acting')
		.not('movies', 'is', null)
		.order('popularity', { ascending: false })
		.limit(9);

	let authenticatedUsers = [];
	// Fetch users via the admin API
	const { data, error } = await supabase.auth.admin.listUsers();
	if (error) {
		console.error('Error fetching users:', error);
	} else {
		// Assign to the outer variable
		authenticatedUsers = data.users.filter((user) => user.confirmed_at);
	}

	if (moviesError || actorsError) {
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

	const topRatedMovies = await fetchData(
		1,
		'https://api.themoviedb.org/3/movie/top_rated?language=en-US',
		TMDB_FETCH_API_KEY,
		10,
		region
	);
	const upcomingMovies = await fetchData(
		1,
		'https://api.themoviedb.org/3/movie/upcoming?language=en-US',
		TMDB_FETCH_API_KEY,
		10,
		region
	);
	const nowPlayingMovies = await fetchData(
		1,
		'https://api.themoviedb.org/3/movie/now_playing?language=en-US',
		TMDB_FETCH_API_KEY,
		10,
		region
	);
	const trendingMovies = await fetchData(
		1,
		'https://api.themoviedb.org/3/trending/movie/week?language=en-US',
		TMDB_FETCH_API_KEY,
		10
	);
	const topRatedSeries = await fetchData(
		1,
		'https://api.themoviedb.org/3/tv/top_rated?language=en-US',
		TMDB_FETCH_API_KEY,
		10
	);

	return {
		movies: moviesWithImages,
		topRatedMovies: topRatedMovies,
		upcomingMovies: upcomingMovies,
		nowPlayingMovies: nowPlayingMovies,
		trendingMovies: trendingMovies,
		detailed_movies: detailedMovies,
		actors: actors,
		users: authenticatedUsers,
		topRatedSeries: topRatedSeries
	};
}
