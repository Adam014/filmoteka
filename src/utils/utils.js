function findVideoByType(videoList, type, keywords = []) {
    return videoList.find(video => 
        video.type === type &&
        keywords.some(keyword => video.name.toLowerCase().includes(keyword)) &&
        !video.name.toLowerCase().includes("restricted")
    );
}

export function getBestAvailableVideo(videoList) {
    // Priority order for search: Official Trailer, Final Trailer, Any Trailer, Teaser, Clip
    const searchCriteria = [
        { type: "Trailer", keywords: ["official"] },
        { type: "Trailer", keywords: ["final"] },
        { type: "Trailer", keywords: ["trailer"] },
        { type: "Teaser" },
        { type: "Clip" }
    ];

    // Iterate through the search criteria to find the best available video
    for (const { type, keywords } of searchCriteria) {
        const video = findVideoByType(videoList, type, keywords || [""]);
        if (video) {
            return video;
        }
    }

    // Return null if no suitable video is found
    return null;
}

export async function loadMovies(page, setMovieResults, setTotalPages) {
    let cachedMovies = JSON.parse(localStorage.getItem(`movies_page_${page}`));

    if (!cachedMovies) {
        const url = `https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=${page}`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            cachedMovies = data.results;
            localStorage.setItem(`movies_page_${page}`, JSON.stringify(cachedMovies));
            if (setTotalPages) {
                setTotalPages(data.total_pages);
            }
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
        await loadMovies(1, null, null);
    }
}