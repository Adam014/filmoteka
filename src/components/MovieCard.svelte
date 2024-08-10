<script>
	export let movie;
	// console.log(movie.id);
</script>

<div class="movie-card">
	<a href={`/movie/` + movie.id} data-sveltekit-preload-data="hover">
		<img src={'https://image.tmdb.org/t/p/w500' + movie.poster_path} alt={movie.title} />
	</a>
</div>

<style>
	* {
		color: white;
	}

	.movie-card {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		overflow: hidden; 
		width: 100%;
		max-width: 350px; 
		height: 450px; 
	}

	a {
		width: 100%;
		height: 100%;
		display: block;
		overflow: hidden; 
		position: relative;
	}

	a img {
		width: 100%;
		height: 100%;
		object-fit: cover; 
		border-radius: 8px; 
		transition: transform 0.3s ease-in-out;
		position: absolute; 
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	a:hover img {
		transform: translate(-50%, -50%) scale(1.1);
	}

	@media screen and (max-width: 600px) {
		.movie-card{
			max-width: 200px;
			height: 230px;
		}
	}

	@media screen and (max-width: 360px) {
		.movie-card{
			max-width: 150px;
			height: 200px;
		}
	}

</style>
