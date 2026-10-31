<script>
	import Countdown from '#lib/components/Countdown.svelte';
	import GameTiles from '#lib/components/GameTiles.svelte';
	import { GROUPS } from '#lib/games/catalog.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>Games | Filmoteka</title>
	<meta
		name="description"
		content="Ten daily games: name the film from its music, a still or emoji, fill the grid and keep your streak."
	/>
</svelte:head>

<div class="container page">
	<div class="head">
		<h1 class="page-title">Games</h1>
		<Countdown />
	</div>

	{#each GROUPS as group (group.id)}
		<section class="games">
			<h2 class="section-title">{group.label}</h2>
			<GameTiles games={data.games.filter((game) => game.group === group.id)} />
		</section>
	{/each}
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 4px 24px;
	}

	.games {
		display: grid;
		gap: 14px;
		margin-top: clamp(24px, 4vw, 44px);
	}
</style>
