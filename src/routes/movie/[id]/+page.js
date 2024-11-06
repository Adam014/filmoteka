import { supabase } from '../../../lib/db/supabaseClient';
import { TMDB_API_KEY, getDetailedMovie } from '../../../lib/utils';

export async function load({ fetch, params }) {
	try {
		// Check if the movie is already in the films table
		const { data: existingFilm, error: fetchError } = await supabase
			.from('films')
			.select('*')
			.eq('id', params.id)
			.single();

		// If the movie is not in the films table, fetch it from the API and insert it
		if (fetchError || !existingFilm) {
			const filmUrl = `https://api.themoviedb.org/3/movie/${params.id}?api_key=${TMDB_API_KEY}&language=en-US`;
			const filmResponse = await fetch(filmUrl);

			if (filmResponse.ok) {
				const filmData = await filmResponse.json();

				// Insert the movie into the films table
				const { error: insertFilmError } = await supabase.from('films').insert([
					{
						id: filmData.id,
						adult: filmData.adult,
						backdrop_path: filmData.backdrop_path,
						genre_ids: filmData.genres.map((genre) => genre.id),
						original_language: filmData.original_language,
						original_title: filmData.original_title,
						popularity: filmData.popularity,
						poster_path: filmData.poster_path,
						release_date: filmData.release_date,
						title: filmData.title,
						video: filmData.video,
						vote_average: filmData.vote_average,
						vote_count: filmData.vote_count
					}
				]);

				if (insertFilmError) {
					console.error('Error inserting film into Supabase:', insertFilmError);
				}
			} else {
				throw new Error('Failed to fetch movie data from TMDB');
			}
		}

		// Attempt to retrieve detailed data from the local database using getDetailedMovie
		let detailedData = await getDetailedMovie(params.id);

		// If detailed data exists but credits are missing, fetch and update credits
		if (detailedData && !detailedData.credits) {
			const creditsUrl = `https://api.themoviedb.org/3/movie/${params.id}/credits?api_key=${TMDB_API_KEY}&language=en-US`;
			const creditsResponse = await fetch(creditsUrl);

			if (creditsResponse.ok) {
				const creditsData = await creditsResponse.json();

				// Update only the credits field in film_detailed
				const { error: updateCreditsError } = await supabase
					.from('film_detailed')
					.update({ credits: creditsData })
					.eq('id', params.id);

				if (updateCreditsError) {
					console.error('Error updating credits in Supabase:', updateCreditsError);
				}

				// Update the local detailedData to include the new credits
				detailedData.credits = creditsData;
			} else {
				throw new Error('Failed to fetch credits data from TMDB');
			}
		}

		// If detailed data is found in the database, return it
		if (detailedData) {
			return {
				details: detailedData,
				videos: detailedData.videos || null,
				credits: detailedData.credits || null
			};
		}

		// If data is not found in the database, fetch it from the external API
		const baseUrl = `https://api.themoviedb.org/3/movie/${params.id}`;
		const detailsUrl = `${baseUrl}?api_key=${TMDB_API_KEY}&language=en-US`;
		const videosUrl = `${baseUrl}/videos?api_key=${TMDB_API_KEY}&language=en-US`;
		const creditsUrl = `${baseUrl}/credits?api_key=${TMDB_API_KEY}&language=en-US`;

		const [detailsResponse, videosResponse, creditsResponse] = await Promise.all([
			fetch(detailsUrl),
			fetch(videosUrl),
			fetch(creditsUrl)
		]);

		if (!detailsResponse.ok || !videosResponse.ok || !creditsResponse.ok) {
			throw new Error('Failed to fetch data from the external API');
		}

		const detailsData = await detailsResponse.json();
		const videosData = await videosResponse.json();
		const creditsData = await creditsResponse.json();

		// Only include columns present in film_detailed when inserting
		const filmDetailedData = {
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
			credits: creditsData, // Add credits data
			original_title: detailsData.title,
			release_date: detailsData.release_date
		};

		// Insert the filtered data into the film_detailed table
		const { error: insertDetailedError } = await supabase
			.from('film_detailed')
			.insert([filmDetailedData]);

		if (insertDetailedError) {
			console.error('Error inserting detailed data into Supabase:', insertDetailedError);
		}

		// Return the fetched detailed data
		return {
			details: detailsData,
			videos: videosData,
			credits: creditsData
		};
	} catch (error) {
		console.error('Error loading movie data:', error);
		return {
			details: null,
			videos: null,
			credits: null,
			error: true
		};
	}
}
