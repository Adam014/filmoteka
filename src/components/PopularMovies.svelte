<script>
	import MovieCard from './MovieCard.svelte';
	import Navbar from './Navbar.svelte';

	export let movies;
	// console.log(movies);
</script>

<Navbar />
<div class="popular-movies">
	{#each movies as movie (movie.id)}
		<MovieCard {movie} />
	{/each}
</div>

<style>
	.popular-movies {
		display: grid;
		grid-template-columns: repeat(5, 1fr); /* 5 columns */
		grid-template-rows: repeat(4, auto); /* 4 rows */
		grid-gap: 20px; /* Consistent spacing between items */
		padding: 30px;
	}

	/* Media Queries to ensure responsiveness */
	@media screen and (max-width: 1200px) {
		.popular-movies {
			grid-template-columns: repeat(4, 1fr); /* Reduce to 4 columns */
			grid-template-rows: auto; /* Adjust rows to fill available space */
		}
	}

	@media screen and (max-width: 900px) {
		.popular-movies {
			grid-template-columns: repeat(3, 1fr); /* Reduce to 3 columns */
			grid-template-rows: auto; /* Adjust rows to fill available space */
		}
	}

	@media screen and (max-width: 600px) {
		.popular-movies {
			grid-template-columns: repeat(2, 1fr); /* Reduce to 2 columns */
			grid-template-rows: auto; /* Adjust rows to fill available space */
		}
	}

	@media screen and (max-width: 400px) {
		.popular-movies {
			grid-template-columns: 1fr; /* Single column */
			grid-template-rows: auto; /* Stack all items vertically */
		}
	}
</style>
