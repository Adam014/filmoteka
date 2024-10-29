<script>
	import { onMount } from 'svelte';
	import { user } from '../stores/user';
	import { supabase } from '../lib/db/supabaseClient';
	import { createEventDispatcher } from 'svelte';

	export let movie;
	export let sizeClass; // Receive the size class from the parent

	let isFavorite = false;
	let currentUser = null;

	const dispatch = createEventDispatcher();

	// Subscribe to user authentication state
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
		checkIfFavorite(); // Check favorite status on load if the user is logged in
	});

	onMount(() => {
		return () => unsubscribe();
	});

	// Check if the movie is already a favorite
	async function checkIfFavorite() {
		if (currentUser) {
			const { data, error } = await supabase.storage
				.from('favorites')
				.list(currentUser.email, { search: movie?.id.toString() });

			isFavorite = data && data.length > 0;
		}
	}

	async function toggleFavorite() {
		if (!currentUser) return;

		const path = `${currentUser.email}/${movie?.id.toString()}.json`;

		if (isFavorite) {
			// Remove from favorites
			const { error } = await supabase.storage.from('favorites').remove([path]);
			if (error) console.error('Error removing favorite:', error.message);
		} else {
			// Add to favorites
			const { error } = await supabase.storage
				.from('favorites')
				.upload(path, JSON.stringify({ id: movie?.id, data: movie }), {
					contentType: 'application/json'
				});
			if (error) console.error('Error adding favorite:', error.message);
		}
		isFavorite = !isFavorite;

		// Dispatch an event if unfavorited to notify the parent
		if (!isFavorite) {
			dispatch('unfavorite', movie.id);
		}
	}
</script>

<div class={`movie-card ${sizeClass}`}>
	<a href={`/movie/${movie?.id}`}>
		<img src={'https://image.tmdb.org/t/p/w500' + movie?.poster_path} alt={movie?.title} />
	</a>
	{#if currentUser}
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
		border-radius: 20px;
		height: 100px;
		margin: 10px;
		width: calc(25% - 20px); /* Default width, transition will handle resizing */
		transition: all 0.5s ease-in-out; /* Smooth transition for movement and resizing */
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

	.movie-card.width1 {
		width: calc(25% - 20px);
	}
	.movie-card.width2 {
		width: calc(50% - 20px);
	}
	.movie-card.width3 {
		width: calc(75% - 20px);
	}

	a img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		top: 0;
		left: 0;
		transition: transform 0.5s ease; /* Smooth scaling on hover */
	}

	a:hover img {
		transform: scale(1.05);
	}
</style>
