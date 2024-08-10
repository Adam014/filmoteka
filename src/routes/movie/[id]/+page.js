export async function load({ fetch, params }) {
    const baseUrl = `https://api.themoviedb.org/3/movie/${params.id}`;
    const apiKey = '6b6f517b5228ea3d3ea85b1649b6a34a';

    const detailsUrl = `${baseUrl}?api_key=${apiKey}&language=en-US`;
    const videosUrl = `${baseUrl}/videos?api_key=${apiKey}&language=en-US`;

    try {
        const [detailsResponse, videosResponse] = await Promise.all([
            fetch(detailsUrl),
            fetch(videosUrl)
        ]);

        if (!detailsResponse.ok || !videosResponse.ok) {
            // If any of the responses are not OK, throw an error
            throw new Error('Failed to fetch data');
        }

        const detailsData = await detailsResponse.json();
        const videosData = await videosResponse.json();

        return {
            details: detailsData,
            videos: videosData
        };
    } catch (error) {
        console.error('Error loading movie data:', error);

        // Optionally return some fallback data or handle the error in a way suitable for your application
        return {
            details: null,
            videos: null,
            error: true
        };
    }
}