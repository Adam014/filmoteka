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

	// Get movie title for display
	$: movieTitle = movie?.title || movie?.media?.title || 'Unknown';
</script>

<div class="movie-card">
	{#if showNotAvailable && !isMovieType}
		<!-- Render the overlay when showNotAvailable is true and the type isn't "movie" -->
		{#if movie?.poster_path || movie?.file_path}
			<img
				src={`https://image.tmdb.org/t/p/w500${movie?.poster_path || movie?.file_path}`}
				alt={movieTitle}
				class="movie-image"
			/>
		{:else}
			<div class="placeholder-image">
				<span>{movieTitle}</span>
			</div>
		{/if}
		<div class="not-available-overlay">Not Available on Filmoteka</div>
	{:else}
		<!-- Render the link and favorite icon normally if type is "movie" or showNotAvailable is false -->
		<a href={`/movie/${movieId}`}>
			{#if movie?.poster_path || movie?.file_path}
				<img
					src={`https://image.tmdb.org/t/p/w500${movie?.poster_path || movie?.file_path}`}
					alt={movieTitle}
					class="movie-image"
				/>
			{:else}
				<div class="placeholder-image">
					<span>{movieTitle}</span>
				</div>
			{/if}

			<div class="gradient-overlay" />

			<div class="movie-title-overlay">
				<h3>{movieTitle}</h3>
				<div class="movie-details">
					<span class="watch-now">Watch Now</span>
				</div>
			</div>
		</a>

		<div class="favorite-icon" on:click={toggleFavorite} class:isFavorite>
			{isFavorite ? '★' : '☆'}
		</div>
	{/if}
</div>

<style>
	.movie-card {
		display: block;
		position: relative;
		overflow: hidden;
		border-radius: 1.2rem;
		height: 20rem;
		margin: 10px;
		width: 15rem;
		transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		transform-origin: center;
		background: linear-gradient(135deg, rgba(58, 134, 255, 0.2), rgba(131, 56, 236, 0.2));
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.movie-card:hover {
		transform: translateY(-10px) scale(1.02);
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
	}

	.movie-card a {
		text-decoration: none;
		color: inherit;
		position: relative;
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.placeholder-image {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, rgba(58, 134, 255, 0.3), rgba(131, 56, 236, 0.3));
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 1.5rem;
		font-weight: bold;
		border-radius: 1rem;
		text-align: center;
		padding: 1.5rem;
	}

	a img,
	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		top: 0;
		left: 0;
		transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
	}

	.movie-card:hover img {
		transform: scale(1.1);
		filter: brightness(1.1);
	}

	.gradient-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.9) 0%,
			rgba(0, 0, 0, 0.7) 30%,
			rgba(0, 0, 0, 0.1) 70%,
			rgba(0, 0, 0, 0) 100%
		);
		opacity: 0;
		transition: opacity 0.4s ease;
		z-index: 1;
	}

	.movie-card:hover .gradient-overlay {
		opacity: 1;
	}

	.movie-title-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 1.5rem;
		transform: translateY(20%);
		transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.4s ease;
		opacity: 0;
		z-index: 2;
	}

	.movie-card:hover .movie-title-overlay {
		transform: translateY(0);
		opacity: 1;
	}

	.movie-title-overlay h3 {
		margin: 0 0 0.8rem 0;
		font-size: 1.4rem;
		font-weight: 700;
		color: white;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
		line-height: 1.3;
	}

	.movie-details {
		display: flex;
		align-items: center;
		margin-top: 0.5rem;
	}

	.watch-now {
		display: inline-block;
		color: white;
		font-size: 0.9rem;
		font-weight: 600;
		background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		opacity: 0;
		transform: translateY(10px);
		transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s;
	}

	.movie-card:hover .watch-now {
		opacity: 1;
		transform: translateY(0);
	}

	.favorite-icon {
		position: absolute;
		top: 15px;
		right: 15px;
		font-size: 2.2rem;
		cursor: pointer;
		color: rgba(255, 215, 0, 0.8);
		text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7);
		transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		z-index: 10;
		-webkit-text-stroke: 1.5px rgba(0, 0, 0, 0.6);
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.favorite-icon.isFavorite {
		color: gold;
		transform: scale(1.1);
	}

	.favorite-icon:hover {
		transform: scale(1.25) rotate(10deg);
		color: gold;
		filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4));
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
		border-radius: 1.2rem;
	}

	@media screen and (max-width: 1024px) {
		.movie-card {
			height: 15rem;
			width: 10rem;
		}

		.movie-title-overlay {
			padding: 1rem;
		}

		.movie-title-overlay h3 {
			font-size: 1.1rem;
			margin-bottom: 0.5rem;
		}

		.watch-now {
			font-size: 0.8rem;
			padding: 0.4rem 0.8rem;
		}

		.favorite-icon {
			font-size: 1.8rem;
		}
	}

	@media screen and (max-width: 576px) {
		.movie-card {
			height: 12rem;
			width: 8rem;
			margin: 5px;
		}

		.movie-title-overlay {
			padding: 0.7rem;
		}

		.movie-title-overlay h3 {
			font-size: 0.9rem;
			margin-bottom: 0.3rem;
		}

		.watch-now {
			font-size: 0.7rem;
			padding: 0.3rem 0.6rem;
		}

		.favorite-icon {
			font-size: 1.6rem;
			top: 10px;
			right: 10px;
		}
	}
</style>
