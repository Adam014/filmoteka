<script>
	let { title, heading = 'h2', children = undefined } = $props();
</script>

<div class="empty" role="status">
	<svelte:element this={heading} class="title">{title}</svelte:element>
	{#if children}<div class="body">{@render children()}</div>{/if}
</div>

<style>
	.empty {
		padding-block: clamp(48px, 10vw, 112px);
		max-width: 52ch;
	}

	.title {
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.body {
		display: grid;
		justify-items: start;
		gap: 20px;
		margin-top: 12px;
		color: var(--text-muted);
	}
</style>
