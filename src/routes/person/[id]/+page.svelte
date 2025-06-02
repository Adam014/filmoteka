<script>
	import MovieCard from '../../../components/MovieCard.svelte';

	export let data;

	$: person = data?.person;

	// Format the date to be more readable
	$: formatDate = (date) =>
		date
			? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
					new Date(date)
			  )
			: 'N/A';

	// Safely handle undefined values for person?.movies?.results
	$: uniqueMovies = person?.movies?.results
		? person.movies.results.filter(
				(movie, index, self) =>
					index === self.findIndex((m) => m.media?.id === movie.media?.id) && movie.media?.title // Ensure the movie has a valid title
		  )
		: [];
</script>

<svelte:head>
	<title>{person?.name} | Filmoteka</title>
</svelte:head>

<div class="container">
	<div class="main-content">
		<div class="content-grid">
			<div class="person-section">
				<div class="person-header">
					<div class="person-image">
						<img src={'https://image.tmdb.org/t/p/w300' + person?.profile_path} alt={person?.name} />
					</div>
					<div class="person-info">
						<h1 class="person-name">{person?.name}</h1>
						<div class="person-meta">
							{#if person?.imdb_id}
								<a href={`https://www.imdb.com/name/${person.imdb_id}`} target="_blank" rel="noopener noreferrer" class="imdb-link">
									IMDb
								</a>
							{/if}
							{#if person?.homepage}
								<a href={person.homepage} target="_blank" rel="noopener noreferrer" class="homepage-link">
									Official Website
								</a>
							{/if}
						</div>
						<div class="person-details">
							<div class="detail-item">
								<span class="label">Born:</span>
								<span class="value">
									{person?.birthday ? formatDate(person.birthday) + ' in ' + person?.place_of_birth : 'N/A'}
								</span>
							</div>
							{#if person?.deathday}
								<div class="detail-item">
									<span class="label">Died:</span>
									<span class="value">{formatDate(person.deathday)}</span>
								</div>
							{/if}
							<div class="detail-item">
								<span class="label">Department:</span>
								<span class="value">{person?.known_for_department || 'N/A'}</span>
							</div>
							{#if person?.also_known_as?.length > 0}
								<div class="detail-item">
									<span class="label">Also Known As:</span>
									<span class="value">{person.also_known_as.join(', ')}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			{#if uniqueMovies.length > 0}
				<div class="movies-section">
					<h2>Movies</h2>
					<div class="movies-grid">
						{#each uniqueMovies as movie (movie.media?.id)}
							<MovieCard {movie} showNotAvailable={true} />
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if person?.biography}
		<div class="biography-section">
			<h2>Biography</h2>
			<p>{person.biography}</p>
		</div>
	{/if}
</div>

<style>
	.container {
		max-width: 2000px;
		margin: 0 auto;
		padding: 2rem;
	}

	.content-grid {
		display: grid;
		grid-template-columns: minmax(300px, 400px) minmax(0, 1fr);
		gap: 2rem;
		align-items: start;
	}

	.person-section {
		position: sticky;
		top: 2rem;
		height: fit-content;
	}

	.person-header {
		background: rgba(20, 20, 20, 0.4);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.person-image {
		position: relative;
		margin-bottom: 1.5rem;
	}

	.person-image img {
		width: 100%;
		border-radius: 1rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease;
	}

	.person-image img:hover {
		transform: scale(1.02);
	}

	.person-info {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.person-name {
		font-size: 2.2rem;
		font-weight: 700;
		margin: 0;
		background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		line-height: 1.2;
	}

	.person-meta {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.imdb-link,
	.homepage-link {
		padding: 0.5rem 1rem;
		border-radius: 2rem;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.3s ease;
		font-size: 0.9rem;
	}

	.imdb-link {
		background: linear-gradient(135deg, #f5c518 0%, #f5c518 100%);
		color: #000;
	}

	.homepage-link {
		background: rgba(255, 255, 255, 0.1);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.imdb-link:hover,
	.homepage-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	}

	.person-details {
		display: grid;
		gap: 1rem;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.label {
		font-size: 0.9rem;
		color: var(--gray-text);
	}

	.value {
		font-size: 1.1rem;
		color: #fff;
	}

	.movies-section {
		background: rgba(20, 20, 20, 0.4);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		width: 95%;
	}

	.biography-section {
		background: rgba(20, 20, 20, 0.4);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		padding: 2rem;
		margin-top: 2rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.05);
		width: 96%;
	}

	.movies-section h2,
	.biography-section h2 {
		font-size: 1.8rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: #fff;
		position: relative;
		padding-bottom: 0.5rem;
	}

	.movies-section h2::after,
	.biography-section h2::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 60px;
		height: 3px;
		background: linear-gradient(90deg, #3a86ff, #8338ec);
		border-radius: 3px;
	}

	.biography-section p {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #e5e5e5;
	}

	.movies-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		width: 100%;
	}

	@media (max-width: 1600px) {
		.content-grid {
			grid-template-columns: minmax(280px, 350px) minmax(0, 1fr);
		}
	}

	@media (max-width: 1400px) {
		.content-grid {
			grid-template-columns: minmax(250px, 300px) minmax(0, 1fr);
		}
	}

	@media (max-width: 1200px) {
		.content-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.person-section {
			position: relative;
			top: 0;
			max-width: 600px;
			margin: 0 auto;
		}

		.movies-section {
			max-width: 100%;
			width: 100%;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.person-header {
			padding: 1.5rem;
		}

		.person-name {
			font-size: 1.8rem;
		}

		.person-meta {
			flex-direction: column;
			gap: 0.8rem;
		}

		.imdb-link,
		.homepage-link {
			width: 100%;
			text-align: center;
		}

		.movies-section {
			padding: 1.5rem;
		}

		.movies-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 1rem;
		}

		.biography-section {
			padding: 1.5rem;
		}
	}

	@media (max-width: 480px) {
		.container {
			padding: 0.8rem;
		}

		.person-header {
			padding: 1.2rem;
		}

		.person-name {
			font-size: 1.6rem;
		}

		.person-image {
			margin-bottom: 1rem;
		}

		.person-details {
			gap: 0.8rem;
		}

		.detail-item {
			gap: 0.2rem;
		}

		.label {
			font-size: 0.8rem;
		}

		.value {
			font-size: 1rem;
		}

		.movies-section {
			padding: 1.2rem;
		}

		.movies-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 0.8rem;
		}

		.biography-section {
			padding: 1.2rem;
		}

		.biography-section p {
			font-size: 1rem;
			line-height: 1.5;
		}
	}
</style>
