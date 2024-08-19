import { supabase } from '../utils/db/supabaseClient';

export async function load({ fetch, url }) {
    // Get the page number from the query parameters (default to 1 if not present)
    const page = parseInt(url.searchParams.get('page')) || 1;

    // Check if the page exists in Supabase
    let { data: films, error } = await supabase
        .from('films')
        .select('*')
        .eq('page', page);

    if (error) {
        console.error('Error fetching from Supabase:', error);
        films = null;
    }

    // If films data is found in Supabase, return it
    if (films && films.length > 0) {
        return {
            data: { results: films }
        };
    }

    // If not found, fetch from TMDB API
    const apiUrl = `https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=${page}`;
    const res = await fetch(apiUrl);

    if (res.ok) {
        const data = await res.json();

        // Store fetched data into Supabase
        const filmsToInsert = data.results.map((movie) => ({
            id: movie.id,
            adult: movie.adult,
            backdrop_path: movie.backdrop_path,
            genre_ids: movie.genre_ids,
            original_language: movie.original_language,
            original_title: movie.original_title,
            popularity: movie.popularity,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            title: movie.title,
            video: movie.video,
            vote_average: movie.vote_average,
            vote_count: movie.vote_count,
            page: page // Ensure the page number is stored
        }));

        const { error: insertError } = await supabase
            .from('films')
            .insert(filmsToInsert);

        if (insertError) {
            console.error('Error inserting into Supabase:', insertError);
        }

        return {
            data
        };
    }

    throw new Error('Failed to load data');
}
