<script>
	import MovieCard from './MovieCard.svelte';
	import Navbar from './Navbar.svelte';

	export let movies;
	console.log(movies);
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
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		grid-column-gap: 1rem;
		grid-row-gap: 2rem;
		padding: 30px;
	}
</style>
