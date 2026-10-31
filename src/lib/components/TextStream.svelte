<script>
	import { tick } from 'svelte';

	/** One phrase at a time: it holds for a moment, then the next one rolls up into its place. */
	let { items = [], hold = 2600 } = $props();

	const MOVE = 900;

	let track = $state();
	let index = $state(0);
	let instant = $state(false);

	// The last row repeats the first, so the loop can jump back without anyone seeing it.
	async function advance() {
		if (index === items.length) {
			instant = true;
			index = 0;
			await tick();
			void track.offsetHeight;
			instant = false;
		}
		index += 1;
	}

	$effect(() => {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const timer = setInterval(advance, hold + MOVE);
		return () => clearInterval(timer);
	});
</script>

<span class="viewport" aria-hidden="true">
	<span
		class="track"
		class:instant
		bind:this={track}
		style:transform="translate3d(0, {index * -1.18}em, 0)"
		style:--move="{MOVE}ms"
	>
		{#each [...items, items[0]] as item, row (row)}
			<span class="item" class:active={row === index}>{item}</span>
		{/each}
	</span>
</span>

<style>
	.viewport {
		display: block;
		height: 1.18em;
		overflow: hidden;
	}

	.track {
		display: block;
		transition: transform var(--move) cubic-bezier(0.76, 0, 0.18, 1);
	}

	.item {
		display: block;
		height: 1.18em;
		line-height: 1.18;
		white-space: nowrap;
		opacity: 0;
		filter: blur(10px);
		transition:
			opacity var(--move) var(--ease),
			filter var(--move) var(--ease);
	}

	.item.active {
		opacity: 1;
		filter: none;
	}

	.instant,
	.instant .item {
		transition: none;
	}
</style>
