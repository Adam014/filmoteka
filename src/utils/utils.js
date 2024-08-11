const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

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
        video => prioritizedTypes.includes(video.type) && !video.name.toLowerCase().includes('restricted')
    );

    // Map through videos and get promises for availability, age restriction, and view count
    const videoChecks = filteredVideos.map(async video => {
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
    const validVideos = (await Promise.all(videoChecks)).filter(video => video !== null);

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
