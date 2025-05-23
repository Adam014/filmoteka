import { supabase } from './db/supabaseClient';
import { goto } from '$app/navigation';

export const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3/movie';
export const TMDB_FETCH_API_KEY = import.meta.env.VITE_TMDB_FETCH_API_KEY;

export async function handleSearch(searchQuery, closeSearchPopup) {
	if (searchQuery.trim()) {
		// Step 1: Try to find the movie in the local database
		const { data: filmData, error: fetchError } = await supabase
			.from('film_detailed')
			.select('*')
			.ilike('original_title', `%${searchQuery.trim()}%`);

		if (fetchError) {
			console.error('Error fetching from Supabase:', fetchError);
		}

		let selectedMovie = null;

		if (filmData && filmData?.length > 0) {
			// Step 2: Apply smart selection logic for the movie
			selectedMovie = selectBestMatch(filmData, searchQuery);

			// If we found a good match, navigate to that movie
			if (selectedMovie) {
				goto(`/movie/${selectedMovie.id}`);
				closeSearchPopup();
				return;
			}
		}
	}
}

function selectBestMatch(movies, searchQuery) {
	const exactMatches = movies.filter(
		(movie) => movie.original_title.toLowerCase() === searchQuery.trim().toLowerCase()
	);

	// Set a minimum popularity threshold to filter out irrelevant results
	const MIN_POPULARITY_THRESHOLD = 50;

	if (exactMatches?.length > 0) {
		// Prioritize exact matches with the highest popularity
		return exactMatches.reduce((prev, current) => {
			return current.popularity > MIN_POPULARITY_THRESHOLD && current.popularity > prev.popularity
				? current
				: prev;
		});
	} else {
		// If no exact match, choose the most popular movie above the popularity threshold
		const popularMatches = movies.filter((movie) => movie.popularity > MIN_POPULARITY_THRESHOLD);
		if (popularMatches?.length > 0) {
			return popularMatches.reduce((prev, current) => {
				return current.popularity > prev.popularity ? current : prev;
			});
		} else {
			return null; // Return null if no suitable match is found
		}
	}
}

/**
 * Fetch the best available video for a movie using TMDB API and save it to Supabase.
 * @param {number} movieId - The TMDB movie ID.
 * @returns {Promise<object|null>} - The best available video object.
 */
export async function getBestAvailableVideoWithCheck(movieId, isMovie) {
	const url = isMovie
		? `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`
		: `https://api.themoviedb.org/3/tv/${movieId}/videos?api_key=${TMDB_API_KEY}`;

	try {
		const response = await fetch(url);

		if (!response.ok) {
			console.error(`Error fetching TMDB videos: ${response.status} - ${response.statusText}`);
			return null;
		}
		const data = await response.json();
		const videos = data.results || [];

		// Prioritize videos with type 'Trailer'
		const prioritizedTypes = ['Trailer', 'Teaser'];
		const filteredVideos = videos.filter((video) => prioritizedTypes.includes(video.type));

		// Sort by YouTube video views (mock logic, since TMDB doesn't provide view counts)
		const bestVideo = filteredVideos[0]; // TMDB returns videos sorted by relevance

		return bestVideo || null;
	} catch (error) {
		console.error('Error fetching TMDB videos:', error);
		return null;
	}
}

export async function getCommits() {
	const url = 'https://api.github.com/repos/Adam014/filmoteka/commits?per_page=7';

	try {
		const response = await fetch(url);

		if (!response.ok) {
			const statusText = response.statusText;
			throw new Error(`Failed to fetch commits: ${response.status} ${statusText}`);
		}

		const data = await response.json();
		if (!data || !Array.isArray(data) || data.length === 0) {
			throw new Error('No commit data available');
		}

		return data;
	} catch (error) {
		console.error('Error fetching Filmoteka commits:', error);
		throw error; // Re-throw to allow proper error handling upstream
	}
}

/**
 * Loads the popular movies for the specified page from the Supabase `films` table.
 * @param {number} page - The page number to load movies for.
 * @param {Function} setMovieResults - Callback function to set the movie results.
 * @returns {Promise<void>}
 */
