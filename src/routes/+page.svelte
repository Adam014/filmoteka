<script>
	import PopularMovies from '../components/PopularMovies.svelte';

	export let data;
	const movieResults = data.data ? data.data.results : data.results;
</script>

<section class="container">
	{#if movieResults}
		<PopularMovies movies={movieResults} />
	{:else}
		<p>Loading...</p>
	{/if}
</section>

<style>


</style>
