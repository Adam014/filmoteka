<script>
	import { onMount } from 'svelte';
	import { getBestAvailableVideoWithCheck, formatCurrency } from '../../../lib/utils';

	export let data;

	const movieDetails = data?.details || {};
	const movieVideos = data?.videos?.results || [];

	const {
		original_language = 'N/A',
		original_title = 'N/A',
		status = 'N/A',
		release_date = 'N/A',
		tagline = '',
		revenue = 0,
		genres = [],
		budget = 0,
		adult = false,
		id = 'N/A',
		imdb_id = 'N/A',
		overview = 'No overview available.',
		production_companies = [],
		production_countries = [],
		homepage = ""
	} = movieDetails;

	let finalTrailer = null;
	let isLoading = true;

	// Asynchronous function to get the best available video
	async function fetchBestAvailableVideo() {
		finalTrailer = await getBestAvailableVideoWithCheck(movieVideos);
		isLoading = false;
	}

	onMount(() => {
		fetchBestAvailableVideo();
	});

	// Format the budget and revenue
	const formattedBudget = formatCurrency(budget);
	const formattedRevenue = formatCurrency(revenue);
</script>

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
	</div>

	<!-- Show Loading... when trailer is being fetched -->
	{#if isLoading}
		<p class="loading">Loading trailer...</p>
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

	<div>
		<h1>{imdb_id} | {original_title}</h1>
		<p class="overview">{overview}</p>
		<p class="tagline">{tagline !== '' ? '"' + tagline + '"' : ''}</p>
		<p>{budget === 0 ? '' : 'movie budget -> ' + formattedBudget}</p>
		<p>{revenue === 0 ? '' : 'movie revenue -> ' + formattedRevenue}</p>
	</div>

	<div class="stats-container">
		<div class="idk">
			<p class="idk-p">genres:</p>
			<ul>
				{#each genres as genre}
					<li>id: {genre.id} & {genre.name}</li>
				{/each}
			</ul>
		</div>
		{#if production_companies.length > 0}
			<div class="loneliness">
				<p class="loneliness-p">production-companies</p>
				<ul>
					{#each production_companies as company}
						<li>id: {company.id} | {company.name} | {company.origin_country}</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if production_countries.length > 0}
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

	.no-trailer {
		padding: 50px 2.5rem 50px 2.5rem;
	}

	h3,
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

	.loading{
		padding: 2rem 2.5rem 2rem 2.5rem;
		font-size: 1.3rem;
		font-family: 'Indie Flower', cursive;
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
