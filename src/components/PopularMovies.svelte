<script>
	import MovieCard from './MovieCard.svelte';

	export let movies;
	// console.log(movies);
</script>

<div class="popular-movies">
	{#each movies as movie (movie.id)}
		<MovieCard {movie} />
	{/each}
</div>

<style>
	.popular-movies {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-template-rows: repeat(4, auto);
		grid-gap: 20px;
		padding: 20px;
		justify-content: center;
	}

	@media screen and (max-width: 1200px) {
		.popular-movies {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media screen and (max-width: 900px) {
		.popular-movies {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media screen and (max-width: 600px) {
		.popular-movies {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* @media screen and (max-width: 400px) {
		.popular-movies {
			grid-template-columns: fr; 
			grid-template-rows: auto; 
		}
	} */
</style>
