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
    h1{
        padding: 0 1rem;
        font-size: 2rem;
    }
    .popular-movies{
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        grid-column-gap: 1rem;
        grid-row-gap: 2rem;
    }

</style>