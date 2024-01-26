export async function load({ fetch, params }) {
    const url = `https://api.themoviedb.org/3/movie/${params.id}?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US`;
    const response = await fetch(url);

    const data = await response.json();

    if (response.ok){
        return {
            data
        };
    }
}