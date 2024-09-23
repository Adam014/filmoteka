<script>
	import PopularMovies from '../components/PopularMovies.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadMovies, cacheFirstPage, handleSearch } from '../lib/utils.js';
	import { toast } from 'svelte-french-toast';
	import ShortcutKey from '../components/ShortcutKey.svelte';

	let movieResults = [];
	let currentPage = 1;
	let totalPages = 500;
	let inputPage = '';
	let searchQuery = '';
	let isSearchPopupOpen = false; // Controls the visibility of the search popup
	let isFadingOut = false; // Flag for fade-out animation
	let topPopularMovies = [];
	let preventClose = false; // Flag to prevent immediate closing

	function setMovieResults(movies) {
		movieResults = movies;
		selectTopPopularMovies(); // Select top 5 popular movies for suggestions
	}

	function selectTopPopularMovies() {
		topPopularMovies = [...movieResults].sort((a, b) => b.popularity - a.popularity).slice(0, 5);
	}

	// Function to generate the list of pages to display
	function generatePageNumbers(currentPage, totalPages, pageRange = 2) {
		const startPage = Math.max(1, currentPage - pageRange);
		const endPage = Math.min(totalPages, currentPage + pageRange);
		const pages = [];

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		return pages;
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

	async function handleSearchEvent(event) {
		event.preventDefault();
		await handleSearch(searchQuery, closeSearchPopup, toast);
	}

	function openSearchPopup() {
		isSearchPopupOpen = true;
		preventClose = true;
		selectTopPopularMovies();

		setTimeout(() => {
			preventClose = false;
			document.addEventListener('click', handleClickOutside);
		}, 200);
	}

	function closeSearchPopup() {
		isFadingOut = true; // Start fade-out animation
		setTimeout(() => {
			isSearchPopupOpen = false; // Close the popup after the fade-out animation
			isFadingOut = false; // Reset fade-out flag
			document.removeEventListener('click', handleClickOutside);
		}, 500); // Match this duration with the CSS animation duration
	}

	function handleClickOutside(event) {
		if (!preventClose && isSearchPopupOpen && !event.target.closest('.search-popup-content')) {
			closeSearchPopup();
		}
	}

	function handleKeydown(event) {
		if (event.ctrlKey && event.key === 'k') {
			event.preventDefault();
			openSearchPopup();
		} else if (event.key === 'Escape' && isSearchPopupOpen) {
			closeSearchPopup();
		}
	}

	function handleMoviesLoaded(event) {
		setMovieResults(event.detail.movies);
		currentPage = event.detail.page;
	}

	onMount(() => {
		cacheFirstPage();
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
			<ShortcutKey keyLabel="Ctrl+K" class="shortcut-key-ctrlk" />
		</div>
	</div>

	{#if isSearchPopupOpen}
		<div class="search-popup {isFadingOut ? 'fade-out' : ''}">
			<div class="search-popup-content">
				<div class="input-wrapper">
					<form on:submit={handleSearchEvent}>
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search for a movie..."
							class="search-popup-input"
							autofocus
						/>
						<ShortcutKey keyLabel="Esc" class="shortcut-key-esc" />
					</form>
				</div>
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
			<div class="paginate-container">
				<button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1}
					>Previous</button
				>

				<div>
					{#each generatePageNumbers(currentPage, totalPages) as page}
						<button class:active={page === currentPage} on:click={() => changePage(page)}>
							{page}
						</button>
					{/each}
				</div>

				<button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}
					>Next</button
				>
			</div>
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
	{:else}
		<p>Loading...</p>
	{/if}
</section>

<style>
	.myself{
		padding-left: 20px;
	}

	.input-wrapper {
		position: relative;
	}

	.container {
		padding-top: 20px;
	}

	.search-input {
		width: 75%;
		padding: 8px 10px;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #222;
		color: #fff;
		transition: all 0.3s ease;
		outline: none;
		padding-right: 60px;
	}

	.search-input:focus {
		transform: scale(1.03);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	.tmdb-reference a {
		text-decoration: none;
		color: #e5e5e5;
		padding-left: 15px;
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 20px 0;
	}

	.paginate-container {
		display: flex;
	}

	.pagination button {
		font-size: 1rem;
		cursor: pointer;
		background: none;
		color: white;
		border: 0;
		transition: background-color 0.3s;
		padding: 10px;
	}

	.pagination button:hover {
		color: white;
		background-color: #b7999c;
	}

	.pagination button.active {
		background-color: #eb5160;
		color: white;
		font-weight: bold;
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
		margin-left: 10px;
	}

	.search-input-container {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
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
		transition: opacity 0.5s ease, visibility 0.5s ease; /* Adjusted for both opacity and visibility */
		opacity: 1;
		visibility: visible;
	}

	.search-popup.fade-out {
		opacity: 0;
		visibility: hidden; /* This hides the element after the fade-out */
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
		animation: fadeIn 0.5s ease forwards;
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

	.search-popup-input {
		width: 75%;
		padding: 15px;
		font-size: 1.2rem;
		border-radius: 4px;
		border: 1px solid #333;
		background-color: #2c2c2c;
		color: #fff;
		transition: all 0.3s ease;
		padding-right: 60px;
	}

	form {
		align-items: center;
		display: flex;
	}

	.search-popup-input:focus {
		transform: scale(1.03);
		box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
	}

	.suggestions {
		list-style: none;
		padding: 20px 0 0 0;
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
