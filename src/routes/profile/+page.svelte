<script>
	import { user } from '../../stores/user';
	import { goto } from '$app/navigation';
	import Loader from '../../components/Loader.svelte';
	import MovieCard from '../../components/MovieCard.svelte';
	import { onMount, onDestroy } from 'svelte';

	// Import utility functions from utils.js
	import { fetchFavoriteMovies, formatDate } from '../../lib/utils.js';

	let currentUser;
	let favoriteMovies = []; // Array to hold favorite movies
	let loading = true;

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	onMount(async () => {
		if (!currentUser) {
			goto('/login');
		} else {
			favoriteMovies = await fetchFavoriteMovies(currentUser);
		}
		loading = false;
	});

	function handleUnfavorite(event) {
		const movieId = event.detail;
		favoriteMovies = favoriteMovies.filter((movie) => movie.data?.id !== movieId);
	}

	onDestroy(() => {
		unsubscribe();
	});
</script>


<svelte:head>
	<title>Profile | Filmoteka</title>
</svelte:head>

{#if currentUser}
	<div class="container">
		<div class="profile-container">
			<h1>Profile</h1>
			<div>
				{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
					<img
						src={currentUser.user_metadata.avatar_url}
						alt="Profile Picture"
						class="profile-picture"
					/>
				{:else}
					<span class="placeholder-icon">👤</span>
				{/if}
				<div class="profile-details">
					<p>Email: <b>{currentUser.email}</b></p>
					<p>Username: <b>{currentUser.user_metadata.display_name || 'Not set'}</b></p>
					<p>Created at: <b>{formatDate(currentUser.created_at)}</b></p>
					<p>Last sign in: <b>{formatDate(currentUser.last_sign_in_at)}</b></p>
				</div>
			</div>
		</div>
		<div class="favorites-container">
			{#if !loading && favoriteMovies.length > 0}
				<h2>Your Favorite Movies ({favoriteMovies.length})</h2>
				<div class="favorite-movies">
					{#each favoriteMovies as movie (movie.data?.id)}
						<MovieCard movie={movie.data} on:unfavorite={handleUnfavorite}/>
					{/each}
				</div>
			{:else if !loading && favoriteMovies.length === 0}
				<p>No favorite movies found.</p>
			{:else if loading}
				<Loader />
			{/if}
		</div>
		<!-- <div>
			{#if !loading}
				<h2>Your Favorite Actors</h2>
			{:else if !loading}
				<p>No favorite actors found.</p>
			{/if}
		</div> -->
	</div>
{:else}
	<Loader />
{/if}

<style>
	.container {
		display: flex;
		flex-direction: row;
		padding: 2rem 3rem;
		gap: 2rem;
	}

	.profile-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #222; 
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		max-width: 300px;
		text-align: center;
		color: #eee;
	}

	.profile-container h1 {
		font-size: 2.5rem;
		color: #fff;
		margin-bottom: 1.5rem;
	}

	.favorites-container {
		width: 90%;
		background-color: #222;
		height: auto;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.favorite-movies {
		display: flex;
		flex-wrap: wrap;
	}

	.profile-picture {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #7a1cac;
		margin-bottom: 1.5rem;
		transition: transform 0.3s ease;
	}

	.profile-details {
		font-size: 1rem;
		line-height: 1.6;
		width: 100%;
	}

	.profile-details p {
		margin: 0.5rem 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.profile-details p b {
		text-decoration: underline;
		margin-left: 0.5rem;
		white-space: nowrap; 
	}

	.placeholder-icon {
		font-size: 6rem;
		color: #555;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.8rem;
	}

	p {
		font-size: 1rem;
	}

	@media (max-width: 1024px) {
		.container {
			flex-direction: column;
			align-items: center;
			padding: 2rem 1rem;
		}

		.profile-container,
		.favorites-container {
			max-width: 90%;
			width: 100%;
			text-align: center;
		}

		.profile-picture {
			width: 150px;
			height: 150px;
		}

		h1,
		h2 {
			font-size: 2rem;
		}

		p {
			font-size: 0.9rem;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.favorite-movies {
			justify-content: center;
		}

		.profile-container {
			padding: 1.5rem;
		}

		.profile-container h1 {
			font-size: 2rem;
		}

		.profile-picture {
			width: 120px;
			height: 120px;
		}

		.profile-details {
			font-size: 0.9rem;
		}

		h1,
		h2 {
			font-size: 1.8rem;
		}

		p {
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		.profile-picture {
			width: 100px;
			height: 100px;
		}

		h1,
		h2 {
			font-size: 1.5rem;
		}

		p {
			font-size: 0.8rem;
		}

		.favorite-movies {
			gap: 0.5rem;
		}
	}
</style>
