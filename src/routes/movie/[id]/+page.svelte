<script>
	import Navbar from '../../../components/Navbar.svelte';

	export let data;
	const movieDetails = data.data;

	const {
		status,
		release_date,
		tagline,
		revenue,
		genres,
	} = movieDetails
	
	console.log(movieDetails);
</script>

	<Navbar />
<section class="movie-details">
	<div class="movie-title-container">
		<h3>{movieDetails.original_language}</h3>
		<h3>{movieDetails.status} {status === "Released" ? release_date : ""}</h3>
	</div>
	<div>
		<h1>{movieDetails.original_title}</h1>
		<p class="overview">{movieDetails.overview}</p>
		<p class="tagline">{tagline !== "" ? '"' + tagline + '"': ""}</p>
		<p>{revenue === 0 ? "0 revenue" : "movie revenue -> $" + revenue}</p>
	</div>
	<div class="idk">
		<p class="idk-p">Genres:</p>
		<ul>
			{#each genres as genre}
				<li>ID{genre.id} | {genre.name}</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap');

	h3, h1, p{
		padding: 0rem 2.5rem 0rem 2.5rem
	}
	.idk, .idk-p{
		padding: 1rem 1.5rem 0rem 1.5rem;
	}
	h3, p{
		font-weight: 400;
	}
	h3{
		font-size: 1rem;
	}
	h1{
		font-size: 2rem;
	}
	.overview, .idk ul li{
		width: 60%;
		color: #a0a0a0;
	}
	.movie-title-container{
		display: flex;
	}
	.tagline{
		font-family: "Indie Flower", cursive;
	}
</style>
