<script>
	import { supabase } from '$lib/db/supabaseClient';
	import { user } from '../../../stores/user';
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';

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
					color:
						guessedCorrectly === true
							? 'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)'
							: guessedCorrectly === false
							? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
							: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
					guessedCorrectly
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

<svelte:head>
	<title>Daily Challenge | Filmoteka</title>
</svelte:head>

<div class="daily-container" in:fade={{ duration: 300 }}>
	<div class="daily-header">
		<h1>🎬 Daily Challenge</h1>
		<p>
			Test your movie knowledge with daily challenges! Each day brings a new pixelated movie poster
			to guess.
		</p>
	</div>

	<div class="daily-grid">
		{#each dailyChallenges as challenge, i}
			<a
				href={`/games/daily/day-${challenge.day}`}
				in:fly={{ y: 50, duration: 400, delay: i * 100 }}
			>
				<div class="daily-card" style="background: {challenge.color}">
					<div class="card-content">
						<span class="day-number">Day {challenge.day}</span>
						{#if challenge.guessedCorrectly !== null}
							<div class="status-icon">
								{#if challenge.guessedCorrectly}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
									</svg>
								{:else}
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
										/>
									</svg>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.daily-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.daily-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.daily-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.daily-header p {
		font-size: 1.2rem;
		color: var(--gray-text);
		margin-bottom: 2rem;
	}

	.daily-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		padding: 1rem;
	}

	.daily-grid a {
		text-decoration: none;
	}

	.daily-card {
		aspect-ratio: 1;
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.daily-card:hover {
		transform: translateY(-5px);
	}

	.card-content {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: white;
		position: relative;
	}

	.day-number {
		font-size: 1.5rem;
		font-weight: 600;
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	.status-icon {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		width: 2rem;
		height: 2rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.status-icon svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	@media (max-width: 768px) {
		.daily-container {
			padding: 1rem;
		}

		.daily-header h1 {
			font-size: 2rem;
		}

		.daily-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
		}

		.day-number {
			font-size: 1.2rem;
		}
	}
</style>
