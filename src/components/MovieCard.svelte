<script>
    export let movie;
</script>

<div class="movie-card">
    <a href={'/movie/' + movie.id}>
        <img src={'https://image.tmdb.org/t/p/w500' + movie.poster_path} alt={movie.title} >
    </a>
    <div class="description">
        <h2>{movie.title}</h2>
        <p>{movie.release_date}</p>
    </div>
</div>

<style>
    img{
        width: 100%;
        height: 40vh;
        object-fit: cover;
        margin-bottom: 1rem;
    }
    h2{
        font-size: 1.1rem
    }
    .description {
        height: 6.5vh;
        padding-bottom: 30px;
    }   
    p{
        font-size: 0.9rem;
    }
    .movie-card{
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        padding: 0.5rem;
    }
</style>