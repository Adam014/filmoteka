<script>
    export let movies;
    console.log(movies)
</script>


<h3>Popular Movies</h3>

<div class="popular-movies">
    {#each movies as movie (movie.id)}
        <li>{movie.title}</li>
    {/each}
</div>