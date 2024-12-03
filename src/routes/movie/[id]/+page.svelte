<script>
	import { onMount } from 'svelte';
	import { getBestAvailableVideoWithCheck, formatCurrency } from '../../../lib/utils';
	import Loader from '../../../components/Loader.svelte';
	import { supabase } from '../../../lib/db/supabaseClient';
	import toast from 'svelte-french-toast';
	import { user } from '../../../stores/user';
	import MovieCard from "../../../components/MovieCard.svelte"
	import PersonCard from '../../../components/PersonCard.svelte';

	export let data;

	let currentUser;
	let movieDetails = {};
	let movieVideos = [];
	let cast = [];
	let crew = [];
	let topActors = [];
	let directors = [];
	let isFavorite = false;
	let finalTrailer = null;
	let isLoading = true;

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

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	// Reactively update variables when `data` changes
	$: if (data) {
		movieDetails = data.details || {};
		movieVideos = data.videos?.results || [];
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
		revenue = movieDetails.revenue || 0;
		genres = movieDetails.genres || [];
		budget = movieDetails.budget || 0;
		adult = movieDetails.adult || false;
		imdb_id = movieDetails.imdb_id || 'N/A';
		overview = movieDetails.overview || 'No overview available.';
		production_companies = movieDetails.production_companies || [];
		production_countries = movieDetails.production_countries || [];
		homepage = movieDetails.homepage || '';
		poster_path = movieDetails.poster_path || '';
		popularity = movieDetails.popularity || 0;

		// Fetch the best available video and check if the movie is a favorite
		fetchBestAvailableVideo();
		checkIfFavorite();
	}

	async function fetchBestAvailableVideo() {
		isLoading = true;
		finalTrailer = await getBestAvailableVideoWithCheck(movieVideos);
		isLoading = false;
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

	const formattedBudget = formatCurrency(budget);
	const formattedRevenue = formatCurrency(revenue);

	onMount(() => {
		fetchBestAvailableVideo();
		checkIfFavorite();

		return () => unsubscribe();
	});
</script>

<svelte:head>
	<title>{original_title} | Filmoteka</title>
</svelte:head>

<section class="movie-details">
	<div class="movie-title-container">
		{#if id}
			<h3>ID: {id}</h3>
		{/if}

		{#if original_language}
			<h3>Lang: {original_language}</h3>
		{/if}

		{#if status}
			<h3>{status} {status === 'Released' && release_date ? release_date : ''}</h3>
		{/if}

		{#if adult !== null && adult !== undefined}
			<h3>Adult: {adult ? 'Yes' : 'No'}</h3>
		{/if}

		{#if homepage}
			<h3><a href={homepage}>HomePage</a></h3>
		{/if}

		<div class="favorite-icon" on:click={toggleFavorite} class:isFavorite>
			{isFavorite ? '★' : '☆'}
		</div>
	</div>

	<!-- Show Loading... when trailer is being fetched -->
	{#if isLoading}
		<Loader />
	{:else if finalTrailer}
		<div class="video-container">
			<iframe
				title="youtube-video"
				src={`https://www.youtube.com/embed/${finalTrailer.key}`}
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			/>
		</div>
	{:else}
		<p class="no-trailer">No trailer available.</p>
	{/if}

	<!-- Add images right under the trailer, lets say 5-6 images -->

	<div>
		<h1>{imdb_id} | {original_title}</h1>
		<p class="overview">{overview}</p>

		<p class="tagline">{tagline !== '' ? '"' + tagline + '"' : ''}</p>

		<hr />
		<h2>Actors:</h2>
		<div class="actors-container">
			{#each topActors as actor}
				<PersonCard person={actor} />
			{/each}
		</div>

		{#if directors?.length > 1}
			<h2>Directors:</h2>
			<div class="directors-container">
				{#each directors as director}
					<PersonCard person={director} />
				{/each}
			</div>
		{:else if directors?.length === 1}
			<h2>Director:</h2>
			<div class="directors-container">
				<PersonCard person={directors[0]} />
			</div>
		{/if}

		<hr />

		<p>{budget === 0 ? '' : 'movie budget -> ' + formattedBudget}</p>
		<p>{revenue === 0 ? '' : 'movie revenue -> ' + formattedRevenue}</p>
	</div>

	<!-- reviews from people, make it a grid, left side stats and right side reviews underthemselve, on mobile everything underthemsekves, api reference /reviews -->

	<div class="stats-container">
		<div class="idk">
			<p class="idk-p">genres:</p>
			<ul>
				{#each genres as genre}
					<li>id: {genre.id} & {genre.name}</li>
				{/each}
			</ul>
		</div>
		{#if production_companies?.length > 0}
			<div class="loneliness">
				<p class="loneliness-p">production-companies</p>
				<ul>
					{#each production_companies as company}
						<li>id: {company.id} | {company.name} | {company.origin_country}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if production_countries?.length > 0}
			<div class="loneliness">
				<p class="loneliness-p">production-countries</p>
				<ul>
					{#each production_countries as country}
						<li>{country.iso_3166_1} {country.name}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</section>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');

	.similar-movies {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.no-trailer {
		padding: 50px 2.5rem 50px 2.5rem;
	}

	hr {
		margin: 15px 40px 15px 40px;
	}

	.favorite-icon {
		font-size: 2rem;
		cursor: pointer;
		color: rgba(255, 215, 0, 0.8);
		text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.6);
		transition: color 0.3s ease, transform 0.3s ease;
		padding: 0rem 2.5rem 0rem 2.5rem;
	}

	.favorite-icon.isFavorite {
		color: gold;
	}

	.favorite-icon:hover {
		transform: scale(1.1);
		color: gold;
	}

	.actors-container,
	.similar-movies,
	.directors-container {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		justify-content: left;
		padding: 20px 0px 20px 40px;
		width: 90%;
	}

	h3,
	h2,
	h1,
	p {
		padding: 0rem 2.5rem 0rem 2.5rem;
	}
	.idk,
	.idk-p,
	.loneliness,
	.loneliness-p {
		padding: 1rem 1.5rem 0rem 1.5rem !important;
	}

	h3,
	p {
		font-weight: 400;
	}
	h3 {
		font-size: 1rem;
	}
	h1 {
		font-size: 2.3rem;
	}
	.overview,
	.idk ul li,
	.loneliness ul li {
		color: #a0a0a0;
	}
	.overview {
		padding: 20px 40px 20px 40px;
		font-size: 1.3rem;
	}

	.movie-title-container {
		display: flex;
		align-items: center;
	}
	.tagline {
		font-family: 'Indie Flower', cursive;
		padding: 10px 40px 10px 40px;
		font-size: 1.7rem;
	}
	.movie-details {
		display: grid;
		justify-content: center;
	}

	.stats-container {
		padding-bottom: 40px;
	}

	/* Video container styles to ensure width matches description */
	.video-container {
		margin: 1rem 2.5rem;
	}

	iframe {
		width: 100%;
		max-width: 100%;
		height: 550px;
		border-radius: 30px;
	}

	@media screen and (max-width: 676px) {
		.movie-title-container {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		}
	}
</style>
