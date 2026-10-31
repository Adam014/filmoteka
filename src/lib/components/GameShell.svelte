<script>
	import Icon from './Icon.svelte';

	let {
		title,
		back = '/games',
		backLabel = 'All games',
		bleed = false,
		status = undefined,
		children
	} = $props();
</script>

<div class="game-shell">
	<div class="bar">
		<a class="icon-btn" href={back} aria-label={backLabel}><Icon name="left" /></a>
		<h1>{title}</h1>
		{#if status}<div class="status">{@render status()}</div>{/if}
	</div>
	<div class="body" class:bleed>{@render children()}</div>
</div>

<style>
	.game-shell {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
	}

	.bar {
		display: flex;
		flex: none;
		align-items: center;
		gap: 4px;
		min-height: 56px;
		padding-inline: calc(var(--gutter) - 10px) var(--gutter);
	}

	h1 {
		overflow: hidden;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: -0.02em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		display: flex;
		flex: none;
		align-items: center;
		gap: 12px;
		margin-left: auto;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-variant-numeric: tabular-nums;
	}

	.body {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
		padding: 0 var(--gutter) 16px;
	}

	.body.bleed {
		padding: 0;
	}
</style>
