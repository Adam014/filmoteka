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

		if (filmData && filmData.length > 0) {
			// Step 2: Apply smart selection logic for the movie
			selectedMovie = selectBestMatch(filmData, searchQuery);

			// If we found a good match, navigate to that movie
			if (selectedMovie) {
				goto(`/movie/${selectedMovie.id}`);
				closeSearchPopup();
				return;
			}
		}

		// Step 3: If not found or no good match, fetch from the TMDB API
		const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
			searchQuery.trim()
		)}&language=en-US&page=1&include_adult=false`;

		const res = await fetch(searchUrl);
		const data = await res.json();

		if (data.results && data.results.length > 0) {
			// Step 4: Apply the same smart selection logic to API results
			selectedMovie = selectBestMatch(data.results, searchQuery);

			if (selectedMovie) {
				// Step 5: Insert fetched movie data into the database
				const { error: insertError } = await supabase.from('film_detailed').upsert([
					{
						id: selectedMovie.id,
						title: selectedMovie.title,
						overview: selectedMovie.overview,
						release_date: selectedMovie.release_date,
						poster_path: selectedMovie.poster_path,
						backdrop_path: selectedMovie.backdrop_path,
						vote_average: selectedMovie.vote_average,
						vote_count: selectedMovie.vote_count,
						genres: selectedMovie.genre_ids,
						original_language: selectedMovie.original_language,
						original_title: selectedMovie.original_title,
						popularity: selectedMovie.popularity,
						video: selectedMovie.video,
						adult: selectedMovie.adult
					}
				]);

				if (insertError) {
					console.error('Error inserting into Supabase:', insertError);
				}

				// Navigate to the movie's page
				goto(`/movie/${selectedMovie.id}`);
				closeSearchPopup();
			} else {
				toast.error('Movie not found!');
			}
		} else {
			toast.error('Movie not found!');
		}
	}
}

function selectBestMatch(movies, searchQuery) {
	const exactMatches = movies.filter(
		(movie) => movie.original_title.toLowerCase() === searchQuery.trim().toLowerCase()
	);

	// Set a minimum popularity threshold to filter out irrelevant results
	const MIN_POPULARITY_THRESHOLD = 50;

	if (exactMatches.length > 0) {
		// Prioritize exact matches with the highest popularity
		return exactMatches.reduce((prev, current) => {
			return current.popularity > MIN_POPULARITY_THRESHOLD && current.popularity > prev.popularity
				? current
				: prev;
		});
	} else {
		// If no exact match, choose the most popular movie above the popularity threshold
		const popularMatches = movies.filter((movie) => movie.popularity > MIN_POPULARITY_THRESHOLD);
		if (popularMatches.length > 0) {
			return popularMatches.reduce((prev, current) => {
				return current.popularity > prev.popularity ? current : prev;
			});
		} else {
			return null; // Return null if no suitable match is found
		}
	}
}

async function isVideoAgeRestricted(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		if (data.items && data.items.length > 0) {
			const contentRating = data.items[0].contentDetails.contentRating;
			return contentRating?.ytRating === 'ytAgeRestricted';
		}
		return false;
	} catch (error) {
		console.error('Error checking video age restriction:', error);
		return false;
	}
}

async function isVideoAvailable(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${API_KEY}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		if (data.items && data.items.length > 0) {
			const { embeddable, uploadStatus } = data.items[0].status;
			return embeddable && uploadStatus === 'processed';
		}
		return false;
	} catch (error) {
		console.error('Error checking video availability:', error);
		return false;
	}
}

async function getVideoDetails(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
	try {
		const response = await fetch(url);
		const data = await response.json();
		if (data.items && data.items.length > 0) {
			return data.items[0].statistics;
		}
		return null;
	} catch (error) {
		console.error('Error fetching video details:', error);
		return null;
	}
}

/**
 * Optimized function to find the best available video by making concurrent requests.
 * @param {Array} videoList - List of video objects.
 * @returns {Promise<object|null>} - The best available video based on views, availability, and age restriction.
 */
export async function getBestAvailableVideoWithCheck(videoList) {
	const prioritizedTypes = ['Trailer', 'Teaser', 'Clip'];

	// Filter videos by prioritized types
	const filteredVideos = videoList.filter(
		(video) =>
			prioritizedTypes.includes(video.type) && !video.name.toLowerCase().includes('restricted')
	);

	// Map through videos and get promises for availability, age restriction, and view count
	const videoChecks = filteredVideos.map(async (video) => {
		const [isRestricted, isAvailable, videoDetails] = await Promise.all([
			isVideoAgeRestricted(video.key),
			isVideoAvailable(video.key),
			getVideoDetails(video.key)
		]);

		if (!isRestricted && isAvailable && videoDetails) {
			return { ...video, views: parseInt(videoDetails.viewCount, 10) };
		}
		return null;
	});

	// Wait for all checks to complete
	const validVideos = (await Promise.all(videoChecks)).filter((video) => video !== null);

	// Sort videos by view count in descending order
	validVideos.sort((a, b) => b.views - a.views);

	return validVideos.length > 0 ? validVideos[0] : null;
}

/**
 * Loads the popular movies for the specified page, either from cache or from the API.
 * @param {number} page - The page number to load movies for.
 * @param {Function} setMovieResults - Callback function to set the movie results.
 * @returns {Promise<void>}
 */
export async function loadMovies(page, setMovieResults) {
	let cachedMovies = JSON.parse(localStorage.getItem(`movies_page_${page}`));

	if (!cachedMovies) {
		const url = `https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=${page}`;
		const res = await fetch(url);

		if (res.ok) {
			const data = await res.json();
			cachedMovies = data.results;
			localStorage.setItem(`movies_page_${page}`, JSON.stringify(cachedMovies));
		}
	}

	if (setMovieResults) {
		setMovieResults(cachedMovies);
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
	// If film exists, fetch the detailed information from the detailed_film table
	try {
		const { data: detailedData, error } = await supabase
			.from('film_detailed')
			.select('*')
			.eq('id', id)
			.single();

		return detailedData;
	} catch (error) {
		console.log(error);
		return null;
	}
}
