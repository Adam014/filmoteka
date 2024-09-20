<script>
	import MovieCard from './MovieCard.svelte';
	export let movies;
	let rowWidth = 0;
	const widths = [
		{ class: 'width1', width: 25 },
		{ class: 'width2', width: 50 },
		{ class: 'width3', width: 75 }
	];

	function getSizeClass() {
		// Filter widths to only those that can fit in the remaining row width
		let validWidths = widths.filter((w) => rowWidth + w.width <= 100);
		if (validWidths.length > 0) {
			const randomIndex = Math.floor(Math.random() * validWidths.length);
			rowWidth += validWidths[randomIndex].width;
			if (rowWidth === 100) {
				rowWidth = 0; // Reset for new row
			}
			return validWidths[randomIndex].class;
		} else {
			rowWidth = 0; // Reset if no width can fit, start new row
			return getSizeClass(); // Recursively try again
		}
	}
</script>

<div class="popular-movies">
	{#each movies as movie (movie.id)}
		<MovieCard {movie} sizeClass={getSizeClass()} />
	{/each}
</div>

<style>
	.popular-movies {
		display: flex;
		flex-wrap: wrap;
		padding: 20px;
	}
</style>
