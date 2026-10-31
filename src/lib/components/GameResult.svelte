<script>
	import { nextGame } from '../games/catalog.js';
	import Countdown from './Countdown.svelte';
	import ShareButton from './ShareButton.svelte';

	/** The end of a daily game: how it went, what to share and where to go next. */
	let {
		game,
		won,
		verdict,
		heading,
		note = '',
		share,
		href = '',
		hrefLabel = '',
		daily = true,
		children = undefined
	} = $props();

	let next = $derived(nextGame(game));
</script>

<div class="result rise" class:won role="status">
	<p class="verdict">{verdict}</p>
	<h2>{heading}</h2>
	{#if note}<p class="note">{note}</p>{/if}
</div>
{#if children}{@render children()}{/if}
<div class="actions">
	<ShareButton text={share} primary />
	{#if href}<a class="btn" {href}>{hrefLabel}</a>{/if}
	{#if daily}<a class="btn btn-quiet" href={next.href}>Next: {next.name}</a>{/if}
</div>
{#if daily}<Countdown />{/if}

<style>
	.verdict {
		color: var(--danger);
	}

	.won .verdict {
		color: var(--success);
	}

	h2 {
		font-size: clamp(1.375rem, 3vw, 2rem);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.note {
		color: var(--text-muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-block: 10px 8px;
	}
</style>
