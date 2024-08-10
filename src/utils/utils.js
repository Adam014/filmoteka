const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export async function isVideoAgeRestricted(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${API_KEY}`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (data.items && data.items.length > 0) {
			const videoDetails = data.items[0];
			const contentRating = videoDetails.contentDetails.contentRating;
			return contentRating && contentRating.ytRating === 'ytAgeRestricted';
		}

		return false;
	} catch (error) {
		console.error('Error checking video age restriction:', error);
		return false;
	}
}

export async function isVideoAvailable(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${API_KEY}`;

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (data.items && data.items.length > 0) {
			const videoStatus = data.items[0].status;
			return videoStatus.embeddable && videoStatus.uploadStatus === 'processed';
		}

		return false;
	} catch (error) {
		console.error('Error checking video availability:', error);
		return false;
	}
}

export async function getBestAvailableVideoWithCheck(videoList) {
	// Priority order for search: Official Trailer, Teaser, Clip
	const prioritizedTypes = ['Trailer', 'Teaser', 'Clip'];

	for (const type of prioritizedTypes) {
		const video = videoList.find(
			(video) => video.type === type && !video.name.toLowerCase().includes('restricted')
		);

		if (video) {
			const isRestricted = await isVideoAgeRestricted(video.key);
			const isAvailable = await isVideoAvailable(video.key);
			if (!isRestricted && isAvailable) {
				return video;
			}
		}
	}

	// If no suitable video is found, return the first available and non-restricted video
	for (const video of videoList) {
		const isRestricted = await isVideoAgeRestricted(video.key);
		const isAvailable = await isVideoAvailable(video.key);
		if (!isRestricted && isAvailable) {
			return video;
		}
	}

	// Return null if no suitable video is found
	return null;
}

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

// Ensure page 1 is cached on initial load
export async function cacheFirstPage() {
	const cachedPage1 = localStorage.getItem('movies_page_1');
	if (!cachedPage1) {
		await loadMovies(1, null);
	}
}

export function formatCurrency(num) {
	if (!num) return '';
	return num.toLocaleString('en-US', {
		style: 'currency',
		currency: 'USD',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	});
}