export async function loadMovies(page, setMovieResults) {
	const moviesPerPage = 60; // Number of movies per page
	const startIndex = (page - 1) * moviesPerPage; // Calculate the starting index
	const endIndex = startIndex + moviesPerPage - 1; // Calculate the ending index

	try {
		// Fetch movies from Supabase with the updated range
		const { data: movies, error } = await supabase
			.from('films')
			.select('*')
			.range(startIndex, endIndex);

		if (error) {
			console.error('Error fetching movies from Supabase:', error.message);
			throw new Error('Failed to fetch movies from Supabase');
		}

		// If movies are fetched successfully, pass them to the callback
		if (setMovieResults) {
			setMovieResults(movies || []);
		}
	} catch (error) {
		console.error('Unexpected error in loadMovies:', error.message);
		if (setMovieResults) {
			setMovieResults([]);
		}
	}
}

/**
 * Ensures that the first page of popular movies is cached.
 * @returns {Promise<void>}
 */
export async function cacheFirstPage() {
	const cachedPage1 = localStorage.getItem('movies_page_1');
	if (!cachedPage1) {
		await loadMovies(1, null);
	}
}

/**
 * Formats a number as a currency string in USD.
 * @param {number} num - The number to format.
 * @returns {string} - The formatted currency string.
 */
export function formatCurrency(num) {
	if (!num) return '';
	return num.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});
}

export async function getAllMovies(page) {
	try {
		const { data: films } = await supabase.from('films').select('*').eq('page', page);

		return films || null;
	} catch (error) {
		console.error('Unexpected error:', error);
		return null; // Or handle the error as needed
	}
}

async function fetchDetailed(id, isMovie) {
	const url = isMovie ? `${TMDB_BASE_URL}/${id}` : `https://api.themoviedb.org/3/tv/${id}`;
	try {
		const response = await fetch(url, {
			headers: {
				accept: 'application/json',
				Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
			}
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Error fetching from TMDB:', response);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error fetching detailed movie from TMDB:', error);
		return null;
	}
}

async function fetchCredits(id, isMovie) {
	const url = isMovie
		? `${TMDB_BASE_URL}/${id}/credits`
		: `https://api.themoviedb.org/3/tv/${id}/credits`;
	try {
		const response = await fetch(url, {
			headers: {
				accept: 'application/json',
				Authorization: `Bearer ${TMDB_FETCH_API_KEY}`
			}
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Error fetching from TMDB:', response);
			return null;
		}

		return data;
	} catch (error) {
		console.error('Error fetching detailed movie from TMDB:', error);
		return null;
	}
}

export async function getDetailedMovie(id, isMovie) {
	try {
		// For TV shows (isMovie === false), always fetch directly from the API first
		if (!isMovie) {
			console.info(`TV show with ID ${id} - fetching from TMDB directly...`);
			const apiData = await fetchDetailed(id, false);
			console.log(apiData);
			const credits = await fetchCredits(id, false);

			if (!apiData) {
				throw new Error('Could not fetch TV show details from TMDB');
			}

			return {
				created_by: apiData.created_by,
				episode_run_time: apiData.episode_run_time,
				first_air_date: apiData.first_air_date,
				last_air_date: apiData.last_air_date,
				last_episode_to_air: apiData.last_episode_to_air,
				networks: apiData.networks,
				next_episodes_to_air: apiData.next_episodes_to_air,
				number_episodes: apiData.number_of_episodes,
				number_seasons: apiData.number_of_seasons,
				season: apiData.seasons,
				type: apiData.type,
				id: apiData.id,
				original_language: apiData.original_language,
				imdb_id: apiData.imdb_id,
				budget: apiData.budget,
				revenue: apiData.revenue,
				original_title: apiData.original_name,
				overview: apiData.overview,
				release_date: apiData.release_date,
				popularity: apiData.popularity,
				genres: apiData.genres,
				poster_path: apiData.poster_path,
				tagline: apiData.tagline,
				backdrop_path: apiData.backdrop_path,
				adult: apiData.adult,
				production_companies: apiData.production_companies,
				production_countries: apiData.production_countries,
				status: apiData.status,
				homepage: apiData.homepage,
				credits: credits
			};
		}

		// For movies, try to fetch from Supabase first
		let { data: detailedData, error } = await supabase
			.from('film_detailed')
			.select('*, films(poster_path)')
			.eq('id', id)
			.single();

		if (error || !detailedData) {
			console.warn(`Movie ID ${id} not found in Supabase, fetching from TMDB...`);
			const apiData = await fetchDetailed(id, true);
			const credits = await fetchCredits(id, true);

			if (!apiData) {
				throw new Error('Could not fetch movie details from TMDB');
			}

			return {
				id: apiData.id,
				original_language: apiData.original_language,
				imdb_id: apiData.imdb_id,
				budget: apiData.budget,
				revenue: apiData.revenue,
				original_title: apiData.original_title,
				title: apiData.title,
				overview: apiData.overview,
				release_date: apiData.release_date,
				popularity: apiData.popularity,
				genres: apiData.genres,
				poster_path: apiData.poster_path,
				tagline: apiData.tagline,
				backdrop_path: apiData.backdrop_path,
				adult: apiData.adult,
				production_companies: apiData.production_companies,
				production_countries: apiData.production_countries,
				status: apiData.status,
				homepage: apiData.homepage,
				credits: credits
			};
		}

		// Return the detailed data from Supabase if found
		return {
			...detailedData,
			poster_path: detailedData?.films?.poster_path || null
		};
	} catch (error) {
		console.error('Error in getDetailedMovie:', error.message);
		return null;
	}
}

// Format date function
export function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleString('en-GB', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		hour12: true
	});
}

