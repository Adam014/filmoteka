<script>
	import { formatDate } from '../lib/utils';

	export let movies;
	export let detailed_movies;

	// Store top movie and ensure its details are included
	let topMovie = {
		...movies[0],
		details: detailed_movies.find((detail) => detail.id === movies[0].id) || null
	};

	// Store other movies with their details
	let otherMovies = movies.slice(1).map((movie) => ({
		...movie,
		details: detailed_movies.find((detail) => detail.id === movie.id) || null
	}));

	// Function to swap instantly without reloading images
	function swapMovies(clickedMovie) {
		if (!clickedMovie || clickedMovie.id === topMovie.id) return;

		// Swap directly without delay
		const previousTop = { ...topMovie };
		topMovie = { ...clickedMovie };

		// Replace clicked movie in otherMovies with previous topMovie
		otherMovies = otherMovies.map((movie) => (movie.id === clickedMovie.id ? previousTop : movie));
	}
</script>

<div class="movies-layout">
	{#if topMovie}
		<div class="top-movie-container">
			<a href={`movie/${topMovie.id}`}>
				<div class="top-movie">
					<img
						src={topMovie.image}
						alt="{topMovie.original_title} Thumbnail"
						class="thumbnail"
						loading="eager"
					/>
					<div class="controls">
						<h2>{topMovie.title}</h2>
						<button class="watch">Watch</button>
					</div>
				</div>
				<div class="extra-content">
					<div class="info">
						<h3>🚀 {formatDate(topMovie.release_date)}</h3>
						<h3>🗣️ {topMovie.original_language}</h3>
					</div>
					<p>{topMovie.details?.overview}</p>
					<hr />
					<a href="/library">
						<button class="library">Library</button>
					</a>
					<hr />
				</div>
			</a>
		</div>
	{/if}
	<div class="other-movies">
		{#each otherMovies as movie}
			<div class="movie-card" on:click={() => swapMovies(movie)}>
				<img
					src={movie.image}
					alt="{movie.original_title} Thumbnail"
					class="thumbnail"
					loading="eager"
				/>
				<div class="controls">
					<h3>{movie.title}</h3>
					<a href={`movie/${movie.id}`}>
						<button class="watch">Watch</button>
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.info {
		display: flex;
		font-size: 2rem;
		justify-content: space-between;
	}

	.extra-content p {
		text-align: left;
		padding: 10px;
		font-size: 1.5rem;
	}

	hr {
		margin: 15px 0px 15px 0px;
	}

	.movies-layout a {
		text-decoration: none;
		color: white;
	}

	.movies-layout {
		display: grid;
		gap: 1.5rem;
		grid-template-columns: 2fr 1fr;
		grid-template-rows: auto auto;
		padding: 0rem 4rem 1rem 4rem;
	}

	.top-movie-container {
		display: flex;
		flex-direction: column;
	}

	.top-movie {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		transition: transform 0.3s ease;
	}

	.top-movie img {
		width: 100%;
		height: auto;
		object-fit: cover;
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	.extra-content {
		margin-top: 1rem;
		text-align: center;
	}

	.library {
		width: 100%;
		height: 3rem;
		background-color: #7a1cac;
		color: white;
		font-size: 2rem;
		border: 0;
		cursor: pointer;
	}

	.library:hover,
	.watch:hover {
		background-color: #8132ab;
	}

	.other-movies {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		padding-left: 3rem;
	}

	.movie-card {
		display: flex;
		flex-direction: column;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		transition: transform 0.3s ease;
		height: auto;
		cursor: pointer;
	}

	.movie-card img {
		width: 100%;
		height: auto;
		object-fit: cover;
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
	}

	.controls {
		display: flex;
		padding: 1rem;
		justify-content: space-between;
		background-color: #222;
		align-items: center;
		color: white;
	}

	/* Watch Button */
	.watch {
		background-color: #7a1cac;
		color: white;
		padding: 12px 24px;
		font-size: 1.2rem;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		margin: 20px 0px 10px 0px;
	}

	/* Responsive Styles */
	@media (max-width: 1024px) {
		.movies-layout {
			grid-template-columns: 1fr;
		}

		.top-movie-container {
			width: 100%;
		}
		.other {
			margin: 5px 0px 5px 0px;
		}
		.other-movies {
			padding: 0px;
		}
	}

	@media (max-width: 768px) {
		.other-movies {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.controls {
			display: block;
		}
		.library {
			font-size: 2rem;
			height: 3rem;
		}

		.info {
			display: block;
			text-align: left;
		}

		.info h3 {
			font-size: 1.7rem;
		}

		.extra-content p {
			font-size: 1.3rem;
		}
	}
</style>
