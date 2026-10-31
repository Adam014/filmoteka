<script>
	import { msUntilNextDay } from '../games/seed.js';
	import { onMount } from 'svelte';

	let remaining = $state(null);

	const pad = (value) => String(value).padStart(2, '0');
	let label = $derived.by(() => {
		if (remaining === null) return '';
		const total = Math.floor(remaining / 1000);
		return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
	});

	onMount(() => {
		const tick = () => (remaining = msUntilNextDay());
		tick();
		const timer = setInterval(tick, 1000);
		return () => clearInterval(timer);
	});
</script>

{#if label}
	<p class="countdown">Next puzzle in <span>{label}</span></p>
{/if}

<style>
	.countdown {
		color: var(--text-faint);
		font-size: 0.9375rem;
	}

	span {
		color: var(--text);
		font-variant-numeric: tabular-nums;
	}
</style>
