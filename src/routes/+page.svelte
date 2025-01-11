<script>
	import PopularMovies from '../components/PopularMovies.svelte';
	import Loader from '../components/Loader.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadMovies, cacheFirstPage, generatePageNumbers } from '../lib/utils.js';
	import { toast } from 'svelte-french-toast';

	let movieResults = [];
	export let data;
	export let currentPage = data?.currentPage;
	let totalPages = Math.ceil(data.count / 60);
	let inputPage = '';
	let topPopularMovies = [];

	function setMovieResults(movies) {
		movieResults = movies;
		selectTopPopularMovies(); // Select top 5 popular movies for suggestions
	}

	function selectTopPopularMovies() {
		topPopularMovies = [...movieResults].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
	}

	async function updateMoviesFromUrl() {
		const urlParams = new URLSearchParams(window.location.search);
		const pageFromUrl = urlParams.get('page');
		if (pageFromUrl) {
			currentPage = parseInt(pageFromUrl, 10);
			await loadMovies(currentPage, setMovieResults);
		} else {
			currentPage = 1;
			await loadMovies(1, setMovieResults);
		}
	}

	async function changePage(page) {
		if (page < 1 || page > totalPages) {
			toast.error(`Page ${page} is out of range. Please enter a valid page number.`);
			return;
		}

		currentPage = page;
		localStorage.setItem('currentPage', page);
		await loadMovies(page, setMovieResults);
		goto(`/?page=${page}`, { replaceState: true });
	}

	function handleMoviesLoaded(event) {
		setMovieResults(event.detail.movies);
		currentPage = event.detail.page;
	}

	onMount(() => {
		cacheFirstPage();
		updateMoviesFromUrl();
		window.addEventListener('movies-loaded', handleMoviesLoaded);

		return () => {
			window.removeEventListener('movies-loaded', handleMoviesLoaded);
		};
	});
</script>

<svelte:head>
	<title>Library | Filmoteka</title>
</svelte:head>

<section class="container">
	{#if movieResults?.length > 0}
		<PopularMovies movies={movieResults} />
		<!-- TODO: Limit pagination when user isnt logged in to 3 pages and disable the ability to search, he can view only the movies that are in in the 3 pages -->
		<div class="pagination">
			<div class="paginate-container">
				<div>
					{#each generatePageNumbers(currentPage, totalPages) as page}
						<button class:active={page === currentPage} on:click={() => changePage(page)}>
							{page}
						</button>
					{/each}
				</div>
			</div>
			<div class="footer-pagination">
				<input
					type="number"
					min="1"
					max={totalPages}
					bind:value={inputPage}
					placeholder="Enter page"
					on:keypress={(e) => {
						if (e.key === 'Enter') changePage(parseInt(inputPage, 10));
					}}
					class="pagination-input"
				/>
				<div class="tmdb-reference">
					<a href="https://www.themoviedb.org">Powered by TMDB.org</a>
				</div>
				<div class="myself">
					<a href="https://github.com/Adam014">Crafted by Adam Stádník</a>
				</div>
			</div>
		</div>
	{:else}
		<Loader />
	{/if}
</section>

<style>
	.myself a {
		text-decoration: none;
		color: white;
		font-size: 0.9rem;
	}

	.myself a:hover {
		color: #7a1cac;
		text-decoration: underline;
	}

	.container {
		padding: 20px;
	}

	.tmdb-reference a {
		text-decoration: none;
		color: #e5e5e5;
		font-size: 0.9rem;
		padding-left: 15px;
	}

	.pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
		margin: 20px 0;
	}

	.paginate-container {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}

	.footer-pagination {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		padding-top: 20px;
		width: 100%;
		max-width: 600px;
		margin: auto;
	}

	.pagination button {
		background-color: transparent;
		color: #fff;
		padding: 10px 15px;
		font-size: 1rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.pagination button:hover {
		background-color: #7a1cac;
		color: #fff;
	}

	.pagination button.active {
		background-color: #7a1cac;
		color: #fff;
		font-weight: bold;
		border: 1px solid #7a1cac;
	}

	.pagination button:disabled {
		background-color: #222;
		color: #666;
		cursor: not-allowed;
		border: 1px solid #444;
	}

	.pagination button:focus {
		outline: 2px solid #7a1cac;
	}

	.pagination-input {
		width: 100px;
		padding: 10px;
		border-radius: 8px;
		border: 1px solid #555;
		text-align: center;
		font-size: 1rem;
		color: #fff;
		background-color: #222;
		transition: border-color 0.2s ease;
	}

	.pagination-input:focus {
		border-color: #7a1cac;
		outline: none;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media screen and (max-width: 600px) {
		.pagination {
			flex-direction: column;
			gap: 15px;
		}

		.footer-pagination {
			flex-direction: column;
			gap: 15px;
		}

		.pagination-input {
			width: 80%;
			text-align: center;
		}
	}
</style>
