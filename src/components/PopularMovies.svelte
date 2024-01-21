<script>
    import MovieCard from "./MovieCard.svelte";

    export let movies;
    console.log(movies)
</script>


<h1>Movify</h1>

<div class="popular-movies">
    {#each movies as movie (movie.id)}
        <MovieCard {movie}/>
    {/each}
</div>

<style>
@import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');
    h1{
        padding: 0 1rem;
        font-family: 'Shadows Into Light', cursive;
        font-size: 3rem;
        text-align: center;
    }
    .popular-movies{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        grid-column-gap: 1rem;
        grid-row-gap: 2rem;
    }

</style>