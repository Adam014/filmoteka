import { supabase } from '../../../utils/db/supabaseClient';

export async function load({ fetch, params }) {
	const baseUrl = `https://api.themoviedb.org/3/movie/${params.id}`;
	const apiKey = import.meta.env.VITE_TMDB_API_KEY;

	// Check if the movie exists in the Supabase DB
	const { data: filmData, error: filmError } = await supabase
		.from('films')
		.select('*')
		.eq('id', params.id)
		.single();

	if (filmData) {
		// If film exists, fetch the detailed information from the detailed_film table
		const { data: detailedData, error: detailedError } = await supabase
			.from('film_detailed')
			.select('*')
			.eq('id', params.id)
			.single();

		if (detailedData) {
			// Return the data from the DB
			return {
				details: detailedData,
				videos: detailedData.videos || null,
			};
		}
	}

	// If the film is not found in the DB, fetch the data from the external API
	const detailsUrl = `${baseUrl}?api_key=${apiKey}&language=en-US`;
	const videosUrl = `${baseUrl}/videos?api_key=${apiKey}&language=en-US`;

	try {
		const [detailsResponse, videosResponse] = await Promise.all([
			fetch(detailsUrl),
			fetch(videosUrl)
		]);

		if (!detailsResponse.ok || !videosResponse.ok) {
			throw new Error('Failed to fetch data');
		}

		const detailsData = await detailsResponse.json();
		const videosData = await videosResponse.json();

		console.log(detailsData)

		const { error: insertDetailedFilmError } = await supabase
			.from('film_detailed')
			.insert([
				{
					id: detailsData.id,
					created_at: new Date(),
					belongs_to_collection: detailsData.belongs_to_collection,
					budget: detailsData.budget,
					genres: detailsData.genres,
					homepage: detailsData.homepage,
					imdb_id: detailsData.imdb_id,
					original_country: detailsData.production_countries,
					overview: detailsData.overview,
					production_companies: detailsData.production_companies,
					production_countries: detailsData.production_countries, 
					revenue: detailsData.revenue,
					runtime: detailsData.runtime,
					spoken_languages: detailsData.spoken_languages,
					status: detailsData.status,
					tagline: detailsData.tagline,
					videos: videosData.results 
				},
			]);

		if (insertDetailedFilmError) {
			console.error('Error inserting data into Supabase:', insertDetailedFilmError);
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
			error: true
		};
	}
}
