<script>
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
	<h1 class="page-title">Games</h1>
	<p class="page-lede">New puzzles every day. No sign-up needed.</p>

	<div class="games">
		<GameTiles games={data.games} />
	</div>
</div>

<style>
	.games {
		margin-top: clamp(20px, 4vw, 36px);
	}
</style>
