export async function load({ fetch }) {
    const url = "https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=1";
    const res = await fetch(url);

    if (res.ok) {
        const data = await res.json();
        return {
            data
        };
    }
}