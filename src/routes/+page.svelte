<script>
	import { user } from '../stores/user';
	import { onDestroy, onMount } from 'svelte';
	import { supabase } from '../lib/db/supabaseClient';
	import RootMovies from '../components/Root.svelte';
	import Users from '../components/Users.svelte';
	import MovieGrid from '../components/MovieGrid.svelte';
	import PeopleGrid from '../components/PeopleGrid.svelte';
	import { goto } from '$app/navigation';
	import { countryToAlpha2 } from 'country-to-iso';

	export let data;

	const movies = data?.movies;
	const detailed_movies = data?.detailed_movies;
	const actors = data?.actors;
	const users = data?.users;
	const topRatedMovies = data?.topRatedMovies;
	const upcomingMovies = data?.upcomingMovies;
	const nowPlayingMovies = data?.nowPlayingMovies;
	const trendingMovies = data?.trendingMovies;
	const topRatedSeries = data?.topRatedSeries;

	let currentUser = null;
	let username;

	// Variable for GitHub repository last updated date
	let repoUpdatedDate = 'Loading...';

	// Subscribe to the user store
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
		username = value?.identities?.[0]?.identity_data?.display_name;
	});

	onDestroy(() => {
		unsubscribe();
	});

	let country = '';
	let error = '';
	let loading = true;

	onMount(async () => {
		if ('geolocation' in navigator) {
			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					try {
						const res = await fetch(
							`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
						);
						const data = await res.json();
						country = data.address?.country || 'Unknown';
						let iso = countryToAlpha2(country);
						goto(`?region=${iso}`, { replaceState: true });
					} catch (err) {
						error = 'Failed to retrieve location details';
					} finally {
						loading = false;
					}
				},
				(err) => {
					error = err.message;
					loading = false;
				}
			);
		} else {
			error = 'Geolocation is not supported by your browser.';
			loading = false;
		}
		// Fetch the GitHub repository last updated date
		try {
			const res = await fetch('https://api.github.com/repos/Adam014/filmoteka');
			const repoData = await res.json();
			// Use the updated_at field; new Date(...).toLocaleString() converts to the browser's local timezone.
			repoUpdatedDate = repoData.updated_at
				? new Date(repoData.updated_at).toLocaleString()
				: 'N/A';
		} catch (err) {
			console.error('Error fetching GitHub repo data:', err);
			repoUpdatedDate = 'Error fetching date';
		}
	});
</script>

<svelte:head>
	<title>Filmoteka - Your Movie Database</title>
	<meta name="description" content="Explore the latest movies, series, and actors with Filmoteka" />
</svelte:head>

<div class="root-container">
	<div class="hero-and-featured">
		<header class="hero">
			<div class="hero-content">
				<h1>Welcome, <span class="username">{username ? username : 'user'}</span>!</h1>
				<p class="hero-subtitle">Discover your next favorite movie with Filmoteka</p>
				<p class="update-info">Last updated: {repoUpdatedDate}</p>
			</div>
		</header>

		<section class="featured-section">
			<RootMovies {movies} {detailed_movies} />
		</section>
	</div>

	<div class="floating-button">
		<a href="/games/daily" aria-label="Daily Challenge">
			<button class="daily-challenge">
				<div class="button-content">
					<span class="challenge-text">Daily Challenge</span>
					<div class="challenge-icon">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M7 17L17 7M17 7H10M17 7V14"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</div>
			</button>
		</a>
	</div>

	<main class="content-grid">
		<section class="content-section">
			<div class="section-header">
				<h2 class="section-title">Trending Movies</h2>
				<div class="title-underline" />
			</div>
			<MovieGrid data={trendingMovies} headline={''} isMovie={true} />
		</section>

		<section class="content-section alt-section full-width">
			<div class="section-header">
				<h2 class="section-title">In Theaters in {country}</h2>
				<div class="title-underline light" />
			</div>
			<MovieGrid data={nowPlayingMovies} headline={''} isMovie={true} />
		</section>

		<section class="content-section">
			<div class="section-header">
				<h2 class="section-title">Top Rated Actors</h2>
				<div class="title-underline" />
			</div>
			<PeopleGrid data={actors} headline={''} />
		</section>

		<section class="content-section alt-section full-width">
			<div class="section-header">
				<h2 class="section-title">Top Rated Series</h2>
				<div class="title-underline light" />
			</div>
			<MovieGrid data={topRatedSeries} headline={''} isMovie={false} />
		</section>

		<section class="content-section">
			<div class="section-header">
				<h2 class="section-title">Top Rated Movies</h2>
				<div class="title-underline" />
			</div>
			<MovieGrid data={topRatedMovies} headline={''} isMovie={true} />
		</section>

		<section class="content-section alt-section full-width">
			<div class="section-header">
				<h2 class="section-title">Community Users</h2>
				<div class="title-underline light" />
			</div>
			<Users {users} />
		</section>

		<section class="content-section">
			<div class="section-header">
				<h2 class="section-title">Upcoming Movies in {country}</h2>
				<div class="title-underline" />
			</div>
			<MovieGrid data={upcomingMovies} headline={''} isMovie={true} />
		</section>
	</main>
</div>

<style>
	.root-container {
		max-width: 100%;
		overflow-x: hidden;
	}

	/* Hero and featured section combined */
	.hero-and-featured {
		position: relative;
		width: 100vw;
		margin-left: 50%;
		transform: translateX(-50%);
		max-width: 100%;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(5px);
	}

	/* Hero section */
	.hero {
		padding: 3rem 2rem 1rem;
		position: relative;
		text-align: center;
		z-index: 2;
	}

	.hero-content {
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero h1 {
		font-size: 3.5rem;
		font-weight: 800;
		margin-bottom: 0.75rem;
		background: var(--gradient-bg);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-decoration: none;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	.username {
		color: var(--secondary-color);
		text-decoration: underline;
		text-decoration-color: var(--accent-color);
		text-decoration-thickness: 3px;
		text-underline-offset: 4px;
	}

	.hero-subtitle {
		font-size: 1.5rem;
		color: var(--light-text);
		margin-bottom: 0.5rem;
		text-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
	}

	.update-info {
		font-size: 0.9rem;
		color: var(--gray-text);
		opacity: 0.7;
		margin-bottom: 0.5rem;
	}

	/* Featured section */
	.featured-section {
		padding: 0 2rem 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	/* Content grid layout */
	.content-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		max-width: 1400px;
		margin: 0 auto;
		padding: 3rem 2rem 0;
		gap: 4rem;
	}

	.full-width {
		width: 100vw;
		margin-left: 50%;
		transform: translateX(-50%);
		padding: 3rem 2rem;
	}

	.content-section {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Section header styling */
	.section-header {
		display: flex;
		flex-direction: column;
		margin-bottom: 1rem;
		position: relative;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.7rem 0;
		position: relative;
		display: inline-block;
		padding-bottom: 0.3rem;
	}

	.title-underline {
		height: 4px;
		width: 8rem;
		border-radius: 2px;
		background: var(--gradient-bg);
		margin-bottom: 1.5rem;
		position: relative;
		overflow: hidden;
	}

	.title-underline::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shine 3s infinite;
	}

	.title-underline.light {
		background: linear-gradient(90deg, var(--accent-color), var(--primary-color));
	}

	@keyframes shine {
		0% {
			left: -100%;
		}
		50% {
			left: 100%;
		}
		100% {
			left: 100%;
		}
	}

	.alt-section {
		position: relative;
		overflow: hidden;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
	}

	.alt-section::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(10, 10, 10, 0.3);
		z-index: -1;
	}

	/* Floating daily challenge button */
	.floating-button {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 100;
	}

	.daily-challenge {
		background: var(--gradient-bg);
		color: white;
		border: none;
		border-radius: 3rem;
		padding: 1rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 10px 30px rgba(51, 51, 51, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.button-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.challenge-text {
		white-space: nowrap;
	}

	.challenge-icon {
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.3s ease;
	}

	.challenge-icon svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.daily-challenge:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 35px rgba(131, 56, 236, 0.5);
	}

	.daily-challenge:hover .challenge-icon {
		transform: rotate(45deg);
	}

	a {
		text-decoration: none;
		color: inherit;
	}

	/* Responsive styles */
	@media (max-width: 1200px) {
		.hero h1 {
			font-size: 3rem;
		}

		.section-title {
			font-size: 1.8rem;
		}

		.content-grid {
			padding: 2rem 1.5rem 0;
			gap: 3rem;
		}

		.featured-section {
			padding: 0 1.5rem 2rem;
		}
	}

	@media (max-width: 900px) {
		.hero {
			padding: 2.5rem 1.5rem 1rem;
		}

		.hero h1 {
			font-size: 2.5rem;
		}

		.hero-subtitle {
			font-size: 1.2rem;
		}

		.featured-section {
			padding: 0 1.5rem 1.5rem;
		}

		.full-width {
			padding: 2.5rem 1.5rem;
		}

		.content-grid {
			gap: 2.5rem;
		}

		.section-title {
			font-size: 1.6rem;
		}
	}

	@media (max-width: 600px) {
		.hero {
			padding: 2rem 1rem 0.5rem;
		}

		.hero h1 {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.featured-section {
			padding: 0 1rem 1.5rem;
		}

		.content-grid {
			padding: 2rem 1rem 0;
			gap: 2rem;
		}

		.full-width {
			padding: 2rem 1rem;
		}

		.section-title {
			font-size: 1.4rem;
		}

		.title-underline {
			width: 6rem;
			height: 3px;
		}

		.daily-challenge {
			padding: 0.8rem 1.2rem;
			font-size: 0.9rem;
		}

		.challenge-icon {
			width: 1.8rem;
			height: 1.8rem;
		}

		.floating-button {
			bottom: 1.5rem;
			right: 1.5rem;
		}
	}
</style>
