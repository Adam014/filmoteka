<script>
	import { initials } from '../format.js';

	let { name = '', src = null, size = 32 } = $props();
	let failed = $state(false);

	$effect(() => {
		// A new image gets a fresh chance to load.
		if (src) failed = false;
	});
</script>

<span class="avatar" style:--size="{size}px">
	{#if src && !failed}
		<img {src} alt="" loading="lazy" onerror={() => (failed = true)} />
	{:else}
		<span aria-hidden="true">{initials(name)}</span>
	{/if}
</span>

<style>
	.avatar {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: var(--size);
		height: var(--size);
		overflow: hidden;
		border-radius: 50%;
		background: var(--surface-raised);
		color: var(--text-muted);
		font-size: max(14px, calc(var(--size) * 0.36));
		font-weight: 500;
		line-height: 1;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
