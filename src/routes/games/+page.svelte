<script>
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { supabase } from '$lib/db/supabaseClient';

	// Array of available games
	let games = [
		{
			name: 'Daily Challenge',
			description: 'Guess the movie from pixelated posters and hints! New challenge every day.',
			link: '/games/daily',
			icon: '🎬',
			color: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
			stats: {
				players: '4'
			}
		},
	];

	let selectedGame = null;
	let showGameDetails = false;

	async function getDailyPlayersCount() {
		try {
			const { data, error } = await supabase.storage.list('games/daily-challenge');
			if (error) throw error;
			
			// Count unique folders (each folder represents one player)
			const uniquePlayers = new Set(data.map(item => item.name.split('/')[0]));
			games[0].stats.players = uniquePlayers.size.toString();
		} catch (error) {
			console.error('Error fetching daily players count:', error);
		}
	}

	onMount(() => {
		getDailyPlayersCount();
	});

	function selectGame(game) {
		selectedGame = game;
		showGameDetails = true;
	}

	function closeGameDetails() {
		showGameDetails = false;
		selectedGame = null;
	}

	function goto(url) {
		window.location.href = url;
	}
</script>

<svelte:head>
	<title>Games | Filmoteka</title>
</svelte:head>

<div class="games-container" in:fade={{ duration: 300 }}>
	<div class="games-header">
		<h1>🎮 Game Hub</h1>
		<p>Choose a game and test your movie knowledge!</p>
	</div>

	<div class="games-grid">
		{#each games as game, i}
			<div 
				class="game-card" 
				style="background: {game.color}"
				on:click={() => goto(game.link)}
				in:fly={{ y: 50, duration: 400, delay: i * 100 }}
			>
				<div class="game-content">
					<div class="game-icon">{game.icon}</div>
					<h2>{game.name}</h2>
					<p>{game.description}</p>
					<div class="game-stats">
						<span class="stat">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
							</svg>
							{game.stats.players} players
						</span>
					</div>
				</div>
				<div class="game-overlay">
					<span>Play</span>
				</div>
			</div>
		{/each}
	</div>
</div>

{#if showGameDetails && selectedGame}
	<div class="game-modal" on:click={closeGameDetails}>
		<div class="modal-content" on:click|stopPropagation>
			<button class="close-button" on:click={closeGameDetails}>×</button>
			<div class="modal-header" style="background: {selectedGame.color}">
				<div class="modal-icon">{selectedGame.icon}</div>
				<h2>{selectedGame.name}</h2>
			</div>
			<div class="modal-body">
				<p>{selectedGame.description}</p>
				<div class="modal-stats">
					<div class="stat-item">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
						</svg>
						<span>Active players: {selectedGame.stats.players}</span>
					</div>
				</div>
				<a href={selectedGame.link} class="play-button">Play Game</a>
			</div>
		</div>
	</div>
{/if}

<style>
	.games-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.games-header {
		text-align: center;
		margin-bottom: 3rem;
	}

	.games-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		background: linear-gradient(135deg, #fff 0%, #a0a0a0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.games-header p {
		font-size: 1.2rem;
		color: var(--gray-text);
	}

	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.game-card {
		position: relative;
		border-radius: 1rem;
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
	}

	.game-card:hover {
		transform: translateY(-10px);
	}

	.game-content {
		padding: 2rem;
		color: white;
		position: relative;
		z-index: 1;
	}

	.game-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.game-card h2 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.game-card p {
		font-size: 1rem;
		line-height: 1.6;
		margin-bottom: 1.5rem;
		opacity: 0.9;
	}

	.game-stats {
		display: flex;
		gap: 1.5rem;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
		opacity: 0.9;
	}

	.stat svg {
		width: 1.2rem;
		height: 1.2rem;
	}

	.game-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.game-overlay span {
		color: white;
		font-size: 1.2rem;
		font-weight: 600;
		padding: 0.5rem 1.5rem;
		border: 2px solid white;
		border-radius: 2rem;
		transform: translateY(20px);
		transition: transform 0.3s ease;
	}

	.game-card:hover .game-overlay {
		opacity: 1;
	}

	.game-card:hover .game-overlay span {
		transform: translateY(0);
	}

	/* Modal styles */
	.game-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--card-bg);
		border-radius: 1rem;
		width: 90%;
		max-width: 500px;
		overflow: hidden;
		position: relative;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: white;
		font-size: 2rem;
		cursor: pointer;
		z-index: 2;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background-color 0.3s ease;
	}

	.close-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-header {
		padding: 2rem;
		color: white;
		text-align: center;
	}

	.modal-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.modal-header h2 {
		font-size: 1.8rem;
		font-weight: 600;
	}

	.modal-body {
		padding: 2rem;
	}

	.modal-body p {
		font-size: 1.1rem;
		line-height: 1.6;
		margin-bottom: 2rem;
		color: var(--gray-text);
	}

	.modal-stats {
		display: flex;
		justify-content: space-around;
		margin-bottom: 2rem;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.stat-item svg {
		width: 1.5rem;
		height: 1.5rem;
		color: var(--primary-color);
	}

	.play-button {
		display: block;
		width: 100%;
		padding: 1rem;
		background: var(--gradient-bg);
		color: white;
		text-align: center;
		text-decoration: none;
		border-radius: 0.5rem;
		font-weight: 600;
		transition: transform 0.3s ease;
	}

	.play-button:hover {
		transform: translateY(-2px);
	}

	@media (max-width: 768px) {
		.games-container {
			padding: 1rem;
		}

		.games-header h1 {
			font-size: 2rem;
		}

		.games-grid {
			grid-template-columns: 1fr;
		}

		.modal-content {
			width: 95%;
			margin: 1rem;
		}
	}
</style>
