<script>
	import MovieCard from './MovieCard.svelte';
	export let movies;
</script>

<div class="popular-movies">
	{#each movies as movie, index (movie.id || index)}
		<MovieCard {movie} />
	{/each}
</div>

<style>
	.popular-movies {
		display: flex;
		flex-wrap: wrap;
		padding: 20px;
		justify-content: center;
	}
</style>