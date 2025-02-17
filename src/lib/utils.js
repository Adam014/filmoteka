import { supabase } from './db/supabaseClient';
import toast from 'svelte-french-toast';
import { goto } from '$app/navigation';

export const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
export const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

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
export async function getBestAvailableVideoWithCheck(movieId) {
	const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${TMDB_API_KEY}`;

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
			console.log(response.status, response.statusText);
			return null;
		}

		const data = await response.json();
		// Process the 'data' array containing the first 5 commits
		return data;
	} catch (error) {
		console.log('Error fetching Filmoteka commits:', error);
		return null;
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
		const { data: films, error } = await supabase.from('films').select('*').eq('page', page);

		return films || null;
	} catch (error) {
		console.error('Unexpected error:', error);
		return null; // Or handle the error as needed
	}
}

export async function getDetailedMovie(id) {
	try {
		// Fetch detailed data with poster_path from films table
		const { data: detailedData, error } = await supabase
			.from('film_detailed')
			.select('*, films(poster_path)')
			.eq('id', id)
			.single();

		if (error) {
			throw new Error(`Error fetching detailed movie: ${error.message}`);
		}

		// Return detailed data including poster_path
		return {
			...detailedData,
			poster_path: detailedData.films?.poster_path || null // Include poster_path in the result
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
