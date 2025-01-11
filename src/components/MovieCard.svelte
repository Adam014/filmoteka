<script>
	import { onMount, afterUpdate } from 'svelte';
	import { user } from '../stores/user';
	import { supabase } from '../lib/db/supabaseClient';
	import { createEventDispatcher } from 'svelte';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';

	export let movie;
	export let showNotAvailable = false; // Flag to conditionally show the overlay

	let isFavorite = false;
	let currentUser = null;

	const dispatch = createEventDispatcher();

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
		checkIfFavorite(); // Initial check when the component is mounted
	});

	// Ensure we clean up the subscription
	onMount(() => {
		return () => unsubscribe();
	});

	// Check if the movie is already marked as favorite
	async function checkIfFavorite() {
		if (!currentUser || !movie) {
			isFavorite = false;
			return;
		}

		try {
			const { data, error } = await supabase.storage.from('favorites').list(currentUser.email);

			if (error) {
				console.error('Error fetching favorites:', error.message);
				isFavorite = false;
				return;
			}

			// Match movie ID in favorites
			isFavorite = data.some((file) => file.name === `${movie.id}.json`);
		} catch (err) {
			console.error('Error checking favorite status:', err.message);
			isFavorite = false;
		}
	}

	// Toggle favorite status for the current movie
	async function toggleFavorite() {
		if (!currentUser) {
			goto('/login');
			return;
		}

		const path = `${currentUser.email}/${movie?.id}.json`;

		if (isFavorite) {
			const { error } = await supabase.storage.from('favorites').remove([path]);
			if (error) console.error('Error removing favorite:', error.message);
			toast.success(`${movie.title || movie.media?.title} removed from favorites.`);
		} else {
			const { error } = await supabase.storage
				.from('favorites')
				.upload(path, JSON.stringify({ id: movie?.id, data: movie }), {
					contentType: 'application/json'
				});
			if (error) console.error('Error adding favorite:', error.message);
			toast.success(`${movie.title || movie.media?.title} added to favorites.`);
		}

		isFavorite = !isFavorite;

		// Dispatch an event if the movie was unfavorited
		if (!isFavorite) {
			dispatch('unfavorite', movie.id);
		}
	}

	// Re-check favorite status whenever the movie changes
	afterUpdate(() => {
		checkIfFavorite();
	});

	$: movieId = /^\d+$/.test(movie?.id) ? movie.id : movie?.media?.id;
	let isMovieType = movie?.media_type === 'movie';
</script>

<div class="movie-card">
	{#if showNotAvailable && !isMovieType}
		<!-- Render the overlay when showNotAvailable is true and the type isn't "movie" -->
		{#if movie?.poster_path || movie?.file_path}
			<img
				src={`https://image.tmdb.org/t/p/w500${movie?.poster_path || movie?.file_path}`}
				alt={movie?.title || movie?.media?.title}
				class="movie-image"
			/>
		{:else}
			<div class="placeholder-image">
				<span class="">{movie?.title || movie?.media?.title || 'Unknown'}</span>
			</div>
		{/if}
		<div class="not-available-overlay">Not Available on Filmoteka</div>
	{:else}
		<!-- Render the link and favorite icon normally if type is "movie" or showNotAvailable is false -->
		<a href={`/movie/${movieId}`}>
			{#if movie?.poster_path || movie?.file_path}
				<img
					src={`https://image.tmdb.org/t/p/w500${movie?.poster_path || movie?.file_path}`}
					alt={movie?.title || movie?.media?.title}
					class="movie-image"
				/>
			{:else}
				<div class="placeholder-image">
					<span class=""><p>{movie?.title || movie?.media?.title || 'Unknown'}</p></span>
				</div>
			{/if}
		</a>
		<div class="favorite-icon" on:click={toggleFavorite} class:isFavorite>
			{isFavorite ? '★' : '☆'}
		</div>
	{/if}
</div>

<style>
	span p {
		font-size: 20px;
		text-align: center;
	}

	.movie-card a {
		text-decoration: none;
	}

	.placeholder-image {
		width: 100%;
		height: 100%;
		background-color: #444; /* Fallback background color */
		color: #fff;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 36px;
		font-weight: bold;
		border-radius: 8px;
	}

	.movie-card {
		display: block;
		position: relative;
		overflow: hidden;
		border-radius: 20px;
		height: 20rem;
		margin: 10px;
		width: 15rem;
		transition: all 0.5s ease-in-out;
	}

	.favorite-icon {
		position: absolute;
		right: 15px;
		font-size: 2rem;
		cursor: pointer;
		color: rgba(255, 215, 0, 0.8);
		text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.6);
		transition: color 0.3s ease, transform 0.3s ease;
	}

	.favorite-icon.isFavorite {
		color: gold;
	}

	.favorite-icon:hover {
		transform: scale(1.1);
		color: gold;
	}

	a img,
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		top: 0;
		left: 0;
		transition: transform 0.5s ease;
	}

	a:hover img {
		transform: scale(1.05);
	}

	.not-available-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		color: #ff5555;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
		text-align: center;
		border-radius: 20px;
	}

	@media screen and (max-width: 1024px) {
		.movie-card {
			height: 15rem;
			width: 9rem;
		}
	}
</style>
