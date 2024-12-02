<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { page } from '$app/stores';
	import lodash from 'lodash';
	import { onMount } from 'svelte';
	import Loader from "../../../../components/Loader.svelte";

	let challenge = null;
	let currentHint = 1; // Tracks the current hint
	let guessedCorrectly = false; // Tracks if the user guessed correctly
	let userGuess = ''; // Holds the user's input
	let suggestions = []; // Autocomplete suggestions
	let isLoading = false;
	let incorrectGuess = false; // Show animation for incorrect guess
	let guessesLeft = 3; // Maximum guesses allowed
	let isSuggestionsOpen = false; // Tracks if suggestions dropdown is open
	const day = $page.params.day;

	// Debounce setup
	const { debounce } = lodash;
	const debouncedFetch = debounce(fetchSuggestions, 300);

	// Fetch the daily challenge
	onMount(async () => {
		const { data, error } = await supabase
			.from('daily_challenge')
			.select('*')
			.eq('day', day)
			.single();

		if (error) {
			console.error('Error fetching challenge:', error);
		} else {
			challenge = data;
		}
	});

	// Fetch suggestions for the search input
	async function fetchSuggestions(query) {
		isLoading = true;
		isSuggestionsOpen = true; // Open suggestions when fetching
		try {
			const { data, error } = await supabase
				.from('films')
				.select('id, title, poster_path')
				.ilike('title', `%${query}%`)
				.limit(5);

			if (error) {
				console.error('Error fetching suggestions:', error);
				suggestions = [];
			} else {
				suggestions = data.map((movie) => ({
					id: movie.id,
					title: movie.title,
					poster_path: movie.poster_path,
				}));
			}
		} catch (err) {
			console.error('Error fetching suggestions:', err);
			suggestions = [];
		} finally {
			isLoading = false;
		}
	}

	// Handle guess submission
	function handleGuess(selectedMovie) {
		userGuess = selectedMovie.title;

		if (userGuess.toLowerCase() === challenge.title.toLowerCase()) {
			guessedCorrectly = true;
			userGuess = ''; // Clear input
		} else {
			incorrectGuess = true; // Trigger animation
			setTimeout(() => (incorrectGuess = false), 1000); // Reset animation
			guessesLeft--;
			currentHint++;
		}

		// If no guesses left, end the game
		if (guessesLeft === 0 && !guessedCorrectly) {
			currentHint = 3; // Show all hints
		}

		suggestions = []; // Clear suggestions
		isSuggestionsOpen = false; // Close suggestions
	}

	// Handle skipping the guess
	function handleSkip() {
		if (!guessedCorrectly && guessesLeft > 0) {
			guessesLeft--;
			currentHint++;
			if (guessesLeft === 0) {
				currentHint = 3; // Show all hints if no guesses are left
			}
		}
	}

	// Close suggestions on clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.search-container')) {
			isSuggestionsOpen = false;
		}
	}

	// Add click listener to the document
	onMount(() => {
		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

{#if challenge}
	<div class="challenge-container">
		<div class="header fade-in">
			<h1>🎬 Daily Challenge: Day {day}</h1>
		</div>

		<div class="hint-container fade-in">
			<div class="poster-wrapper">
				<img
					src={`https://image.tmdb.org/t/p/w400${challenge.poster_path}`}
					alt="Movie Poster"
					class="poster {guessedCorrectly || guessesLeft === 0 ? 'unblurred' : ''}"
					style="filter: blur({guessedCorrectly || guessesLeft === 0 ? '0px' : currentHint === 1 ? '20px' : currentHint === 2 ? '10px' : '5px'});"
				/>
			</div>
			<div class="hints">
				{#if currentHint >= 1}
					<p class="hint slide-in">🗓 Release Date: {challenge.release_date}</p>
				{/if}
				{#if currentHint >= 2}
					<p class="hint slide-in">🌍 Countries: {challenge.original_country.map((c) => c.name).join(', ')}</p>
					<p class="hint slide-in">🎭 Genres: {challenge.genres.map((g) => g.name).join(', ')}</p>
				{/if}
				{#if currentHint >= 3}
					<p class="hint slide-in">💬 Tagline: {challenge.tagline || 'No tagline available'}</p>
				{/if}
			</div>
		</div>

		<!-- Autocomplete Search -->
		{#if !guessedCorrectly && guessesLeft > 0}
			<div class="search-container fade-in">
				<input
					type="text"
					placeholder="🔎 Search for a movie..."
					bind:value={userGuess}
					on:input={(e) => debouncedFetch(e.target.value)}
					class="search-input {incorrectGuess ? 'shake' : ''}"
				/>

				<!-- Suggestions -->
				{#if isSuggestionsOpen && suggestions.length > 0 && !isLoading}
					<ul class="suggestions">
						{#each suggestions as suggestion}
							<li on:click={() => handleGuess(suggestion)}>
								<img
									src={`https://image.tmdb.org/t/p/w92${suggestion.poster_path}`}
									alt={suggestion.title}
									class="thumbnail"
								/>
								<span>{suggestion.title}</span>
							</li>
						{/each}
					</ul>
				{:else if isLoading}
					<Loader />
				{/if}
			</div>
			<div class="controls">
				<button class="skip-button fade-in" on:click={handleSkip}>Skip Guess</button>
				<p class="guesses-left fade-in ">Guesses Left: {guessesLeft}</p>
			</div>
		{/if}

		<!-- Success Message -->
		{#if guessedCorrectly}
			<p class="success-message fade-in">🎉 Correct! The movie is {challenge.title}!</p>
		{/if}

		<!-- Game Over Message -->
		{#if guessesLeft === 0 && !guessedCorrectly}
			<p class="game-over-message fade-in">❌ You didn’t guess it! The movie was "{challenge.title}".</p>
		{/if}
	</div>
{:else}
	<Loader />
{/if}

<style>
	:root {
		--primary-color: #a05cd5;
		--background-color: #1a1a1a;
		--text-color: #ffffff;
		--hint-color: #d3d3d3;
		--success-color: #7a1cac;
		--error-color: #e74c3c;
	}

	body {
		background: var(--background-color);
		margin: 0;
		font-family: 'Arial', sans-serif;
	}

	.challenge-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		color: var(--text-color);
		width: 90%;
		max-width: 800px;
		margin: 0 auto;
		padding: 20px;
		text-align: center;
	}

	.header h1 {
		padding-bottom: 4rem;
		color: var(--primary-color);
		font-size: 2rem;
	}

	.hint-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.poster-wrapper {
		display: flex;
		justify-content: center;
	}

	.poster {
		width: 250px;
		height: 350px;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
		transition: filter 0.5s ease;
	}

	.poster.unblurred {
		filter: none !important;
	}

	.hints {
		padding-top: 10px;
	}

	.hint {
		font-size: 1rem;
		color: var(--hint-color);
		text-align: center;
	}

	.search-container {
		width: 100%;
		margin-top: 20px;
		position: relative;
	}

	.search-input {
		width: 100%;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid var(--hint-color);
		background-color: var(--background-color);
		color: var(--text-color);
		font-size: 1rem;
	}

	.suggestions {
		position: absolute;
		top: 50px;
		width: 100%;
		background: var(--background-color);
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
		border-radius: 8px;
		overflow: hidden;
	}

	.suggestions li {
		padding: 10px;
		display: flex;
		align-items: center;
		cursor: pointer;
		color: var(--text-color);
	}

	.suggestions li:hover {
		background: var(--primary-color);
	}

	.thumbnail {
		width: 40px;
		height: 60px;
		object-fit: cover;
		margin-right: 10px;
	}

	.controls {
		margin-top: 20px;
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	.skip-button {
		background-color: var(--primary-color);
		color: var(--text-color);
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.skip-button:hover {
		background-color: var(--success-color);
	}

	.success-message {
		color: var(--success-color);
		margin-top: 20px;
		font-size: 1.2rem;
	}

	.game-over-message {
		color: var(--error-color);
		margin-top: 20px;
		font-size: 1.2rem;
	}

  @keyframes fadeIn {
		0% { opacity: 0; transform: translateY(20px); }
		100% { opacity: 1; transform: translateY(0); }
	}
	@keyframes slideIn {
		0% { opacity: 0; transform: translateX(-20px); }
		100% { opacity: 1; transform: translateX(0); }
	}
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-5px); }
		50% { transform: translateX(5px); }
		75% { transform: translateX(-5px); }
	}

	.fade-in { animation: fadeIn 0.8s ease-in-out; }
	.slide-in { animation: slideIn 0.8s ease-in-out; }
	.shake { animation: shake 0.5s ease-in-out; }

  @media (max-width: 768px){
    .search-input{
      width: 90%;
    }
    .controls{
      width: 96%;
    }
  }
</style>
