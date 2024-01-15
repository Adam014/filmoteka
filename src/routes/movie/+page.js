export async function load({ fetch, params }) {
    console.log(params.id);
    const url = `https://api.themoviedb.org/3/movie/${params.id}?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US`;
    const res = await fetch(url);

    if (res.ok) {
        const movieDetail = await res.json();
        return {
            movieDetail
        };
    }
}