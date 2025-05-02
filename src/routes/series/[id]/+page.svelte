<script>
	import { onMount } from 'svelte';
	import { getBestAvailableVideoWithCheck, formatCurrency } from '../../../lib/utils';
	import Loader from '../../../components/Loader.svelte';
	import { supabase } from '../../../lib/db/supabaseClient';
	import toast from 'svelte-french-toast';
	import { user } from '../../../stores/user';
	import PersonCard from '../../../components/PersonCard.svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	export let data;

	let currentUser;
	let movieDetails = {};
	let movieTrailer = null;
	let cast = [];
	let crew = [];
	let topActors = [];
	let directors = [];
	let isFavorite = false;
	let finalTrailer = null;
	let isLoading = true;
	let isPlaying = false;
	let shouldShowContent = true;
	let heroElement;
	let videoLoaded = false;

	// Initialize variables with default values
	let id = 'N/A';
	let original_title = 'N/A';
	let original_language = 'N/A';
	let status = 'N/A';
	let release_date = 'N/A';
	let tagline = '';
	let revenue = 0;
	let genres = [];
	let budget = 0;
	let adult = false;
	let imdb_id = 'N/A';
	let overview = 'No overview available.';
	let production_companies = [];
	let production_countries = [];
	let homepage = '';
	let poster_path = '';
	let popularity = 0;
	let formattedBudget;
	let formattedRevenue;
	// Seriálové specifické proměnné
	let created_by;
	let episode_run_time;
	let first_air_date;
	let last_air_date;
	let last_episode_to_air;
	let networks;
	let next_episodes_to_air;
	let number_episodes;
	let number_seasons;
	let season;
	let type;

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	// Reactively update variables when `data` changes
	$: if (data) {
		movieDetails = data.details || {};
		movieTrailer = data.trailer || [];
		cast = data.credits?.cast || [];
		crew = data.credits?.crew || [];

		// Update top actors and directors
		topActors = cast
			.filter((actor) => actor.known_for_department === 'Acting')
			.sort((a, b) => b.popularity - a.popularity)
			.slice(0, 20);

		directors = crew.filter((director) => director.job === 'Director');

		// Update destructured variables
		id = movieDetails.id || 'N/A';
		original_title = movieDetails.original_title || movieDetails.name || 'N/A';
		original_language = movieDetails.original_language || 'N/A';
		status = movieDetails.status || 'N/A';
		release_date = movieDetails.release_date || movieDetails.first_air_date || 'N/A';
		tagline = movieDetails.tagline || '';
		revenue = movieDetails.revenue;
		genres = movieDetails.genres || [];
		budget = movieDetails.budget;
		adult = movieDetails.adult || false;
		imdb_id = movieDetails.imdb_id || 'N/A';
		overview = movieDetails.overview || 'No overview available.';
		production_companies = movieDetails.production_companies || [];
		production_countries = movieDetails.production_countries || [];
		homepage = movieDetails.homepage || '';
		poster_path = movieDetails.poster_path || '';
		popularity = movieDetails.popularity || 0;
		created_by = movieDetails.created_by || null;
		episode_run_time = movieDetails.episode_run_time || null;
		first_air_date = movieDetails.first_air_date || null;
		last_air_date = movieDetails.last_air_date || null;
		last_episode_to_air = movieDetails.last_episode_to_air || null;
		networks = movieDetails.networks || null;
		next_episodes_to_air = movieDetails.next_episodes_to_air || null;
		number_episodes = movieDetails.number_episodes || null;
		number_seasons = movieDetails.number_seasons || null;
		season = movieDetails.season || null;
		type = movieDetails.type || null;

		formattedBudget = formatCurrency(budget);
		formattedRevenue = formatCurrency(revenue);

		// Fetch the best available video and check if the movie is a favorite
		fetchBestAvailableVideo();
		checkIfFavorite();
	}

	function togglePlayVideo() {
		if (!finalTrailer) return;

		isPlaying = true;
		shouldShowContent = false;

		// Scroll to top smoothly when play is clicked
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleVideoClose() {
		isPlaying = false;
		setTimeout(() => {
			shouldShowContent = true;
		}, 300); // Short delay to allow the exit animation to play
	}

	async function fetchBestAvailableVideo() {
		isLoading = true;

		try {
			// Fetch the best trailer using the utility function
			const bestVideo = await getBestAvailableVideoWithCheck(movieDetails.id, false);

			if (!bestVideo) {
				// Only show toast here
				toast.error('No suitable trailer found.');
				return;
			}

			if (bestVideo) {
				// Save the trailer key to Supabase
				const { data, error } = await supabase
					.from('film_detailed')
					.update({ trailer: bestVideo.key })
					.eq('id', movieDetails.id);

				if (error) {
					console.error('Error saving trailer to Supabase:', error.message);
					toast.error('Failed to save trailer.');
				} else {
					finalTrailer = bestVideo;
				}
			}
		} catch (error) {
			console.error('Error fetching the best trailer:', error);
			toast.error('Failed to fetch trailer.');
		} finally {
			isLoading = false;
		}
	}

	async function checkIfFavorite() {
		if (currentUser) {
			const { data, error } = await supabase.storage
				.from('favorites')
				.list(currentUser.email, { search: id.toString() });

			isFavorite = data && data?.length > 0;
		}
	}

	async function toggleFavorite() {
		const path = `${currentUser.email}/${movieDetails.id}.json`;

		try {
			if (isFavorite) {
				const { error } = await supabase.storage.from('favorites').remove([path]);
				if (error) throw error;
				isFavorite = false;
				toast.success(`${original_title} removed from favorites.`);
			} else {
				const { data: filmData, error: fetchError } = await supabase
					.from('films')
					.select('*')
					.eq('id', movieDetails.id)
					.single();

				if (fetchError) throw fetchError;

				const favoriteData = {
					id: movieDetails.id,
					data: filmData
				};

				const { error: uploadError } = await supabase.storage
					.from('favorites')
					.upload(path, JSON.stringify(favoriteData), {
						upsert: true,
						contentType: 'application/json'
					});
				if (uploadError) throw uploadError;

				isFavorite = true;
				toast.success(`${original_title} added to favorites.`);
			}
		} catch (err) {
			console.error('Error toggling favorite:', err.message);
			toast.error('Failed to update favorites.');
		}
	}

	onMount(() => {
		fetchBestAvailableVideo();
		checkIfFavorite();

		return () => unsubscribe();
	});
</script>

<svelte:head>
	<title>{original_title} | Filmoteka</title>
</svelte:head>

<div class="movie-page">
	<!-- Hero Section with Trailer Background -->
	<div class="hero-section" bind:this={heroElement}>
		{#if finalTrailer && isPlaying}
			<div
				class="fullscreen-video-container"
				transition:scale={{ duration: 600, easing: cubicOut }}
			>
				<button class="close-video-btn" on:click={handleVideoClose}>
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path
							d="M18 6L6 18M6 6L18 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>

				<iframe
					title="youtube-video-player"
					src={`https://www.youtube.com/embed/${finalTrailer.key}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				/>
			</div>
		{:else}
			<!-- Background Video (Muted, Looping) or Poster Fallback -->
			<div class="background-media">
				{#if finalTrailer}
					<div class="background-video-container">
						<iframe
							title="background-trailer"
							class="background-video"
							on:load={() => (videoLoaded = true)}
							src={`https://www.youtube.com/embed/${finalTrailer.key}?autoplay=1&mute=1&loop=1&controls=0&disablekb=1&playlist=${finalTrailer.key}`}
							frameborder="0"
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
						/>
					</div>
				{/if}

				<!-- Gradient Overlay -->
				<div class="hero-overlay" />

				<!-- Poster Fallback (visible while video loads or if no video) -->
				<div
					class="poster-fallback"
					style={poster_path
						? `background-image: url(https://image.tmdb.org/t/p/original${poster_path})`
						: ''}
					class:fade-out={finalTrailer && videoLoaded}
				/>
			</div>
		{/if}

		<!-- Hero Content -->
		{#if shouldShowContent}
			<div class="hero-content" in:fade={{ duration: 400, delay: isPlaying ? 300 : 0 }}>
				<h1 class="movie-title">{original_title}</h1>
				{#if tagline}
					<p class="movie-tagline">"{tagline}"</p>
				{/if}

				<div class="movie-meta">
					{#if first_air_date !== 'N/A' && first_air_date !== null}
						<span class="meta-item year">{first_air_date.split('-')[0]}</span>
					{:else if release_date !== 'N/A'}
						<span class="meta-item year">{release_date.split('-')[0]}</span>
					{/if}

					{#if genres.length > 0}
						<span class="meta-item dot-separator">•</span>
						<span class="meta-item genres">
							{genres.map((g) => g.name).join(', ')}
						</span>
					{/if}

					{#if adult}
						<span class="meta-item dot-separator">•</span>
						<span class="meta-item adult-badge">18+</span>
					{/if}
				</div>

				<div class="action-buttons">
					{#if finalTrailer}
						<button class="btn btn-primary pulse" on:click={togglePlayVideo}>
							<span class="icon">▶</span> Watch Trailer
						</button>
					{/if}
					<button class="btn btn-secondary" on:click={toggleFavorite}>
						<span class="icon">{isFavorite ? '★' : '+'}</span>
						{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Main Content (Only show when not playing fullscreen video) -->
	{#if shouldShowContent}
		<div class="content-container" in:fade={{ duration: 400, delay: 200 }}>
			{#if isLoading}
				<div class="loader-container">
					<Loader />
				</div>
			{:else}
				<!-- Overview Section -->
				<section class="section overview-section">
					<div class="section-header">
						<h2 class="section-title">About the Series</h2>
						<div class="title-underline" />
					</div>
					<div class="section-grid">
						<div class="main-content">
							<p class="overview-text">{overview}</p>

							{#if created_by?.length > 0}
								<div class="creators">
									<span class="creator-label">Created by:</span>
									<span class="creator-names">{created_by.map((d) => d.name).join(', ')}</span>
								</div>
							{:else if directors?.length > 0}
								<div class="creators">
									<span class="creator-label">Director:</span>
									<span class="creator-names">{directors.map((d) => d.name).join(', ')}</span>
								</div>
							{/if}
						</div>

						<div class="movie-details-sidebar">
							{#if imdb_id !== 'N/A'}
								<div class="detail-item">
									<span class="detail-label">IMDB</span>
									<span class="detail-value">
										<a
											href={`https://www.imdb.com/title/${imdb_id}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											{imdb_id}
										</a>
									</span>
								</div>
							{/if}

							{#if original_language !== 'N/A'}
								<div class="detail-item">
									<span class="detail-label">Original Language</span>
									<span class="detail-value">{original_language.toUpperCase()}</span>
								</div>
							{/if}

							{#if number_seasons > 0}
								<div class="detail-item">
									<span class="detail-label">Seasons</span>
									<span class="detail-value highlight">{number_seasons}</span>
								</div>
							{/if}

							{#if number_episodes > 0}
								<div class="detail-item">
									<span class="detail-label">Episodes</span>
									<span class="detail-value highlight">{number_episodes}</span>
								</div>
							{/if}

							{#if episode_run_time && episode_run_time.length > 0}
								<div class="detail-item">
									<span class="detail-label">Episode Runtime</span>
									<span class="detail-value">{episode_run_time[0]} min</span>
								</div>
							{/if}

							{#if first_air_date}
								<div class="detail-item">
									<span class="detail-label">First Air Date</span>
									<span class="detail-value">{first_air_date}</span>
								</div>
							{/if}

							{#if last_air_date}
								<div class="detail-item">
									<span class="detail-label">Last Air Date</span>
									<span class="detail-value">{last_air_date}</span>
								</div>
							{/if}

							{#if status !== 'N/A'}
								<div class="detail-item">
									<span class="detail-label">Status</span>
									<span class="detail-value">{status}</span>
								</div>
							{/if}

							{#if networks && networks.length > 0}
								<div class="detail-item">
									<span class="detail-label">Networks</span>
									<span class="detail-value">{networks.map((n) => n.name).join(', ')}</span>
								</div>
							{/if}

							{#if type}
								<div class="detail-item">
									<span class="detail-label">Type</span>
									<span class="detail-value">{type}</span>
								</div>
							{/if}
						</div>
					</div>
				</section>

				<!-- Cast Section -->
				{#if topActors.length > 0}
					<section class="section cast-section">
						<div class="section-header">
							<h2 class="section-title">Cast</h2>
							<div class="title-underline" />
						</div>

						<div class="cards-container">
							{#each topActors as actor}
								<PersonCard person={actor} />
							{/each}
						</div>
					</section>
				{/if}

				<!-- Production Info Section -->
				<section class="section production-section">
					<div class="section-header">
						<h2 class="section-title">Production Information</h2>
						<div class="title-underline" />
					</div>

					<div class="production-grid">
						{#if production_companies?.length > 0}
							<div class="production-column">
								<h3 class="subsection-title">Production Companies</h3>
								<ul class="production-list">
									{#each production_companies as company}
										<li class="production-item">
											{company.name}
											{company.origin_country ? `(${company.origin_country})` : ''}
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if production_countries?.length > 0}
							<div class="production-column">
								<h3 class="subsection-title">Production Countries</h3>
								<ul class="production-list">
									{#each production_countries as country}
										<li class="production-item">
											{country.name} ({country.iso_3166_1})
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Global Styles */
	.movie-page {
		width: 100%;
		min-height: 100vh;
		background-color: #0f0f0f;
		color: #f5f5f5;
	}

	/* Hero Section Styles */
	.hero-section {
		position: relative;
		height: 90vh;
		width: 100%;
		overflow: hidden;
	}

	.background-media {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.background-video-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.background-video {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		height: 100%;
		transform: translate(-50%, -50%);
		object-fit: cover;
		pointer-events: none;
	}

	.poster-fallback {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		transition: opacity 1s ease;
		z-index: 1;
	}

	.poster-fallback.fade-out {
		opacity: 0;
	}

	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			0deg,
			#0f0f0f 0%,
			rgba(15, 15, 15, 0.7) 50%,
			rgba(15, 15, 15, 0.3) 100%
		);
		z-index: 2;
	}

	.hero-content {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-bottom: 4rem;
		padding: 0 1.5rem;
		height: 100%;
		z-index: 3;
		text-align: center;
	}

	.movie-title {
		font-size: 3.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.movie-tagline {
		font-size: 1.5rem;
		font-style: italic;
		opacity: 0.9;
		margin-bottom: 1.5rem;
		text-shadow: 0 2px 3px rgba(0, 0, 0, 0.5);
	}

	.movie-meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}

	.dot-separator {
		color: rgba(255, 255, 255, 0.7);
	}

	.adult-badge {
		background-color: #ff006e;
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		border-radius: 30px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		font-size: 1rem;
	}

	.btn-primary {
		background: linear-gradient(135deg, #3a86ff, #8338ec);
		color: white;
	}

	.btn-primary:hover {
		background: linear-gradient(135deg, #2176ff, #722ddb);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(51, 51, 51, 0.3);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.icon {
		margin-right: 0.5rem;
	}

	/* Fullscreen Video */
	.fullscreen-video-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.95);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fullscreen-video-container iframe {
		width: 90%;
		height: 80%;
		max-width: 1200px;
		max-height: 675px;
	}

	.close-video-btn {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 50%;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		z-index: 1001;
		color: white;
		transition: all 0.3s ease;
	}

	.close-video-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: scale(1.1);
	}

	.close-video-btn svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	/* Main Content Styles */
	.content-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 3rem 1.5rem;
	}

	.loader-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 300px;
	}

	.section {
		margin-bottom: 4rem;
	}

	.section-header {
		margin-bottom: 2rem;
		position: relative;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}

	.title-underline {
		height: 3px;
		width: 60px;
		background: linear-gradient(90deg, #3a86ff, #8338ec);
		border-radius: 3px;
	}

	.section-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
	}

	.pulse {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(51, 153, 255, 0.7);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(51, 153, 255, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(51, 153, 255, 0);
		}
	}

	.overview-text {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	.creators {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		font-size: 1.1rem;
	}

	.creator-label {
		font-weight: 600;
		opacity: 0.8;
	}

	.movie-details-sidebar {
		background-color: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 1.5rem;
	}

	.detail-item {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
	}

	.detail-label {
		font-size: 0.9rem;
		opacity: 0.7;
		margin-bottom: 0.3rem;
	}

	.detail-value {
		font-size: 1.1rem;
	}

	.detail-value a {
		color: #3a86ff;
		text-decoration: none;
		transition: color 0.3s ease;
	}

	.detail-value a:hover {
		color: #ff006e;
		text-decoration: underline;
	}

	.highlight {
		color: #ff006e;
		font-weight: 600;
	}

	/* Cast Section */
	.cards-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1.5rem;
	}

	/* Production Section */
	.production-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
	}

	.subsection-title {
		font-size: 1.4rem;
		margin-bottom: 1rem;
		opacity: 0.9;
	}

	.production-list {
		list-style: none;
		padding: 0;
	}

	.production-item {
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.production-item:last-child {
		border-bottom: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.movie-title {
			font-size: 2.5rem;
		}

		.section-grid {
			grid-template-columns: 1fr;
		}

		.hero-content {
			padding: 0 1rem;
		}

		.action-buttons {
			flex-direction: column;
			width: 100%;
			max-width: 300px;
		}

		.btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.movie-title {
			font-size: 2rem;
		}

		.movie-tagline {
			font-size: 1.2rem;
		}

		.cards-container {
			grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		}
	}
</style>
