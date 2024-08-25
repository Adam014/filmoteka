import { supabase } from '../../../utils/db/supabaseClient';
import { TMDB_API_KEY, getDetailedMovie } from '../../../utils/utils';

export async function load({ fetch, params }) {
    try {
        // Attempt to retrieve detailed data from the local database using getDetailedMovie
        const detailedData = await getDetailedMovie(params.id);

        // If data is found in the database, return it
        if (detailedData) {
            return {
                details: detailedData,
                videos: detailedData.videos || null,
            };
        }

        // If data is not found in the database, fetch it from the external API
        const baseUrl = `https://api.themoviedb.org/3/movie/${params.id}`;
        const detailsUrl = `${baseUrl}?api_key=${TMDB_API_KEY}&language=en-US`;
        const videosUrl = `${baseUrl}/videos?api_key=${TMDB_API_KEY}&language=en-US`;

        const [detailsResponse, videosResponse] = await Promise.all([
            fetch(detailsUrl),
            fetch(videosUrl),
        ]);

        if (!detailsResponse.ok || !videosResponse.ok) {
            throw new Error('Failed to fetch data from the external API');
        }

        const detailsData = await detailsResponse.json();
        const videosData = await videosResponse.json();

        // Insert the fetched data into Supabase
        const { error: insertError } = await supabase
            .from('film_detailed')
            .insert([{
                id: detailsData.id,
                created_at: new Date(),
                belongs_to_collection: detailsData.belongs_to_collection,
                budget: detailsData.budget,
                genres: detailsData.genres,
                homepage: detailsData.homepage,
                imdb_id: detailsData.imdb_id,
                original_country: detailsData.production_countries,
                original_language: detailsData.original_language,
                overview: detailsData.overview,
                production_companies: detailsData.production_companies,
                production_countries: detailsData.production_countries, 
                revenue: detailsData.revenue,
                runtime: detailsData.runtime,
                spoken_languages: detailsData.spoken_languages,
                status: detailsData.status,
                tagline: detailsData.tagline,
                videos: videosData,
                original_title: detailsData.title,
                release_date: detailsData.release_date
            }]);

        if (insertError) {
            console.error('Error inserting data into Supabase:', insertError);
        }

        // Return the fetched data
        return {
            details: detailsData,
            videos: videosData,
        };
    } catch (error) {
        console.error('Error loading movie data:', error);
        return {
            details: null,
            videos: null,
            error: true,
        };
    }
}
