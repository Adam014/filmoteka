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