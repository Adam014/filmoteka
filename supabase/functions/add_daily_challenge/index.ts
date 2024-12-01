import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
const supabaseKey = Deno.env.get('VITE_SUPABASE_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

export async function handler(req) {
  try {
    // Get the latest day
    const { data: lastChallenge, error: lastError } = await supabase
      .from('daily_challenge')
      .select('day')
      .order('day', { ascending: false })
      .limit(1)
      .single();

    const newDay = (lastChallenge?.day || 0) + 1;

    // Fetch a random popular movie
    const { data: movie, error: movieError } = await supabase
      .from('films')
      .select('id, release_date, poster_path, popularity')
      .gt('popularity', 50)
      .order('popularity', { ascending: false })
      .limit(1)
      .single();

    if (movieError || !movie) {
      throw new Error('Error fetching random movie: ' + movieError?.message);
    }

    // Fetch details for the selected movie
    const { data: details, error: detailsError } = await supabase
      .from('film_detailed')
      .select('original_country, credits, tagline, genres')
      .eq('id', movie.id)
      .single();

    if (detailsError || !details) {
      throw new Error('Error fetching movie details: ' + detailsError?.message);
    }

    // Insert into daily_challenge
    const { error: insertError } = await supabase.from('daily_challenge').insert({
      day: newDay,
      release_date: movie.release_date,
      original_country: details.original_country,
      credits: details.credits,
      tagline: details.tagline,
      genres: details.genres,
      poster_path: movie.poster_path,
    });

    if (insertError) {
      throw new Error('Error inserting into daily_challenge: ' + insertError.message);
    }

    return new Response(JSON.stringify({ message: `Daily Challenge for Day ${newDay} added successfully.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}