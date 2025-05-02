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
		original_title = movieDetails.original_title || 'N/A';
		original_language = movieDetails.original_language || 'N/A';
		status = movieDetails.status || 'N/A';
		release_date = movieDetails.release_date || 'N/A';
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
			const bestVideo = await getBestAvailableVideoWithCheck(movieDetails.id, true);

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
				toast.success(`${movieDetails.original_title} removed from favorites.`);
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
				toast.success(`${movieDetails.original_title} added to favorites.`);
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
			<div class="fullscreen-video-container" transition:scale={{duration: 600, easing: cubicOut}}>
				<button class="close-video-btn" on:click={handleVideoClose}>
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
				
				<iframe
					title="youtube-video-player"
					src={`https://www.youtube.com/embed/${finalTrailer.key}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
					frameborder="0"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
				></iframe>
			</div>
		{:else}
			<!-- Background Video (Muted, Looping) or Poster Fallback -->
			<div class="background-media">
				{#if finalTrailer}
					<div class="background-video-container">
						<iframe
							title="background-trailer"
							class="background-video"
							on:load={() => videoLoaded = true}
							src={`https://www.youtube.com/embed/${finalTrailer.key}?autoplay=1&mute=1&loop=1&controls=0&disablekb=1&playlist=${finalTrailer.key}`}
							frameborder="0"
							allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
						></iframe>
					</div>
				{/if}
				
				<!-- Gradient Overlay -->
				<div class="hero-overlay"></div>
				
				<!-- Poster Fallback (visible while video loads or if no video) -->
				<div class="poster-fallback" style={poster_path ? `background-image: url(https://image.tmdb.org/t/p/original${poster_path})` : ''} class:fade-out={finalTrailer && videoLoaded}></div>
			</div>
		{/if}
		
		<!-- Hero Content -->
		{#if shouldShowContent}
			<div class="hero-content" in:fade={{duration: 400, delay: isPlaying ? 300 : 0}}>
				<h1 class="movie-title">{original_title}</h1>
				{#if tagline}
					<p class="movie-tagline">"{tagline}"</p>
				{/if}
				
				<div class="movie-meta">
					{#if release_date !== 'N/A'}
						<span class="meta-item year">{release_date.split('-')[0]}</span>
					{/if}
					
					{#if genres.length > 0}
						<span class="meta-item dot-separator">•</span>
						<span class="meta-item genres">
							{genres.map(g => g.name).join(', ')}
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
		<div class="content-container" in:fade={{duration: 400, delay: 200}}>
			{#if isLoading}
				<div class="loader-container">
					<Loader />
				</div>
			{:else}
				<!-- Overview Section -->
				<section class="section overview-section">
					<div class="section-header">
						<h2 class="section-title">About the Movie</h2>
						<div class="title-underline"></div>
					</div>
					<div class="section-grid">
						<div class="main-content">
							<p class="overview-text">{overview}</p>
							
							{#if directors?.length > 0}
								<div class="creators">
									<span class="creator-label">Director:</span>
									<span class="creator-names">{directors.map(d => d.name).join(', ')}</span>
								</div>
							{/if}
						</div>
						
						<div class="movie-details-sidebar">
							{#if imdb_id !== 'N/A'}
								<div class="detail-item">
									<span class="detail-label">IMDB</span>
									<span class="detail-value">
										<a href={`https://www.imdb.com/title/${imdb_id}`} target="_blank" rel="noopener noreferrer">
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
							
							{#if budget > 0}
								<div class="detail-item">
									<span class="detail-label">Budget</span>
									<span class="detail-value highlight">{formattedBudget}</span>
								</div>
							{/if}
							
							{#if revenue > 0}
								<div class="detail-item">
									<span class="detail-label">Revenue</span>
									<span class="detail-value highlight">{formattedRevenue}</span>
								</div>
							{/if}
							
							{#if homepage}
								<div class="detail-item">
									<span class="detail-label">Official Website</span>
									<span class="detail-value">
										<a href={homepage} target="_blank" rel="noopener noreferrer" class="link-button">
											Visit <span class="link-icon">&#8599;</span>
										</a>
									</span>
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
							<div class="title-underline"></div>
						</div>
						<div class="cast-grid">
							{#each topActors as actor}
								<div in:fly={{y: 20, duration: 300, delay: 100 + topActors.indexOf(actor) * 50}}>
									<PersonCard person={actor} />
								</div>
							{/each}
						</div>
					</section>
				{/if}
				
				<!-- Production Info Section -->
				{#if production_companies.length > 0 || production_countries.length > 0}
					<section class="section production-section">
						<div class="section-header">
							<h2 class="section-title">Production</h2>
							<div class="title-underline"></div>
						</div>
						<div class="production-grid">
							{#if production_companies.length > 0}
								<div class="production-companies">
									<h3 class="subsection-title">Production Companies</h3>
									<ul class="production-list">
										{#each production_companies as company, i}
											<li class="production-item" in:fly={{x: -20, duration: 300, delay: 100 + i * 50}}>
												{company.name}
												{#if company.origin_country}
													<span class="country-code">({company.origin_country})</span>
												{/if}
											</li>
										{/each}
									</ul>
								</div>
							{/if}
							
							{#if production_countries.length > 0}
								<div class="production-countries">
									<h3 class="subsection-title">Countries of Origin</h3>
									<ul class="production-list">
										{#each production_countries as country, i}
											<li class="production-item" in:fly={{x: -20, duration: 300, delay: 100 + i * 50}}>
												{country.name}
											</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</section>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
	
	/* Global Styles */
	:global(body) {
		background-color: var(--bg, #1a1a1a);
		color: var(--text-color, #e5e5e5);
		font-family: 'Sarabun', sans-serif;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}
	
	/* Movie Page Styles */
	.movie-page {
		width: 100%;
		background-color: transparent;
		color: var(--text-color, #e5e5e5);
	}
	
	/* Hero Section with Background Video/Poster */
	.hero-section {
		position: relative;
		height: 100vh;
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
	
	.poster-fallback {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center 15%;
		background-repeat: no-repeat;
		transition: opacity 1.5s ease;
		z-index: 2;
	}
	
	.poster-fallback.fade-out {
		opacity: 0;
	}
	
	.background-video-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		height: 100%;
		z-index: 1;
		pointer-events: none;
		overflow: hidden;
	}
	
	.background-video {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100vw;
		height: 100vh;
		object-fit: cover;
	}
	
	.hero-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(58, 134, 255, 0.5) 0%,
			rgba(131, 56, 236, 0.5) 50%,
			rgba(26, 26, 26, 0.6) 100%
		), 
		linear-gradient(
			to bottom,
			rgba(26, 26, 26, 0.5) 0%,
			rgba(26, 26, 26, 0.7) 80%,
			var(--dark-bg, #121212) 100%
		);
		z-index: 3;
	}
	
	.hero-content {
		position: relative;
		width: 90%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		z-index: 4;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	
	.movie-title {
		font-size: 5rem;
		font-weight: 700;
		margin: 0;
		line-height: 1.1;
		background: var(--gradient-bg, linear-gradient(135deg, #3a86ff 0%, #8338ec 100%));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
		animation: textFadeIn 1s ease-out forwards;
	}
	
	@keyframes textFadeIn {
		0% {
			opacity: 0;
			transform: translateY(20px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.movie-tagline {
		font-size: 1.8rem;
		font-weight: 300;
		font-style: italic;
		margin: 1rem 0 2rem;
		opacity: 0;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
		animation: textFadeIn 1s ease-out 0.2s forwards;
	}
	
	.movie-meta {
		display: flex;
		align-items: center;
		margin-bottom: 2rem;
		font-size: 1.2rem;
		opacity: 0;
		animation: textFadeIn 1s ease-out 0.4s forwards;
	}
	
	.meta-item {
		color: #ddd;
	}
	
	.meta-item.year {
		color: var(--secondary-color, #ff006e);
		font-weight: 600;
	}
	
	.dot-separator {
		margin: 0 0.6rem;
		color: #ddd;
	}
	
	.adult-badge {
		background-color: var(--secondary-color, #ff006e);
		padding: 0.2rem 0.5rem;
		border-radius: 3px;
		font-size: 0.9rem;
		font-weight: 600;
	}
	
	.action-buttons {
		display: flex;
		gap: 1.2rem;
		opacity: 0;
		animation: textFadeIn 1s ease-out 0.6s forwards;
	}
	
	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem 2rem;
		border-radius: 4px;
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		letter-spacing: 0.5px;
	}
	
	.btn-primary {
		background: var(--gradient-bg, linear-gradient(135deg, #3a86ff 0%, #8338ec 100%));
		color: white;
		text-decoration: none;
		position: relative;
		overflow: hidden;
	}
	
	.btn-primary:hover {
		transform: translateY(-3px) scale(1.05);
		box-shadow: 0 15px 25px rgba(131, 56, 236, 0.4);
	}
	
	.btn-primary.pulse::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 150%;
		height: 150%;
		background: radial-gradient(circle, rgba(131, 56, 236, 0.4) 0%, transparent 70%);
		transform: translate(-50%, -50%);
		opacity: 0;
		animation: pulse 2s infinite;
	}
	
	@keyframes pulse {
		0% {
			transform: translate(-50%, -50%) scale(0.8);
			opacity: 0.5;
		}
		100% {
			transform: translate(-50%, -50%) scale(1.5);
			opacity: 0;
		}
	}
	
	.btn-secondary {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid var(--accent-color, #8338ec);
		backdrop-filter: blur(10px);
	}
	
	.btn-secondary:hover {
		background-color: rgba(131, 56, 236, 0.2);
		transform: translateY(-3px);
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
		max-width: 1280px;
		max-height: 720px;
		border: none;
		box-shadow: 0 0 30px rgba(131, 56, 236, 0.3);
		border-radius: 8px;
	}
	
	.close-video-btn {
		position: absolute;
		top: 2rem;
		right: 2rem;
		background: transparent;
		border: none;
		color: white;
		font-size: 2rem;
		cursor: pointer;
		z-index: 1001;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.3s ease;
	}
	
	.close-video-btn:hover {
		background-color: rgba(255, 255, 255, 0.1);
		transform: rotate(90deg);
	}
	
	.close-video-btn svg {
		width: 1.5rem;
		height: 1.5rem;
		stroke: white;
	}
	
	/* Content Container */
	.content-container {
		width: 90%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 2rem;
		position: relative;
	}
	
	.content-container::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100vw;
		height: 100%;
		background: radial-gradient(circle at 20% 50%, 
			rgba(51, 16, 117, 0.3) 0%, 
			rgba(13, 13, 13, 0.2) 100%
		);
		z-index: -1;
	}
	
	.loader-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 400px;
	}
	
	/* Sections */
	.section {
		margin-bottom: 6rem;
		opacity: 0;
		animation: sectionFadeIn 1.2s ease-out forwards;
	}
	
	@keyframes sectionFadeIn {
		0% {
			opacity: 0;
			transform: translateY(30px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.section-header {
		display: flex;
		flex-direction: column;
		margin-bottom: 2.5rem;
	}
	
	.section-title {
		font-size: 2.2rem;
		font-weight: 700;
		margin-bottom: 0.7rem;
		position: relative;
		background: var(--gradient-bg, linear-gradient(135deg, #3a86ff 0%, #8338ec 100%));
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}
	
	.title-underline {
		height: 4px;
		width: 8rem;
		border-radius: 2px;
		background: var(--gradient-bg, linear-gradient(135deg, #3a86ff 0%, #8338ec 100%));
		margin-bottom: 1rem;
		position: relative;
		overflow: hidden;
	}
	
	.title-underline::after {
		content: "";
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shine 3s infinite;
	}
	
	@keyframes shine {
		0% { left: -100%; }
		50% { left: 100%; }
		100% { left: 100%; }
	}
	
	.section-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 3rem;
	}
	
	/* Overview Section */
	.overview-text {
		font-size: 1.2rem;
		line-height: 1.8;
		color: #ddd;
		margin-bottom: 2rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	
	.creators {
		margin-top: 2rem;
		padding: 1.5rem;
		background-color: rgba(131, 56, 236, 0.1);
		border-radius: 8px;
		border-left: 3px solid var(--accent-color, #8338ec);
		backdrop-filter: blur(5px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}
	
	.creators:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 25px rgba(131, 56, 236, 0.2);
	}
	
	.creator-label {
		font-weight: 600;
		margin-right: 0.5rem;
		color: var(--accent-color, #8338ec);
	}
	
	.creator-names {
		color: #ddd;
	}
	
	/* Movie Details Sidebar */
	.movie-details-sidebar {
		padding: 2rem;
		background-color: rgba(18, 18, 18, 0.7);
		border-radius: 12px;
		height: fit-content;
		border: 1px solid rgba(131, 56, 236, 0.2);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
		transition: all 0.3s ease;
	}
	
	.movie-details-sidebar:hover {
		box-shadow: 0 15px 40px rgba(131, 56, 236, 0.15);
		border-color: rgba(131, 56, 236, 0.3);
	}
	
	.detail-item {
		margin-bottom: 1.8rem;
		display: flex;
		flex-direction: column;
	}
	
	.detail-item:last-child {
		margin-bottom: 0;
	}
	
	.detail-label {
		color: #aaa;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 1px;
	}
	
	.detail-value {
		font-size: 1.1rem;
	}
	
	.detail-value.highlight {
		color: var(--secondary-color, #ff006e);
		font-weight: 500;
	}
	
	.detail-value a {
		color: var(--primary-color, #3a86ff);
		text-decoration: none;
	}
	
	.detail-value a:hover {
		text-decoration: underline;
	}
	
	.link-button {
		display: inline-flex;
		align-items: center;
		padding: 0.7rem 1.2rem;
		background-color: rgba(131, 56, 236, 0.1);
		border-radius: 4px;
		transition: all 0.3s ease;
	}
	
	.link-button:hover {
		background-color: rgba(131, 56, 236, 0.2);
		text-decoration: none !important;
		transform: translateY(-3px);
	}
	
	.link-icon {
		margin-left: 0.5rem;
		font-size: 0.9rem;
	}
	
	/* Cast Section */
	.cast-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 2rem;
	}
	
	/* Production Section */
	.production-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 3rem;
	}
	
	.subsection-title {
		font-size: 1.4rem;
		margin-bottom: 1.5rem;
		color: var(--accent-color, #8338ec);
		font-weight: 600;
	}
	
	.production-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
	}
	
	.production-item {
		margin-bottom: 0.8rem;
		color: #bbb;
		padding: 1rem 1.5rem;
		background-color: rgba(18, 18, 18, 0.7);
		border-radius: 8px;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		border: 1px solid transparent;
	}
	
	.production-item:hover {
		background-color: rgba(131, 56, 236, 0.1);
		transform: translateY(-5px);
		border-color: rgba(131, 56, 236, 0.2);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
	}
	
	.country-code {
		color: #999;
		font-size: 0.9rem;
		margin-left: 0.5rem;
	}
	
	/* Responsive Styles */
	@media (max-width: 1280px) {
		.movie-title {
			font-size: 4rem;
		}
		
		.cast-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		}
	}
	
	@media (max-width: 1024px) {
		.movie-title {
			font-size: 3.5rem;
		}
		
		.section-grid {
			grid-template-columns: 1fr;
			gap: 2.5rem;
		}
		
		.movie-details-sidebar {
			order: -1;
		}
	}
	
	@media (max-width: 768px) {
		.hero-section {
			height: 85vh;
		}
		
		.hero-content {
			padding: 0 1.5rem;
			justify-content: center;
			padding-bottom: 4rem;
		}
		
		.movie-title {
			font-size: 2.5rem;
		}
		
		.movie-tagline {
			font-size: 1.3rem;
			margin: 0.7rem 0 1.5rem;
		}
		
		.action-buttons {
			flex-direction: column;
			gap: 1rem;
			width: 100%;
			max-width: 350px;
		}
		
		.btn {
			width: 100%;
			padding: 0.9rem 1.5rem;
		}
		
		.content-container {
			padding: 3rem 1.5rem;
			width: 95%;
		}
		
		.cast-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 1.5rem;
		}
		
		.production-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		
		.section-title {
			font-size: 1.8rem;
		}
		
		.section {
			margin-bottom: 4rem;
		}
		
		.fullscreen-video-container iframe {
			width: 95%;
			height: 40%;
		}
		
		.overview-text {
			font-size: 1.1rem;
			line-height: 1.6;
		}
	}
	
	@media (max-width: 480px) {
		.hero-section {
			height: 80vh;
		}
		
		.hero-content {
			padding: 0 1rem;
			padding-bottom: 3.5rem;
		}
		
		.movie-title {
			font-size: 2.2rem;
		}
		
		.movie-tagline {
			font-size: 1.1rem;
			margin: 0.5rem 0 1.2rem;
		}
		
		.movie-meta {
			flex-wrap: wrap;
			gap: 0.5rem;
			font-size: 0.9rem;
			margin-bottom: 1.5rem;
		}
		
		.dot-separator {
			display: none;
		}
		
		.meta-item {
			margin-right: 0.7rem;
		}
		
		.meta-item.genres {
			width: 100%;
			margin-top: 0.3rem;
		}
		
		.btn {
			font-size: 0.95rem;
			padding: 0.8rem 1.2rem;
		}
		
		.section-title {
			font-size: 1.6rem;
		}
		
		.title-underline {
			width: 5rem;
			height: 3px;
		}
		
		.overview-text {
			font-size: 1rem;
			line-height: 1.5;
		}
		
		.cast-grid {
			grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
			gap: 1rem;
		}
		
		.production-list {
			grid-template-columns: 1fr;
			gap: 0.7rem;
		}
		
		.production-item {
			padding: 0.8rem 1rem;
			margin-bottom: 0.5rem;
			font-size: 0.9rem;
		}
		
		.subsection-title {
			font-size: 1.2rem;
			margin-bottom: 1rem;
		}
		
		.close-video-btn {
			top: 1rem;
			right: 1rem;
			width: 2.2rem;
			height: 2.2rem;
		}
		
		.close-video-btn svg {
			width: 1.2rem;
			height: 1.2rem;
		}
		
		.movie-details-sidebar {
			padding: 1.5rem;
			border-radius: 8px;
		}
		
		.detail-item {
			margin-bottom: 1.3rem;
		}
		
		.detail-label {
			font-size: 0.8rem;
		}
		
		.detail-value {
			font-size: 1rem;
		}
		
		.content-container {
			padding: 2.5rem 1rem;
		}
		
		.section {
			margin-bottom: 3rem;
		}
		
		.section-header {
			margin-bottom: 1.8rem;
		}
		
		.fullscreen-video-container iframe {
			width: 95%;
			height: 35%;
		}
		
		.creators {
			padding: 1rem;
			margin-top: 1.5rem;
		}
		
		.creator-names {
			font-size: 0.95rem;
		}
		
		.section-grid {
			gap: 2rem;
		}
	}
	
	/* Pro extra malé obrazovky (iPhone SE apod.) */
	@media (max-width: 375px) {
		.movie-title {
			font-size: 1.8rem;
		}
		
		.movie-tagline {
			font-size: 1rem;
		}
		
		.hero-content {
			padding-bottom: 3rem;
		}
		
		.cast-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
			gap: 0.8rem;
		}
		
		.btn {
			padding: 0.7rem 1rem;
			font-size: 0.9rem;
		}
		
		.icon {
			font-size: 0.9rem;
		}
		
		.overview-text {
			font-size: 0.95rem;
		}
		
		.fullscreen-video-container iframe {
			height: 30%;
		}
	}
</style>
