<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { page } from '$app/stores';
	import { user } from '../../../../stores/user';
	import lodash from 'lodash';
	import { onMount, onDestroy } from 'svelte';
	import Loader from '../../../../components/Loader.svelte';
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';

	let challenge = null;
	let currentHint = 1; // Tracks the current hint
	let guessedCorrectly = false; // Tracks if the user guessed correctly
	let userGuess = ''; // Holds the user's input
	let suggestions = []; // Autocomplete suggestions
	let isLoading = false;
	let incorrectGuess = false; // Show animation for incorrect guess
	let guessesLeft = 3; // Maximum guesses allowed
	let isSuggestionsOpen = false; // Tracks if suggestions dropdown is open
	let alreadyPlayed = false; // Tracks if the user has already played this day
	let savedState = null; // Holds saved state if revisiting
	let currentUser = null; // Holds the current user
	let hasPreviousDay = false; // Tracks if there is a previous day
	let hasNextDay = false; // Tracks if there is a next day
	let isFavorite = false; // Track if the guessed movie is a favorite

	// Reactively track the day from the page params
	$: day = parseInt($page.params.day);

	// Subscribe to user store
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	// Cleanup subscription
	onDestroy(() => {
		unsubscribe();
	});

	// Debounce setup
	const { debounce } = lodash;
	const debouncedFetch = debounce(fetchSuggestions, 300);

	// Watch for day changes and update data dynamically
	$: if (day) {
		initChallenge();
	}

	// Initialize challenge data
	async function initChallenge() {
		challenge = null;
		alreadyPlayed = false;
		savedState = null;
		currentHint = 1;
		guessedCorrectly = false;
		guessesLeft = 3;
		hasPreviousDay = false;
		hasNextDay = false;

		await checkIfPlayed();
		await checkAdjacentDays();

		if (!alreadyPlayed) {
			await fetchChallenge();
		} else {
			// Load the saved state if already played
			await fetchSavedState();
		}
	}

	// Fetch the daily challenge
	async function fetchChallenge() {
		const { data, error } = await supabase
			.from('daily_challenge')
			.select('*')
			.eq('day', day)
			.single();

		if (error) {
			console.error('Error fetching challenge:', error);
		} else {
			challenge = data;
			await checkIfFavorite(); // Check favorite status immediately after loading challenge
		}
	}

	// Check if the user has already played this day
	async function checkIfPlayed() {
		if (!currentUser) {
			// Ensure localStorage is only accessed on the client
			if (typeof window !== 'undefined') {
				const localState = localStorage.getItem(`daily-challenge-day-${day}`);
				alreadyPlayed = !!localState;
			} else {
				alreadyPlayed = false;
			}
		} else {
			const { data, error } = await supabase.storage
				.from('games')
				.list(`daily-challenge/${currentUser?.id}/`, { search: `${day}.json` });

			if (error) {
				console.error('Error checking game state:', error);
				return;
			}

			if (data.length > 0) {
				alreadyPlayed = true;
			}
		}
	}

	// Check for previous and next days
	async function checkAdjacentDays() {
		const { data, error } = await supabase
			.from('daily_challenge')
			.select('day')
			.in('day', [day - 1, day + 1]);

		if (error) {
			console.error('Error checking adjacent days:', error);
			return;
		}

		if (data.some((d) => d.day === day - 1)) {
			hasPreviousDay = true;
		}
		if (data.some((d) => d.day === day + 1)) {
			hasNextDay = true;
		}
	}

	// Navigate to another day
	function switchDay(newDay) {
		goto(`/games/daily/day-${newDay}`);
	}

	// Fetch the saved state if the game was already played
	async function fetchSavedState() {
		if (!currentUser) {
			// Ensure localStorage is only accessed on the client
			if (typeof window !== 'undefined') {
				const localState = localStorage.getItem(`daily-challenge-day-${day}`);
				if (localState) {
					try {
						savedState = JSON.parse(localState);
						applySavedState();
					} catch (error) {
						console.error('Error parsing local saved state:', error);
					}
				}
			}
		} else {
			const filePath = `daily-challenge/${currentUser.id}/${day}.json`;

			const { data, error } = await supabase.storage.from('games').download(filePath);

			if (error) {
				console.error('Error fetching saved state:', error);
				return;
			}

			try {
				const text = await data.text();
				savedState = JSON.parse(text);
				applySavedState();
			} catch (parseError) {
				console.error('Error parsing saved state JSON:', parseError);
			}
		}
	}

	// Apply saved state to variables
	function applySavedState() {
		guessedCorrectly = savedState.guessedCorrectly ?? false;
		guessesLeft = savedState.guessesLeft ?? 3;
		currentHint = savedState.currentHint ?? 1;

		// Ensure the challenge data is loaded
		if (!challenge) {
			fetchChallenge();
		}
	}

	// Save game result to Supabase or localStorage
	async function saveGameResult() {
		const gameResult = {
			day,
			guessedCorrectly,
			guessesLeft,
			currentHint,
			completedAt: new Date().toISOString()
		};

		if (!currentUser) {
			// Save to localStorage for anonymous users
			localStorage.setItem(`daily-challenge-day-${day}`, JSON.stringify(gameResult));
		} else {
			const filePath = `daily-challenge/${currentUser.id}/${day}.json`;

			try {
				const fileContent = new Blob([JSON.stringify(gameResult)], { type: 'application/json' });

				const { error } = await supabase.storage
					.from('games')
					.upload(filePath, fileContent, { upsert: true });

				if (error) {
					throw error;
				}
			} catch (error) {
				console.error('Error saving game result to Supabase storage:', error.message);
			}
		}
	}

	// Fetch suggestions for the search input
	async function fetchSuggestions(query) {
		isLoading = true;
		isSuggestionsOpen = true;
		try {
			const { data, error } = await supabase
				.from('films')
				.select('id, title, poster_path')
				.ilike('title', `%${query}%`)
				.limit(100);

			if (error) {
				console.error('Error fetching suggestions:', error);
				suggestions = [];
			} else {
				suggestions = data.map((movie) => ({
					id: movie.id,
					title: movie.title,
					poster_path: movie.poster_path
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
			saveGameResult();
			guessesLeft = 0; // Set guessesLeft to 0 when guessed correctly
			checkIfFavorite(); // Check and update favorite status
		} else {
			incorrectGuess = true;
			setTimeout(() => (incorrectGuess = false), 1000);
			guessesLeft--;
			if (guessesLeft === 0) {
				// Trigger when out of guesses
				saveGameResult();
				checkIfFavorite();
			}
		}

		currentHint = Math.max(currentHint + 1, 3); // Increment hint level
		userGuess = '';
		suggestions = [];
		isSuggestionsOpen = false;
	}

	// Handle skipping the guess
	function handleSkip() {
		if (!guessedCorrectly && guessesLeft > 0) {
			guessesLeft--;
			currentHint++;
			if (guessesLeft === 0) {
				currentHint = 3;
				saveGameResult();
			}
		}
	}

	// Close suggestions on clicking outside
	function handleClickOutside(event) {
		if (!event.target.closest('.search-container')) {
			isSuggestionsOpen = false;
		}
	}

	// Function to check if the movie is already marked as favorite
	async function checkIfFavorite() {
		if (!currentUser || !challenge) {
			isFavorite = false;
			return;
		}

		try {
			const { data, error } = await supabase.storage.from('favorites').list(currentUser.email);

			if (error) {
				console.error('Error fetching favorites:', error.message);
				isFavorite = false;
				return;
			}

			// Match movie ID in favorites
			isFavorite = data.some((file) => file.name === `${challenge.id}.json`);
		} catch (err) {
			console.error('Error checking favorite status:', err.message);
			isFavorite = false;
		}
	}

	// Function to toggle favorite status
	async function toggleFavorite() {
		if (!currentUser) {
			goto('/login');
			return;
		}

		const path = `${currentUser.email}/${challenge?.id}.json`;

		if (isFavorite) {
			try {
				const { error } = await supabase.storage.from('favorites').remove([path]);
				if (error) {
					console.error('Error removing favorite:', error.message);
					toast.error('Failed to remove from favorites.');
					return;
				}

				toast.success(`${challenge.title} removed from favorites.`);
			} catch (err) {
				console.error('Error removing favorite:', err.message);
				toast.error('Failed to remove from favorites.');
			}
		} else {
			try {
				const { error } = await supabase.storage
					.from('favorites')
					.upload(path, JSON.stringify({ id: challenge?.id, data: challenge }), {
						contentType: 'application/json'
					});
				if (error) {
					console.error('Error adding favorite:', error.message);
					toast.error('Failed to add to favorites.');
					return;
				}

				toast.success(`${challenge.title} added to favorites.`);
			} catch (err) {
				console.error('Error adding favorite:', err.message);
				toast.error('Failed to add to favorites.');
			}
		}

		isFavorite = !isFavorite;
	}

	onMount(() => {
		checkIfFavorite();
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

		<div class="day-navigation">
			{#if hasPreviousDay}
				<button class="nav-button" on:click={() => switchDay(day - 1)}>← Day {day - 1}</button>
			{/if}
			{#if hasNextDay}
				<button class="nav-button" on:click={() => switchDay(day + 1)}>Day {day + 1} →</button>
			{/if}
		</div>

		<div class="hint-container fade-in">
			<div class="poster-wrapper">
				{#if alreadyPlayed || guessedCorrectly || guessesLeft === 0}
					<div>
						<a href={`/movie/${challenge.films_id}`}>
							<img
								src={`https://image.tmdb.org/t/p/w400${challenge.poster_path}`}
								alt="Movie Poster"
								class="poster {guessedCorrectly || guessesLeft === 0 ? 'unblurred' : ''}"
							/>
						</a>
					</div>
				{:else}
					<img
						src={`https://image.tmdb.org/t/p/w400${challenge.poster_path}`}
						alt="Movie Poster"
						class="poster {guessedCorrectly || guessesLeft === 0 ? 'unblurred' : ''}"
						style="filter: blur({guessedCorrectly || guessesLeft === 0
							? '0px'
							: currentHint === 1
							? '20px'
							: currentHint === 2
							? '10px'
							: '5px'});"
					/>
				{/if}

				{#if guessesLeft === 0 || alreadyPlayed}
					<div
						class="favorite-icon {isFavorite ? 'filled' : ''}"
						on:click={toggleFavorite}
					>
						{isFavorite ? '★' : '☆'}
					</div>
				{/if}
			</div>
			<div class="hints">
				{#if currentHint >= 1}
					<p class="hint slide-in">🗓 Release Date: {challenge.release_date}</p>
				{/if}
				{#if currentHint >= 2}
					<p class="hint slide-in">🎭 Genres: {challenge.genres.map((g) => g.name).join(', ')}</p>
				{/if}
				{#if currentHint >= 3}
					<p class="hint slide-in">💬 Tagline: {challenge.tagline || 'No tagline available'}</p>
				{/if}
			</div>
		</div>

		<!-- Final Message -->
		{#if alreadyPlayed || guessedCorrectly || guessesLeft === 0}
			<p class={guessedCorrectly ? 'success-message fade-in' : 'game-over-message fade-in'}>
				{guessedCorrectly
					? `🎉 Correct! The movie is ${challenge.title}!`
					: `❌ You didn’t guess it! The movie was "${challenge.title}".`}
			</p>
		{/if}

		{#if !guessedCorrectly && guessesLeft > 0}
			<!-- Autocomplete Search -->
			<div class="search-container fade-in">
				<input
					type="text"
					placeholder="🔎 Search for a movie..."
					bind:value={userGuess}
					on:input={(e) => debouncedFetch(e.target.value)}
					class="search-input {incorrectGuess ? 'shake' : ''}"
				/>

				<!-- Suggestions -->
				{#if isSuggestionsOpen && suggestions?.length > 0 && !isLoading}
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
				<p class="guesses-left fade-in">Guesses Left: {guessesLeft}</p>
			</div>
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

	.day-navigation {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-bottom: 40px;
	}

	.nav-button {
		background-color: var(--primary-color);
		color: var(--text-color);
		border: none;
		padding: 10px 15px;
		border-radius: 8px;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.nav-button:hover {
		background-color: var(--success-color);
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
		padding-bottom: 2rem;
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
		position: relative;
		width: 250px;
		height: 350px;
		padding-bottom: 30px;
	}

	.poster-wrapper a{
		display: flex;
	}

	.poster {
		width: 100%;
		height: 100%;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
		transition: filter 0.5s ease;
		-webkit-user-drag: none;
		pointer-events: none;
		user-select: none;
	}

	.favorite-icon {
		position: absolute;
		top: 10px;
		right: 10px;
		font-size: 2rem;
		cursor: pointer;
		color: rgba(255, 215, 0, 0.8);
		text-shadow: 1px 1px 5px rgba(0, 0, 0, 0.6);
		transition: color 0.3s ease, transform 0.3s ease;
	}

	.favorite-icon:hover {
		transform: scale(1.1);
		color: gold;
	}

	.favorite-icon.isFavorite {
		color: gold;
	}

	.unblurred {
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
		width: 40%;
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
		width: 43%;
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
		0% {
			opacity: 0;
			transform: translateY(20px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@keyframes slideIn {
		0% {
			opacity: 0;
			transform: translateX(-20px);
		}
		100% {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-5px);
		}
		50% {
			transform: translateX(5px);
		}
		75% {
			transform: translateX(-5px);
		}
	}

	.fade-in {
		animation: fadeIn 0.8s ease-in-out;
	}
	.slide-in {
		animation: slideIn 0.8s ease-in-out;
	}
	.shake {
		animation: shake 0.5s ease-in-out;
	}

	@media (max-width: 768px) {
		.search-input {
			width: 90%;
		}
		.controls {
			width: 95%;
		}
		.challenge-container {
			padding-top: 20px;
		}
		.header h1 {
			padding-bottom: 1rem;
		}
	}
</style>
