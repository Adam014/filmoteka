<script>
	export let movie;
	// console.log(movie.id);
</script>

<div class="movie-card">
	<a href={`/movie/` + movie.id}>
		<img src={'https://image.tmdb.org/t/p/w500' + movie.poster_path} alt={movie.title} />
	</a>
	<div class="description">
		<h2>{movie.title}</h2>
		<h4>{movie.release_date}</h4>
	</div>
</div>

<style>
	* {
		color: white;
	}
	img {
		width: 100%;
		height: 40vh;
		object-fit: cover;
	}
	img:hover{
		transform: scale(1.1);
		transition: 0.2s ease-in-out;
	}
	h2, h4 {
		font-size: 1.1rem;
		text-align: left;
		margin: 0;
		font-weight: 600;
	}
	h4{
		font-weight: 100 !important;
	}
	.movie-card {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		padding: 0.5rem;
		height: 31rem;
	}
</style>
