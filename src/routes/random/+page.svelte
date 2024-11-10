<script>
	import MovieCard from '../../components/MovieCard.svelte';
	import { supabase } from '../../lib/db/supabaseClient';
	import { onDestroy } from 'svelte';
	import { user } from '../../stores/user';
	import { toast } from 'svelte-french-toast';

	let movies = [];
	let isLoading = false;
	let currentUser;
	let movieCount = 1; // Default value

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	onDestroy(() => {
		unsubscribe();
	});

	// Check if a movie is a favorite
	async function checkIfFavorite(movie) {
		if (!currentUser) {
			return false;
		}

		try {
			const { data: favoriteFiles, error } = await supabase.storage
				.from('favorites')
				.list(currentUser.email);

			if (error) {
				console.error('Error fetching favorites:', error.message);
				return false;
			}

			return favoriteFiles.some((file) => file.name === `${movie.id}.json`);
		} catch (err) {
			console.error('Error checking favorite status:', err.message);
			return false;
		}
	}

	async function fetchRandomMovies() {
		try {
			isLoading = true;

			// Fetch random movies based on the count requested
			const { data: randomMovies, error } = await supabase.rpc('get_random_movies', {
				count: movieCount
			}); // Custom RPC function

			if (error) throw error;

			if (!randomMovies || randomMovies.length === 0) {
				toast.error('No random movies found.');
				movies = [];
				return;
			}

			// Update movies and their favorite status
			movies = await Promise.all(
				randomMovies.map(async (movie) => {
					movie.isFavorite = await checkIfFavorite(movie);
					return movie;
				})
			);
		} catch (error) {
			console.error('Error fetching random movies:', error.message);
			toast.error('Error fetching random movies:', error.message);
			movies = [];
		} finally {
			isLoading = false;
		}
	}

	// Reset favorites for the current movies when a movie's favorite status changes
	async function resetFavorites() {
		movies = await Promise.all(
			movies.map(async (movie) => {
				movie.isFavorite = await checkIfFavorite(movie);
				return movie;
			})
		);
	}

	// Handle manual movieCount selection
	function handleSelect(event) {
		movieCount = parseInt(event.target.value, 10);
	}
</script>

<svelte:head>
	<title>Random Movies | Filmoteka</title>
</svelte:head>

<section class="random-movie-section">
	<h1>Random Movies</h1>
	<div class="controls">
		<label for="movie-count">Number of Movies:</label>
		<select id="movie-count" on:change={handleSelect} class="custom-select">
			<option value="1" selected={movieCount === 1}>1</option>
			<option value="5" selected={movieCount === 5}>5</option>
			<option value="10" selected={movieCount === 10}>10</option>
			<option value="15" selected={movieCount === 15}>15</option>
			<option value="30" selected={movieCount === 30}>30</option>
		</select>
	</div>
	<button on:click={fetchRandomMovies} class="random-button">
		{isLoading ? 'Loading...' : 'Get Random Movies'}
	</button>

	{#if movies.length > 0}
		<div class="movies-display">
			{#each movies as movie}
				<MovieCard {movie} on:favorite={resetFavorites} />
			{/each}
		</div>
	{:else if !isLoading}
		<p class="placeholder">Click the button to get random movies!</p>
	{/if}
</section>

<style>
	.random-movie-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		text-align: center;
	}

	.controls {
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.controls label {
		font-size: 1.2rem;
		font-weight: bold;
	}

	.controls select {
		padding: 10px;
		font-size: 1rem;
		border-radius: 5px;
		border: 1px solid #ccc;
		background: #1e1e1e;
		color: white;
	}

	.random-button {
		background-color: #7a1cac;
		color: white;
		padding: 12px 24px;
		font-size: 1.2rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		margin: 20px 0;
	}

	.random-button:hover {
		background-color: #a05cd5;
	}

	.movies-display {
		margin-top: 20px;
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}

	.placeholder {
		color: #888;
		font-size: 1.2rem;
	}
</style>
