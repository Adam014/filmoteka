<script>
    let promise = fetch(`https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=1`).then((x) => x.json());
</script>

{#await promise}
	<!-- optionally show something while promise is pending -->
{:then data}
	<!-- promise was fulfilled -->
	<pre>
		{JSON.stringify(data, null, 2)}
	</pre>
{:catch error}
	<!-- optionally show something while promise was rejected -->
    <h1>{error}</h1>
{/await}