<script>
    export let movies;

    console.log(movies);

    // Get the top movie (highest popularity)
    const topMovie = movies.length > 0 ? movies[0] : null;
    const otherMovies = movies.slice(1); // Remaining movies
</script>

<div class="movies-layout">
    <!-- Top Movie Section -->
    {#if topMovie}
        <div class="top-movie-container">
            <a href={`movie/${topMovie.id}`} class="top-movie">
                <img
                    src={`https://image.tmdb.org/t/p/w780${topMovie.image}`}
                    alt="{topMovie.original_title} Thumbnail"
                    class="thumbnail"
                />
                <div class="controls">
                    <h2>{topMovie.title}</h2>
                    <button class="watch">Watch</button>
                </div>
            </a>
            <!-- Additional content below the top movie -->
            <div class="extra-content">
                <!-- TODO: Add here description of the top movie, release date, original_language -->
                <hr />
                <a href="/library">
                    <button class="library">Library</button>
                </a>
                <hr />
            </div>
        </div>
    {/if}

    <!-- Other Movies Grid -->
    <div class="other-movies">
        {#each otherMovies as movie}
            <a href={`movie/${movie.id}`} class="movie-card">
                <img
                    src={`https://image.tmdb.org/t/p/w500${movie.image}`}
                    alt="{movie.original_title} Thumbnail"
                    class="thumbnail"
                />
                <div class="controls">
                    <h3>{movie.title}</h3>
                    <button class="watch other">Watch</button>
                </div>
            </a>
        {/each}
    </div>
</div>

<style>

    hr{
        margin: 15px 0px 15px 0px;
    }

    a{
        text-decoration: none;
    }

    .movies-layout {
        display: grid;
        gap: 1.5rem;
        grid-template-columns: 2fr 1fr;
        grid-template-rows: auto auto;
        padding: 2rem;
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

    .library{
        width: 100%;   
        height: 5rem;
        background-color: #7a1cac;
        color: white;
        font-size: 3rem;
        border: 0;
        cursor: pointer;
    }

    .library:hover, .watch:hover{
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
    }

    /* Responsive Styles */
    @media (max-width: 1024px) {
        .movies-layout {
            grid-template-columns: 1fr;
        }

        .top-movie-container {
            width: 100%;
        }
        .other{
            margin: 5px 0px 5px 0px;
        }
        .other-movies{
            padding: 0px
        }
    }

    @media (max-width: 768px) {
        .other-movies {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .controls {
            display: block;
        }
        .library{
            font-size: 2rem;
            height: 3rem;
        }
    }
</style>
