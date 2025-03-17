import { getDetailedMovie } from '../../../lib/utils';

export async function load({ params }) {
    try {
        let detailedData = await getDetailedMovie(params.id, false);

        if (detailedData) {
            return {
                details: detailedData,
                credits: detailedData.credits || null,
                poster_path: detailedData.poster_path || null // Include poster_path
            };
        }
    } catch (error) {
        console.error('Error loading movie data:', error);
        return {
            details: null,
            credits: null,
            poster_path: null,
            error: true
        };
    }
}
