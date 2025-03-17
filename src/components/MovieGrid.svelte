<script>
    export let data;
    export let headline;

</script>

<div>
    <h2>{headline}</h2>
    <div class="movies-container">
        {#each data as movie, index}
            <a href={"/movie/" + movie?.id}>
                <div class="movie-card" key={index}>
                    <div class="movie-thumb">
                        <img src={'https://image.tmdb.org/t/p/w300' + movie?.backdrop_path} alt={movie?.original_title} />
                    </div>
                    <h3>{movie?.original_title}</h3>
                </div>
            </a>
        {/each}
    </div>
</div>

<style>
	a {
		text-decoration: none;
		color: white;
	}
    .movies-container {
		padding: 30px 65px 50px 65px;
		display: flex;
		flex-wrap: wrap;
	}

	h2 {
		padding: 40px 0px 10px 65px;
		text-decoration: underline;
	}

    .movie-thumb img {
		height: 10rem;
		object-fit: cover;
	}

    .movie-card {
		display: grid;
		justify-content: center;
		padding: 10px 10px;
		text-align: left;
		cursor: pointer;
	}

	.movie-card h3 {
		padding-top: 10px;
	}

    @media (max-width: 768px) {
		.movies-container {
			display: grid;
			grid-template-columns: repeat(2, 2fr);
			padding-left: 5px;
		}

		h2 {
			padding-left: 10px;
		}
	}

</style>