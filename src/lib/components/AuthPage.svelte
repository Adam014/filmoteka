<script>
	let { title, lede = '', children, footer = undefined } = $props();
</script>

<div class="auth container">
	<h1 class="page-title">{title}</h1>
	{#if lede}<p class="lede">{lede}</p>{/if}
	<div class="content">{@render children()}</div>
	{#if footer}<div class="footer">{@render footer()}</div>{/if}
</div>

<style>
	.auth {
		max-width: calc(420px + 2 * var(--gutter));
		padding-block: clamp(48px, 10vh, 112px);
	}

	.lede {
		margin-top: 12px;
		color: var(--text-muted);
	}

	.content {
		margin-top: 32px;
	}

	.content :global(form) {
		display: grid;
		gap: 18px;
	}

	.footer {
		display: grid;
		gap: 8px;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
		color: var(--text-muted);
		font-size: 0.9375rem;
	}
</style>
