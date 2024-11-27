<script>
	import MovieCard from '../../../components/MovieCard.svelte';

	export let data;

	const person = data?.person;

	// Format the date to be more readable
	const formatDate = (date) =>
		new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(
			new Date(date)
		);

	// Filter out duplicate movies based on unique `media.id`
	const uniqueMovies = person?.movies.results.filter(
		(movie, index, self) => index === self.findIndex((m) => m.media?.id === movie.media?.id)
	);
</script>

<svelte:head>
	<title>{person?.name} | Filmoteka</title>
</svelte:head>

<div class="container">
	<div class="person-title-container">
		<div class="image-container">
			<img src={'https://image.tmdb.org/t/p/w300' + person?.profile_path} alt={person?.name} />
		</div>
		<div class="person-info">
			<div class="person-element">
				<p>Name and IMDb ID:</p>
				<h1>{person?.name} | {person?.imdb_id || 'N/A'}</h1>
			</div>
			<div class="person-element">
				<p>Born:</p>
				<h1>
					{person?.birthday ? formatDate(person.birthday) + ' in ' + person?.place_of_birth : 'N/A'}
				</h1>
			</div>
			{#if person?.deathday}
				<div class="person-element">
					<p>Died:</p>
					<h1>{formatDate(person.deathday)}</h1>
				</div>
			{/if}
			<div class="person-element">
				<p>Department:</p>
				<h1>{person?.known_for_department || 'N/A'}</h1>
			</div>
			{#if person?.also_known_as?.length > 0}
				<div class="person-element">
					<p>Also Known As:</p>
					<h1>{person.also_known_as.join(', ')}</h1>
				</div>
			{/if}
			{#if person?.homepage}
				<div class="person-element">
					<p>Homepage:</p>
					<h1>
						{#if person?.homepage}
							<a href={person.homepage} target="_blank" rel="noopener noreferrer"
								>{person.homepage}</a
							>
						{:else}
							N/A
						{/if}
					</h1>
				</div>
			{/if}
		</div>
	</div>
	<p class="person-biography">{person?.biography || 'No biography available.'}</p>
	{#if person?.movies.results.lenght != null}
		<h1 class="person-movies-title">Movies</h1>
	{/if}
	<div class="person-movies">
		{#each uniqueMovies as movie (movie.media?.id)}
			<MovieCard {movie} showNotAvailable={true} />
		{/each}
	</div>
</div>

<style>
	.person-movies-title {
		padding-top: 30px;
	}

	.person-movies {
		padding-top: 20px;
		display: flex;
		flex-wrap: wrap;
		width: 90%;
	}
	.container {
		padding: 20px 0px 20px 40px;
	}

	.person-title-container {
		display: flex;
		justify-content: flex-start;
		gap: 20px;
	}

	.person-info {
		padding: 15px;
	}

	.person-element {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 20px;
	}

	.person-element p {
		font-size: 1.2rem;
		font-weight: bold;
		flex-basis: 30%;
	}

	.person-element h1 {
		font-size: 1.8rem;
		flex-basis: 130%;
		margin-left: 10px;
		text-decoration: underline #7a1cac;
	}

	.person-element h1 a {
		color: inherit;
		text-decoration: underline;
	}

	.person-biography {
		width: 80%;
		padding-top: 40px;
	}

	img {
		border-radius: 10px;
	}

	@media screen and (max-width: 1200px) {
		.person-element p {
			font-size: 1rem;
			flex-basis: 40%;
		}
		.person-element h1 {
			font-size: 1.4rem;
		}
	}

	@media screen and (max-width: 1000px) {
		.person-title-container {
			display: grid;
		}
		.person-title-container img {
			width: 13rem;
			height: 13rem;
			object-fit: cover;
		}
		.image-container {
			padding-left: 20px;
		}
		.person-element p {
			font-size: 1rem;
		}
		.person-element h1 {
			font-size: 1.1rem;
		}
	}
	@media screen and (max-width: 800px) {
		.person-element {
			display: grid;
		}
		.person-element h1 {
			padding: 10px 0px 20px 0px !important;
			font-weight: lighter;
			margin-left: 0px;
		}
		.person-biography {
			padding-left: 18px;
		}
	}
</style>
