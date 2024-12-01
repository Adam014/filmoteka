<script>
    import { page } from '$app/stores';
    import { supabase } from '$lib/db/supabaseClient';
  
    let challenge = null;
    const day = $page.params.day;
  
    // Fetch the daily challenge for the current day
    onMount(async () => {
      const { data, error } = await supabase
        .from('daily_challenge')
        .select('*')
        .eq('day', day)
        .single();
  
      if (error) {
        console.error('Error fetching challenge:', error);
      } else {
        challenge = data;
      }
    });
  </script>
  
  {#if challenge}
    <div class="challenge-container">
      <h1>Daily Challenge: Day {day}</h1>
      <img
        src={`https://image.tmdb.org/t/p/w500${challenge.poster_path}`}
        alt="Movie Poster"
      />
      <p>Release Date: {challenge.release_date}</p>
      <p>Country: {challenge.original_country?.join(', ')}</p>
      <p>Tagline: {challenge.tagline || 'No tagline available'}</p>
      <p>Genres: {challenge.genres?.map((g) => g.name).join(', ')}</p>
    </div>
  {:else}
    <p>Loading challenge...</p>
  {/if}
  
  <style>
    .challenge-container {
      text-align: center;
      color: white;
      background: #1a1a1a;
      padding: 20px;
      border-radius: 12px;
    }
  
    img {
      width: 300px;
      height: auto;
      margin: 20px 0;
      border-radius: 12px;
    }
  </style>
  