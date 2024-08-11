const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

/**
 * Fetches the YouTube video content details to determine if it's age-restricted.
 * @param {string} videoId - The ID of the YouTube video.
 * @returns {Promise<boolean>} - Returns true if the video is age-restricted, otherwise false.
 */
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

/**
 * Fetches the YouTube video status to determine if it's available and embeddable.
 * @param {string} videoId - The ID of the YouTube video.
 * @returns {Promise<boolean>} - Returns true if the video is available and embeddable, otherwise false.
 */
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

/**
 * Fetches YouTube video statistics, including view count.
 * @param {string} videoId - The ID of the YouTube video.
 * @returns {Promise<object|null>} - Returns an object containing video statistics or null if not found.
 */
async function getVideoDetails(videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            return data.items[0].statistics; // Contains viewCount, likeCount, etc.
        }

        return null;
    } catch (error) {
        console.error('Error fetching video details:', error);
        return null;
    }
}

/**
 * Filters and returns the best available video from the given list based on the highest view count.
 * The video must be a trailer, teaser, or clip, not age-restricted, and available on YouTube.
 * @param {Array} videoList - The list of videos to check.
 * @returns {Promise<object|null>} - Returns the best video object or null if no suitable video is found.
 */
export async function getBestAvailableVideoWithCheck(videoList) {
    const prioritizedTypes = ['Trailer', 'Teaser', 'Clip'];
    const validVideos = [];

    for (const type of prioritizedTypes) {
        const videosOfType = videoList.filter(
            (video) => video.type === type && !video.name.toLowerCase().includes('restricted')
        );

        for (const video of videosOfType) {
            const isRestricted = await isVideoAgeRestricted(video.key);
            const isAvailable = await isVideoAvailable(video.key);

            if (!isRestricted && isAvailable) {
                const videoDetails = await getVideoDetails(video.key);
                if (videoDetails) {
                    validVideos.push({ ...video, views: videoDetails.viewCount });
                }
            }
        }
    }

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
