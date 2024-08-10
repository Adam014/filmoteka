<script>
	import PopularMovies from '../components/PopularMovies.svelte';
	import { onMount } from 'svelte';

	export let data;
	let movieResults = [];
	let currentPage = 1;
	let totalPages = data.data ? data.data.total_pages : data.total_pages;

	// Retrieve the page number from localStorage
	onMount(() => {
		const savedPage = localStorage.getItem('currentPage');
		if (savedPage) {
			currentPage = parseInt(savedPage, 10);
		}
		loadMovies(currentPage);
	});

	// Function to change page
	async function changePage(page) {
		currentPage = page;
		localStorage.setItem('currentPage', page);
		loadMovies(page);
	}

	// Function to load movies
	async function loadMovies(page) {
		const cachedMovies = JSON.parse(localStorage.getItem(`movies_page_${page}`));
		if (cachedMovies) {
			movieResults = cachedMovies;
		} else {
			const url = `https://api.themoviedb.org/3/movie/popular?api_key=6b6f517b5228ea3d3ea85b1649b6a34a&language=en-US&page=${page}`;
			const res = await fetch(url);
			if (res.ok) {
				const data = await res.json();
				movieResults = data.results;
				localStorage.setItem(`movies_page_${page}`, JSON.stringify(movieResults));
				totalPages = data.total_pages;
			}
		}
	}
</script>

<section class="container">
	{#if movieResults.length > 0}
		<PopularMovies movies={movieResults} />
		<div class="pagination">
			<button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
			<span>Page {currentPage} of {totalPages}</span>
			<button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</section>

<style>
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 20px 0;
	}

	.pagination button {
		margin: 0 10px;
		padding: 10px 20px;
		cursor: pointer;
		border: 1px solid #ccc;
		background-color: #fff;
	}

	.pagination span {
		margin: 0 10px;
	}
</style>