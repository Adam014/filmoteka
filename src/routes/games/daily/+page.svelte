<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { onMount } from 'svelte';
  
	let dailyChallenges = [];
  
	// Fetch all challenges
	onMount(async () => {
	  const { data, error } = await supabase
		.from('daily_challenge')
		.select('day, poster_path')
		.order('day', { ascending: true });
  
	  if (error) {
		console.error('Error fetching challenges:', error);
	  } else {
		dailyChallenges = data;
	  }
	});
  </script>
  
  <div class="daily-grid">
	{#each dailyChallenges as challenge}
	  <a href={`/games/daily/day-${challenge.day}`} class="daily-card">
		<img src={`https://image.tmdb.org/t/p/w500${challenge.poster_path}`} alt="Poster" />
		<span>Day {challenge.day}</span>
	  </a>
	{/each}
  </div>
  
  <style>
	.daily-grid {
	  display: grid;
	  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	  gap: 20px;
	  padding: 20px;
	}
  
	.daily-card {
	  text-align: center;
	  color: white;
	  text-decoration: none;
	  background: #2e073f;
	  padding: 10px;
	  border-radius: 12px;
	}
  
	.daily-card img {
	  width: 100%;
	  height: auto;
	  border-radius: 8px;
	}
  </style>
  