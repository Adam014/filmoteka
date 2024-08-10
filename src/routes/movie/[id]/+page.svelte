<script>
	import Navbar from '../../../components/Navbar.svelte';
	import { getBestAvailableVideo } from "../../../utils/utils";

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
	} = movieDetails;


	// Use the refactored function to find the final video
	let finalTrailer = getBestAvailableVideo(movieVideos);

	console.log(movieVideos)
	console.log(finalTrailer);
</script>

<section class="movie-details">
	<div class="movie-title-container">
		<h3>ID: {id}</h3>
		<h3>lang: {original_language}</h3>
		<h3>{status} {status === "Released" ? release_date : ""}</h3>
		<h3>Adult: {adult}</h3>
	</div>

	{#if finalTrailer}
		<div class="video-container">
			<iframe src={`https://www.youtube.com/embed/${finalTrailer.key}`} frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
		</div>
	{:else}
		<p>No trailer available.</p>
	{/if}

	<div>
		<h1>{imdb_id} | {original_title}</h1>
		<p class="overview">{overview}</p>
		<p class="tagline">{tagline !== "" ? '"' + tagline + '"': ""}</p>
		<p>movie budget -> ${budget}</p>
		<p>{revenue === 0 ? "0 revenue" : "movie revenue -> $" + revenue}</p>
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
		<div class="loneliness">
			<p class="loneliness-p">production-companies</p>
			<ul>
				{#each production_companies as company}
					<li>id: {company.id} | {company.name} | {company.origin_country}</li>
				{/each}
			</ul>
		</div>
		<div class="loneliness">
			<p class="loneliness-p">production-countries</p>
			<ul>
				{#each production_countries as country}
					<li>{country.iso_3166_1} {country.name}</li>
				{/each}
			</ul>
		</div>
	</div>
</section>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');

	h3, h1, p {
		padding: 0rem 2.5rem 0rem 2.5rem;
	}
	.idk, .idk-p, .loneliness, .loneliness-p {
		padding: 1rem 1.5rem 0rem 1.5rem !important;
	}
	h3, p {
		font-weight: 400;
	}
	h3 {
		font-size: 1rem;
	}
	h1 {
		font-size: 2rem;
	}
	.overview, .idk ul li, .loneliness ul li {
		color: #a0a0a0;
	}
	.movie-title-container {
		display: flex;
	}
	.tagline {
		font-family: "Indie Flower", cursive;
	}
	.movie-details {
		display: grid;
		justify-content: center;
	}

	/* Video container styles to ensure width matches description */
	.video-container {
		margin: 1rem 2.5rem;
	}

	iframe {
		width: 100%;
		max-width: 100%;
		height: 550px;
		border-radius: 8px;
	}

	@media screen and (max-width: 676px) {
		.movie-title-container {
			display: grid;	
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		}
	}
</style>