// Fetch favorite movies function
export async function fetchFavoriteMovies(currentUser) {
	if (!currentUser) return [];

	try {
		const { data, error } = await supabase.storage.from('favorites').list(currentUser.email);

		if (error) {
			console.error('Error listing favorites:', error.message);
			return [];
		}

		if (data && data?.length > 0) {
			const moviePromises = data.map(async (file) => {
				const { data: fileData, error: downloadError } = await supabase.storage
					.from('favorites')
					.download(`${currentUser.email}/${file.name}`);

				if (downloadError) {
					console.error(`Error fetching file ${file.name}:`, downloadError.message);
					return null;
				}
				if (fileData) {
					const text = await fileData.text();
					try {
						return JSON.parse(text);
					} catch (parseError) {
						console.error(`Error parsing JSON for ${file.name}:`, parseError.message);
						return null;
					}
				}
			});

			const fetchedMovies = (await Promise.all(moviePromises)).filter(Boolean);
			return fetchedMovies;
		} else {
			console.log('No favorite movies found.');
			return [];
		}
	} catch (err) {
		console.error('Error in fetchFavoriteMovies:', err.message);
		return [];
	}
}

// Function to generate the list of pages to display
export function generatePageNumbers(currentPage, totalPages) {
	const pages = [];

	for (let i = 1; i <= totalPages; i++) {
		pages.push(i);
	}

	return pages;
}

// Fetch user profile by username
export async function fetchUserProfile(username) {
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('user_metadata->>display_name', username)
		.single();

	if (error) {
		console.error('Error fetching user profile:', error);
		return null;
	}
	return data;
}

// Follow a user
export const followUser = async (currentUserId, otherUserId) => {
	const { data, error } = await supabase
		.from('follows')
		.insert([{ follower_id: currentUserId, followed_id: otherUserId }]);
	if (error) console.error('Error following user:', error);
	return data;
};

// Unfollow a user
export const unfollowUser = async (currentUserId, otherUserId) => {
	const { data, error } = await supabase
		.from('follows')
		.delete()
		.match({ follower_id: currentUserId, followed_id: otherUserId });
	if (error) console.error('Error unfollowing user:', error);
	return data;
};
