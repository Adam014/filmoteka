<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { user } from '../../../stores/user';
	import { onMount, onDestroy } from 'svelte';

	let dailyChallenges = [];
	let currentUser = null;

	// Subscribe to user store
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	onDestroy(() => {
		unsubscribe();
	});

	// Fetch all challenges
	async function fetchChallenges() {
		const { data, error } = await supabase
			.from('daily_challenge')
			.select('day, poster_path')
			.order('day', { ascending: true });

		if (error) {
			console.error('Error fetching challenges:', error);
			return [];
		}

		// Assign guessed status from storage or Supabase
		return await Promise.all(
			data.map(async (challenge) => {
				const guessedCorrectly = await checkGuessStatus(challenge.day);
				return {
					...challenge,
					color: '#333', // All cards have this color
					guessedCorrectly // true if guessed correctly, false otherwise
				};
			})
		);
	}

	// Check if the user guessed correctly
	async function checkGuessStatus(day) {
		if (!currentUser) {
			// Use localStorage for anonymous users
			const localState = localStorage.getItem(`daily-challenge-day-${day}`);
			if (localState) {
				const parsedState = JSON.parse(localState);
				return parsedState.guessedCorrectly ?? null;
			}
		} else {
			// Use Supabase for logged-in users
			const filePath = `daily-challenge/${currentUser.id}/${day}.json`;
			const { data, error } = await supabase.storage.from('games').download(filePath);

			if (error) {
				console.error(`Error fetching game state for day ${day}:`, error);
				return null;
			}

			try {
				const text = await data.text();
				const parsedState = JSON.parse(text);
				return parsedState.guessedCorrectly ?? null;
			} catch (parseError) {
				console.error('Error parsing saved state JSON:', parseError);
				return null;
			}
		}
	}

	// Always populate challenges on load
	onMount(async () => {
		dailyChallenges = await fetchChallenges();
	});
</script>

<div class="title-container">
	<h1>The Daily Challenges</h1>
	<p>
		Each day, guess a movie with hints like blurry posters, genres, and taglines. The faster you
		solve it, the better! Ready for today’s challenge? 🎬✨
	</p>
</div>
<div class="daily-grid">
	{#each dailyChallenges as challenge}
		<a href={`/games/daily/day-${challenge.day}`}>
			<div
				class="daily-card"
				style="
					background-color: {challenge.color}; 
					border-top: 5px solid {challenge.guessedCorrectly === true
					? 'green'
					: challenge.guessedCorrectly === false
					? 'red'
					: 'transparent'};"
			>
				<span class="day-number">{challenge.day}</span>
			</div>
		</a>
	{/each}
</div>

<style>
	.title-container {
		text-align: left;
		padding: 40px 0px 10px 50px;
	}

	.daily-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		padding: 20px;
		background-color: #1a1a1a;
		justify-content: center;
		width: 100%;
	}

	.daily-grid a {
		text-decoration: none;
	}

	.daily-card {
		width: 8rem;
		height: 120px;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
		color: #fff;
		font-size: 1.5rem;
		font-weight: bold;
		cursor: pointer;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
		border-top: 10px solid transparent; /* Default border color */
	}

	.daily-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
	}

	.day-number {
		text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.6);
	}

	@media (max-width: 768px) {
		.daily-card {
			width: 5rem;
			height: 80px;
		}
	}
</style>
