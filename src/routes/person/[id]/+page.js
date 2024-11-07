import { supabase } from '../../../lib/db/supabaseClient';
import { TMDB_API_KEY } from '../../../lib/utils';

export async function load({ fetch, params }) {
	try {
		const personId = params.id;

		// Check if the person already exists in the person_detailed table
		const { data: existingPerson, error: fetchError } = await supabase
			.from('person_detailed')
			.select('*')
			.eq('id', personId)
			.single();

		if (fetchError) {
			console.error('Error checking person in Supabase:', fetchError);
		}

		// If person is not in the table, fetch from the TMDB API and insert into Supabase
		if (!existingPerson) {
			const personUrl = `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=en-US`;
			const personMoviesUrl = `https://api.themoviedb.org/3/person/${personId}/tagged_images?api_key=${TMDB_API_KEY}&language=en-US`;
			const personImagesUrl = `https://api.themoviedb.org/3/person/${personId}/images?api_key=${TMDB_API_KEY}&language=en-US`;

			const [personDataResponse, personMoviesResponse, personImagesResponse] = await Promise.all([
				fetch(personUrl),
				fetch(personMoviesUrl),
				fetch(personImagesUrl)
			]);

			if (!personDataResponse.ok || !personMoviesResponse.ok || !personImagesResponse.ok) {
				throw new Error('Failed to fetch person data from TMDB');
			}

			const personData = await personDataResponse.json();
			const personMovies = await personMoviesResponse.json();
			const personImages = await personImagesResponse.json();

			// Prepare the data for insertion
			const personDetailedData = {
				id: personData.id,
				also_known_as: personData.also_known_as,
				biography: personData.biography,
				birthday: personData.birthday,
				deathday: personData.deathday,
				gender: personData.gender,
				homepage: personData.homepage,
				imdb_id: personData.imdb_id,
				known_for_department: personData.known_for_department,
				name: personData.name,
				place_of_birth: personData.place_of_birth,
				popularity: personData.popularity,
				profile_path: personData.profile_path,
				created_at: new Date(),
				movies: personMovies,
				images: personImages
			};

			// Insert into the person_detailed table
			const { error: insertError } = await supabase
				.from('person_detailed')
				.insert([personDetailedData]);

			if (insertError) {
				console.error('Error inserting person data into Supabase:', insertError);
			}

			return {
				person: personDetailedData
			};
		}

		// If the person already exists, return the existing data
		return {
			person: existingPerson
		};
	} catch (error) {
		console.error('Error loading person data:', error);
		return {
			person: null,
			error: true
		};
	}
}
