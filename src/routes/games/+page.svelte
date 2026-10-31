<script>
	import Countdown from '#lib/components/Countdown.svelte';
	import GameTiles from '#lib/components/GameTiles.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Games | Filmoteka</title>
	<meta
		name="description"
		content="Daily film puzzles: guess from stills, sort films into groups and beat your best streak."
	/>
</svelte:head>

<div class="container page">
	<div class="head">
		<h1 class="page-title">Games</h1>
		<Countdown />
	</div>

	<div class="games">
		<GameTiles games={data.games} />
	</div>
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
		margin-top: clamp(16px, 3vw, 28px);
	}
</style>
