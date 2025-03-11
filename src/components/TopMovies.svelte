<script>
    export let topRatedMovies;
</script>

<div>
    <h2>Top Rated Movies</h2>
    <div class="topmovies-container">
        {#each topRatedMovies as topRatedMovie, index}
            <a href={"/movie/" + topRatedMovie?.id}>
                <div class="movie-card" key={index}>
                    <div class="movie-thumb">
                        <img src={'https://image.tmdb.org/t/p/w300' + topRatedMovie?.backdrop_path} alt={topRatedMovie?.original_title} />
                    </div>
                    <h3>{topRatedMovie?.original_title}</h3>
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
    .topmovies-container {
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
		.topmovies-container {
			display: grid;
			grid-template-columns: repeat(2, 2fr);
			padding-left: 5px;
		}

		h2 {
			padding-left: 10px;
		}
	}

</style>