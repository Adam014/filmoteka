<script>
	import { supabase } from '../lib/db/supabaseClient';
	import { goto } from '$app/navigation';
	import ShortcutKey from '../components/ShortcutKey.svelte';
	import { onMount } from 'svelte';
	import lodash from 'lodash';
	import { handleSearch } from '../lib/utils'; // Import the handleSearch function
	
	const { debounce } = lodash;

	let searchQuery = '';
	let suggestions = [];
	let isSearchPopupOpen = false;
	let preventClose = false;
	let isLoading = false;

	// Fetch movies and people based on user input or show random results
	async function fetchSuggestions(query = '') {
		isLoading = true;

		let movieQuery = supabase
			.from('films')
			.select('id, title, poster_path, popularity');

		let peopleQuery = supabase
			.from('person_detailed')
			.select('id, name, profile_path, popularity');

		if (query) {
			// Apply search filter when the user types
			movieQuery = movieQuery.ilike('title', `%${query}%`).order('popularity', { ascending: false }).limit(5);
			peopleQuery = peopleQuery.ilike('name', `%${query}%`).order('popularity', { ascending: false }).limit(5);
		} else {
			// Fetch random results when the query is empty
			movieQuery = movieQuery.order('popularity', { ascending: false }).limit(5);
			peopleQuery = peopleQuery.order('popularity', { ascending: false }).limit(5);
		}

		const [movies, people] = await Promise.all([movieQuery, peopleQuery]);

		if (movies.error) {
			console.error('Error fetching movies:', movies.error.message);
		}

		if (people.error) {
			console.error('Error fetching people:', people.error.message);
		}

		const moviesData = movies.data || [];
		const peopleData = people.data || [];

		// Combine results
		suggestions = [
			...moviesData.map((movie) => ({
				type: 'movie',
				id: movie.id,
				name: movie.title,
				poster_path: movie.poster_path,
				popularity: movie.popularity,
			})),
			...peopleData.map((person) => ({
				type: 'person',
				id: person.id,
				name: person.name,
				poster_path: person.profile_path,
				popularity: person.popularity,
			})),
		]
			.sort(() => Math.random() - 0.5) // Shuffle results
			.slice(0, 5); // Limit to 5 items

		isLoading = false;
	}

	// Debounced search
	const debouncedFetch = debounce((query) => fetchSuggestions(query), 300);

	function handleInput(event) {
		searchQuery = event.target.value;
		debouncedFetch(searchQuery);
	}

	function openSearchPopup() {
		isSearchPopupOpen = true;
		preventClose = true;

		setTimeout(() => (preventClose = false), 200);
		if (!searchQuery) fetchSuggestions(); // Fetch random results if input is empty
	}

	function closeSearchPopup() {
		isSearchPopupOpen = false;
		searchQuery = '';
		suggestions = [];
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
		} else if (event.key === 'Enter' && !suggestions.length) {
			// If no suggestions, trigger handleSearch
			handleSearch(searchQuery, closeSearchPopup);
		}
	}

	// Add event listeners
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		window.addEventListener('keydown', handleKeydown);

		return () => {
			document.removeEventListener('click', handleClickOutside);
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<div class="search-container">
	<input
		type="text"
		bind:value={searchQuery}
		placeholder="Search for a movie or person..."
		class="search-input"
		on:focus={openSearchPopup}
		on:input={handleInput}
	/>
	<ShortcutKey keyLabel="Ctrl+K" class="shortcut-key-ctrlk" />

	{#if isSearchPopupOpen}
		<div class="search-popup">
			<div class="search-popup-content">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search for a movie or person..."
					class="search-popup-input"
					on:input={handleInput}
					autofocus
				/>
				{#if isLoading}
					<p>Loading...</p>
				{:else if suggestions.length > 0}
					<ul class="suggestions">
						{#each suggestions as suggestion}
							<a
								href={`/${suggestion.type}/${suggestion.id}`}
								on:click={(e) => {
									e.preventDefault();
									goto(`/${suggestion.type}/${suggestion.id}`);
									closeSearchPopup();
								}}
							>
								<li>
									<img
										src={'https://image.tmdb.org/t/p/w500' + (suggestion.poster_path || '/placeholder.jpg')}
										alt={suggestion.name || 'Unknown'}
									/>
									{suggestion.name || 'No Name'} ({suggestion.type === 'movie' ? 'Movie' : 'Person'})
								</li>
							</a>
						{/each}
					</ul>
				{:else}
					<p>No results found. Press Enter to search globally.</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.search-container {
		position: relative;
	}

	.search-input {
		width: 90%;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		background-color: #222;
		color: #fff;
	}

	.search-popup {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8); /* Semi-transparent background */
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10;
	}

	.search-popup-content {
		background-color: #1a1a1a;
		padding: 20px;
		border-radius: 8px;
		/* box-shadow: 0 0 15px rgba(0, 0, 0, 0.5); */
		width: 90%;
		max-width: 600px;
		text-align: center;
		position: absolute;
		top: 15%;
	}

	.search-popup-input {
		width: 90%;
		padding: 10px;
		margin-bottom: 20px;
		border: 1px solid #333;
		border-radius: 4px;
		background-color: #2c2c2c;
		color: #fff;
	}

	.suggestions {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.suggestions li {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px;
		cursor: pointer;
	}

	.suggestions li img {
		width: 60px;
		height: 90px;
		object-fit: cover;
		border-radius: 4px;
	}

	.suggestions li:hover {
		background-color: #333;
	}

	.suggestions a {
		text-decoration: none;
		color: #fff;
		flex-grow: 1;
	}

	.suggestions p {
		color: #ccc;
		text-align: center;
		margin: 10px 0;
	}
</style>
