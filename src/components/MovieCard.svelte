<script>
	export let movie;
	export let sizeClass; // Receive the size class from the parent
</script>

<div class={`movie-card ${sizeClass}`}>
	<a href={`/movie/${movie.id}`}>
		<img src={'https://image.tmdb.org/t/p/w500' + movie.poster_path} alt={movie.title} />
	</a>
</div>

<style>
	.movie-card {
		display: block;
		position: relative;
		overflow: hidden;
		border-radius: 20px;
		height: 100px;
		margin: 10px;
		width: calc(25% - 20px); /* Default width, transition will handle resizing */
		transition: all 0.5s ease-in-out; /* Smooth transition for movement and resizing */
	}

	.movie-card.width1 {
		width: calc(25% - 20px);
	}
	.movie-card.width2 {
		width: calc(50% - 20px);
	}
	.movie-card.width3 {
		width: calc(75% - 20px);
	}

	a img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		top: 0;
		left: 0;
		transition: transform 0.5s ease; /* Smooth scaling on hover */
	}

	a:hover img {
		transform: scale(1.05);
	}
</style>
