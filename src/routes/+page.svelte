<script>
	import PopularMovies from '../components/PopularMovies.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadMovies, cacheFirstPage } from '../utils/utils.js';
	import { toast } from 'svelte-french-toast';
	import ShortcutKey from '../components/ShortcutKey.svelte';

	// TODO: Need to resolve this crappy code
	// TODO: Resolve the search function, it search functionality is shit

	let movieResults = [];
	let currentPage = 1;
	let totalPages = 500;
	let inputPage = '';
	let searchQuery = '';
	let isSearchPopupOpen = false; // Controls the visibility of the search popup
	let topPopularMovies = [];
	let preventClose = false; // Flag to prevent immediate closing

	// Function to update the movies state
	function setMovieResults(movies) {
		movieResults = movies;
		selectTopPopularMovies(); // Select top 5 popular movies for suggestions
	}

	// Function to select top 5 movies by popularity
	function selectTopPopularMovies() {
		topPopularMovies = [...movieResults]
			.sort((a, b) => b.popularity - a.popularity) // Sort by popularity descending
			.slice(0, 5); // Take top 5
	}

	// Function to update movies based on URL or page change
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

	// Function to change page
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

	// Function to handle search and redirect to the movie details page
	async function handleSearch(event) {
		event.preventDefault();

		if (searchQuery.trim()) {
			const apiKey = '6b6f517b5228ea3d3ea85b1649b6a34a'; // Replace with your TMDB API key
			const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
				searchQuery
			)}&language=en-US&page=1&include_adult=false`;

			const res = await fetch(searchUrl);
			const data = await res.json();

			if (data.results && data.results.length > 0) {
				const movieId = data.results[0].id;
				goto(`/movie/${movieId}`);
				closeSearchPopup(); // Close the search popup after redirect
			} else {
				toast.error('Movie not found!');
			}
		}
	}

	// Function to open the search popup
	function openSearchPopup() {
		isSearchPopupOpen = true;
		preventClose = true; // Prevent immediate close
		selectTopPopularMovies(); // Select top 5 popular movies when opening the popup

		setTimeout(() => {
			preventClose = false; // Re-enable closing after a delay
			document.addEventListener('click', handleClickOutside);
		}, 200); // Set a slight delay before adding the click event listener
	}

	// Function to close the search popup
	function closeSearchPopup() {
		isSearchPopupOpen = false;
		document.removeEventListener('click', handleClickOutside);
	}

	// Function to close the search popup when clicking outside of it
	function handleClickOutside(event) {
		if (!preventClose && isSearchPopupOpen && !event.target.closest('.search-popup-content')) {
			closeSearchPopup();
		}
	}

	// Handle keyboard shortcut for search popup and closing on Escape key
	function handleKeydown(event) {
		if (event.ctrlKey && event.key === 'k') {
			event.preventDefault();
			openSearchPopup();
		} else if (event.key === 'Escape' && isSearchPopupOpen) {
			closeSearchPopup();
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
		window.addEventListener('keydown', handleKeydown);
		window.addEventListener('movies-loaded', handleMoviesLoaded);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
			window.removeEventListener('movies-loaded', handleMoviesLoaded);
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<section class="container">
	<div class="search-input-container">
		<div class="input-wrapper">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search for a movie..."
				class="search-input"
				on:focus={openSearchPopup}
			/>
			<ShortcutKey keyLabel="Ctrl+K" />
		</div>
	</div>

	{#if isSearchPopupOpen}
		<div class="search-popup">
			<div class="search-popup-content">
				<form on:submit={handleSearch}>
					<div class="input-wrapper">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search for a movie..."
							class="search-popup-input"
							autofocus
						/>
						<ShortcutKey keyLabel="Esc" />
					</div>
				</form>
				<ul class="suggestions">
					{#each topPopularMovies as movie}
						<li>
							<a
								href={`/movie/${movie.id}`}
								class="suggestion-link"
								on:click={(e) => {
									e.preventDefault();
									goto(`/movie/${movie.id}`);
								}}
								on:keydown={(e) => e.key === 'Enter' && goto(`/movie/${movie.id}`)}
							>
								{movie.title}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if movieResults.length > 0}
		<PopularMovies movies={movieResults} />
		<div class="pagination">
			<button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}
				>Previous</button
			>
			<span>Page {currentPage} of {totalPages}</span>
			<button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}
				>Next</button
			>
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
				<a href="https://www.themoviedb.org"> TMDB.org </a>
			</div>
		</div>
	{:else}
		<p>Loading...</p>
	{/if}
</section>

<style>
	.input-wrapper {
		position: relative;
		width: 300px;
	}

	.search-input,
	.search-popup-input {
		width: 92%;
		padding: 10px;
		transition: all 0.3s ease;
		outline: none;
		border: 1px solid #333;
		border-radius: 4px;
		background-color: #2c2c2c;
		color: #fff;
	}

	form {
		padding-bottom: 20px;
	}

	.search-input:focus,
	.search-popup-input:focus {
		transform: scale(1.03);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	.tmdb-reference a {
		text-decoration: none;
		color: #e5e5e5;
	}

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
		font-size: 1rem;
		cursor: pointer;
		border: 1px solid #ccc;
		transition: background-color 0.3s;
		color: white;
		background-color: transparent;
	}

	.pagination button:hover {
		background-color: #ddd;
		color: black;
	}

	.pagination span {
		margin: 0 10px;
	}

	.pagination-input {
		width: 80px;
		padding: 11px;
		border-radius: 4px;
		border: 1px solid #ccc;
		text-align: center;
	}

	.search-input-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 20px;
	}

	.search-popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		padding: 20px;
		overflow-y: auto;
	}

	.search-popup-content {
		position: relative;
		background: #1a1a1a;
		padding: 20px;
		border-radius: 8px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
		width: 100%;
		max-width: 600px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.search-popup-input:focus {
		transform: scale(1.03);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	.suggestions {
		list-style: none;
		padding: 0;
		margin: 0;
		width: 100%;
	}

	.suggestion-link {
		text-decoration: none;
		color: inherit;
		display: block;
		padding: 10px;
		width: 100%;
	}

	.suggestions li {
		padding: 10px;
		background-color: #444;
		border-radius: 4px;
		margin-bottom: 5px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.suggestions li:hover {
		background-color: #666;
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

		.search-input:focus {
			width: 100%;
		}

		.search-popup-content {
			max-width: 70%;
			border-radius: 0;
			padding: 15px;
		}

		.search-popup-input {
			font-size: 1rem;
			padding: 12px;
			width: auto;
		}

		.suggestions li {
			padding: 12px;
			font-size: 1rem;
		}

		.suggestion-link {
			padding: 0;
		}

		.search-popup {
			padding: 0;
		}

		.search-input-container {
			padding: 0 15px;
		}

		.search-input {
			width: 92%;
			font-size: 1rem;
			padding: 10px;
		}
	}
</style>
