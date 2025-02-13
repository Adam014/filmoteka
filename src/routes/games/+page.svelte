<script>
	// Array of available games
	let games = [
		{
			name: 'Daily Challenge',
			description: 'Guess the movie with hints and pixelated posters!',
			link: '/games/daily',
			icon: '🎬'
		}
	];
</script>

<svelte:head>
	<title>Games</title>
</svelte:head>

<div class="games-hub">
	<h1 class="hub-title">🎮 Game Hub</h1>
	<p class="hub-subtitle">Choose a game and put your movie knowledge to the test!</p>

	<div class="games-grid">
		{#each games as game}
			<a class="game-card" href={game.link}>
				<div class="game-icon">{game.icon}</div>
				<h2 class="game-title">{game.name}</h2>
				<p class="game-description">{game.description}</p>
			</a>
		{/each}
	</div>
</div>

<style>
	:root {
		--primary-color: #a05cd5;
		--background-color: #1a1a1a;
		--card-color: #2e073f;
		--text-color: #ffffff;
		--card-hover-color: #7a1cac;
	}

	body {
		background: var(--background-color);
		margin: 0;
		font-family: 'Arial', sans-serif;
		color: var(--text-color);
	}

	.games-hub {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		text-align: center;
	}

	.hub-title {
		font-size: 2.5rem;
		color: var(--primary-color);
		margin-bottom: 10px;
	}

	.hub-subtitle {
		font-size: 1.2rem;
		color: var(--text-color);
		margin-bottom: 30px;
	}

	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.game-card {
		background: var(--card-color);
		border-radius: 10px;
		text-decoration: none;
		color: var(--text-color);
		padding: 20px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
		transition: transform 0.2s, background-color 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.game-card:hover {
		transform: translateY(-10px);
		background: var(--card-hover-color);
	}

	.game-icon {
		font-size: 3rem;
		margin-bottom: 10px;
	}

	.game-title {
		font-size: 1.5rem;
		margin-bottom: 10px;
	}

	.game-description {
		font-size: 1rem;
		text-align: center;
	}
</style>
