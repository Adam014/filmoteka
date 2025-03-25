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

<div class="featured-movies">
	{#if topMovie}
		<div class="featured-movie">
			<a href={`movie/${topMovie.id}`} class="movie-link">
				<div class="featured-poster">
					<img
						src={topMovie.image}
						alt="{topMovie.original_title} Poster"
						class="poster-image"
						loading="eager"
					/>
					<div class="gradient-overlay"></div>
					<div class="featured-content">
						<h2 class="featured-title">{topMovie.title}</h2>
						<div class="featured-meta">
							<span class="release-date">{formatDate(topMovie.release_date)}</span>
							<span class="language">{topMovie.original_language.toUpperCase()}</span>
						</div>
						<button class="watch-button">
							<svg viewBox="0 0 24 24" fill="none" class="play-icon">
								<path d="M8 5v14l11-7z" fill="currentColor"/>
							</svg>
							Watch
						</button>
					</div>
				</div>
				<div class="movie-details">
					<p class="overview">{topMovie.details?.overview || 'No description available.'}</p>
					<div class="action-buttons">
						<a href="/library" class="library-button">Movie Library</a>
						<a href={`movie/${topMovie.id}`} class="details-button">More Info</a>
					</div>
				</div>
			</a>
		</div>
	{/if}
	
	<div class="movie-gallery">
		{#each otherMovies as movie}
			<div class="gallery-item" on:click={() => swapMovies(movie)} on:keydown={(e) => e.key === 'Enter' && swapMovies(movie)}>
				<div class="gallery-poster">
					<img
						src={movie.image}
						alt="{movie.original_title} Poster"
						loading="eager"
					/>
					<div class="poster-overlay">
						<h3 class="movie-title">{movie.title}</h3>
						<button class="gallery-button" on:click|stopPropagation={() => (window.location.href = `/movie/${movie.id}`)}>
							Watch
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.featured-movies {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		width: 100%;
	}

	.featured-movie {
		position: relative;
		border-radius: 1rem;
		overflow: hidden;
		background: var(--card-bg, #1e1e1e);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.featured-movie:hover {
		transform: translateY(-5px);
		box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
	}

	.movie-link {
		text-decoration: none;
		color: inherit;
		display: block;
	}

	.featured-poster {
		position: relative;
		width: 100%;
		height: 0;
		padding-bottom: 56.25%; /* 16:9 aspect ratio */
		overflow: hidden;
	}

	.poster-image {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.gradient-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			0deg,
			rgba(14, 14, 14, 1) 0%,
			rgba(14, 14, 14, 0.7) 25%,
			rgba(14, 14, 14, 0) 60%
		);
	}

	.featured-content {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 2rem;
		z-index: 2;
	}

	.featured-title {
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 1rem;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}

	.featured-meta {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		font-size: 1rem;
		opacity: 0.9;
	}

	.release-date::before {
		content: '🚀 ';
	}

	.language::before {
		content: '🗣️ ';
	}

	.watch-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--primary-color, #3a86ff);
		color: white;
		border: none;
		padding: 0.8rem 1.5rem;
		border-radius: 2rem;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.3s ease, transform 0.2s ease;
	}

	.watch-button:hover {
		background: var(--secondary-color, #ff006e);
		transform: scale(1.05);
	}

	.play-icon {
		width: 1.2rem;
		height: 1.2rem;
	}

	.movie-details {
		padding: 1.5rem 2rem 2rem;
	}

	.overview {
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		color: var(--gray-text, #adb5bd);
	}

	.action-buttons {
		display: flex;
		gap: 1rem;
	}

	.library-button, .details-button {
		flex: 1;
		padding: 0.8rem 1rem;
		text-align: center;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: background-color 0.3s ease, transform 0.2s ease;
	}

	.library-button {
		background-color: var(--accent-color, #8338ec);
		color: white;
	}

	.details-button {
		background-color: rgba(255, 255, 255, 0.1);
		color: white;
	}

	.library-button:hover, .details-button:hover {
		transform: translateY(-2px);
	}

	/* Gallery of other movies */
	.movie-gallery {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
		height: min-content;
	}

	.gallery-item {
		position: relative;
		border-radius: 0.75rem;
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.3s ease;
	}

	.gallery-item:hover {
		transform: scale(1.05);
	}

	.gallery-poster {
		position: relative;
		width: 100%;
		aspect-ratio: 2/3;
	}

	.gallery-poster img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.poster-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 1rem;
		background: linear-gradient(
			0deg,
			rgba(0, 0, 0, 0.9) 0%,
			rgba(0, 0, 0, 0.7) 50%,
			rgba(0, 0, 0, 0) 100%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.gallery-item:hover .poster-overlay {
		opacity: 1;
	}

	.movie-title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.gallery-button {
		background: var(--primary-color, #3a86ff);
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.gallery-button:hover {
		background: var(--secondary-color, #ff006e);
	}

	/* Responsive adjustments */
	@media (max-width: 1200px) {
		.featured-title {
			font-size: 2rem;
		}
	}

	@media (max-width: 1024px) {
		.featured-movies {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.movie-gallery {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.featured-content {
			padding: 1.5rem;
		}

		.featured-title {
			font-size: 1.75rem;
		}

		.action-buttons {
			flex-direction: column;
			gap: 0.75rem;
		}

		.movie-details {
			padding: 1rem 1.5rem 1.5rem;
		}

		.overview {
			font-size: 0.95rem;
			margin-bottom: 1rem;
		}
	}

	@media (max-width: 480px) {
		.featured-content {
			padding: 1rem;
		}

		.featured-title {
			font-size: 1.5rem;
			margin-bottom: 0.5rem;
		}

		.featured-meta {
			margin-bottom: 1rem;
			font-size: 0.9rem;
		}

		.watch-button {
			padding: 0.6rem 1rem;
			font-size: 1rem;
		}

		.movie-gallery {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
