<script>
	import PopularMovies from '../components/PopularMovies.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadMovies, cacheFirstPage } from '../utils/utils.js';

	// TODO: Refactor
	// When entered page from input exceeds totalPages use toast notifications

	let movieResults = [];
	let currentPage = 1;
	let totalPages = 500;
	let inputPage = '';

	// Function to update the movies state
	function setMovieResults(movies) {
		movieResults = movies;
	}

	// Function to set total pages
	function setTotalPages(pages) {
		totalPages = pages;
	}

	// Function to update movies based on URL or page change
	async function updateMoviesFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		const pageFromUrl = urlParams.get('page');
		if (pageFromUrl) {
			currentPage = parseInt(pageFromUrl, 10);
			await loadMovies(currentPage, setMovieResults, setTotalPages);
		} else {
			currentPage = 1;
			await loadMovies(1, setMovieResults, setTotalPages);
		}
	}

	// Function to change page
	async function changePage(page) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			localStorage.setItem('currentPage', page);
			await loadMovies(page, setMovieResults, setTotalPages);
			goto(`/?page=${page}`, { replaceState: true });
		}
	}

	// Handle movies-loaded event
	function handleMoviesLoaded(event) {
		setMovieResults(event.detail.movies);
		currentPage = event.detail.page;
	}

	onMount(() => {
		cacheFirstPage(); // Ensure page 1 is cached on initial load
		updateMoviesFromUrl();
		window.addEventListener('movies-loaded', handleMoviesLoaded);

		return () => {
			window.removeEventListener('movies-loaded', handleMoviesLoaded);
		};
	});
</script>

<section class="container">
	{#if movieResults.length > 0}
		<PopularMovies movies={movieResults} />
		<div class="pagination">
			<button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
			<span>Page {currentPage} of {totalPages}</span>
			<button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
			<input
				type="number"
				min="1"
				max={totalPages}
				bind:value={inputPage}
				placeholder="Go to page..."
				on:keypress={(e) => { if (e.key === 'Enter') changePage(parseInt(inputPage, 10)); }}
				class="pagination-input"
			/>
			<button on:click={() => changePage(parseInt(inputPage, 10))} class="go-button">Go</button>
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
		gap: 10px;
	}

	.pagination button {
		margin: 0 10px;
		padding: 10px 20px;
		cursor: pointer;
		border: 1px solid #ccc;
		background-color: #fff;
		transition: background-color 0.3s;
	}

	.pagination button:hover {
		background-color: #ddd;
	}

	.pagination span {
		margin: 0 10px;
	}

	.pagination-input {
		width: 80px;
		padding: 8px;
		border-radius: 4px;
		border: 1px solid #ccc;
		text-align: center;
	}

	.go-button {
		padding: 8px 12px;
		cursor: pointer;
		border: 1px solid #ccc;
		background-color: #fff;
		border-radius: 4px;
		transition: background-color 0.3s;
	}

	.go-button:hover {
		background-color: #ddd;
	}

	@media screen and (max-width: 600px) {
		.pagination {
			flex-direction: column;
			gap: 15px;
		}

		.pagination-input {
			width: 80%;
			text-align: center;
		}

		.go-button {
			width: 85%;
		}
	}
</style>
