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

async function fetchTopRatedMovies(page_num, region) {
	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/top_rated?language=en-US&page=${page_num}&region=${region}`,
			{
				headers: {
					accept: 'application/json',
					Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
				}
			}
		);

		const data = await response.json();

		if (!response.ok) {
			console.error(response);
		}

		return data?.results?.slice(0, 10);
	} catch (error) {
		console.error(error);
	}
}

async function fetchUpcoming(page_num, region) {
	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/upcoming?language=en-US&page=${page_num}&region=${region}`,
			{
				headers: {
					accept: 'application/json',
					Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
				}
			}
		);

		const data = await response.json();

		if (!response.ok) {
			console.error(response);
		}

		return data?.results?.slice(0, 10);
	} catch (error) {
		console.error(error);
	}
}

async function fetchNowPlaying(page_num, region) {
	try {
		const response = await fetch(
			`${TMDB_BASE_URL}/now_playing?language=en-US&page=${page_num}&region=${region}`,
			{
				headers: {
					accept: 'application/json',
					Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
				}
			}
		);

		const data = await response.json();

		if (!response.ok) {
			console.error(response);
		}

		return data?.results?.slice(0, 10);
	} catch (error) {
		console.error(error);
	}
}

async function fetchTrendingMovies(page_num) {
	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/trending/movie/week?language=en-US&page=${page_num}`,
			{
				headers: {
					accept: 'application/json',
					Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
				}
			}
		);

		const data = await response.json();

		if (!response.ok) {
			console.error(response);
		}

		return data?.results?.slice(0, 10);
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
		authenticatedUsers = data.users.filter(user => user.confirmed_at);
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

	const topRatedMovies = await fetchTopRatedMovies(1, region);
	const upcomingMovies = await fetchUpcoming(1, region);
	const nowPlayingMovies = await fetchNowPlaying(1, region);
	const trendingMovies = await fetchTrendingMovies(1);

	return {
		movies: moviesWithImages,
		topRatedMovies: topRatedMovies,
		upcomingMovies: upcomingMovies,
		nowPlayingMovies: nowPlayingMovies,
		trendingMovies: trendingMovies,
		detailed_movies: detailedMovies,
		actors: actors,
		users: authenticatedUsers,
	};
}
