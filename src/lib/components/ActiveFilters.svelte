<script>
	import { flip } from 'svelte/animate';
	import { scale } from 'svelte/transition';
	import Icon from './Icon.svelte';

	/** Everything currently narrowing the results, each removable with one click. */
	let { items, clearHref } = $props();
</script>

{#if items.length}
	<ul class="active" aria-label="Active filters">
		{#each items as item (item.key)}
			<li animate:flip={{ duration: 260 }} transition:scale={{ duration: 180, start: 0.8 }}>
				<a href={item.href} aria-label="Remove filter {item.label}">
					{item.label}<Icon name="close" size={15} />
				</a>
			</li>
		{/each}
		{#if items.length > 1}
			<li transition:scale={{ duration: 180, start: 0.8 }}>
				<a class="clear" href={clearHref}>Clear all</a>
			</li>
		{/if}
	</ul>
{/if}

<style>
	.active {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 0 10px 0 14px;
		background: color-mix(in srgb, var(--badge-color, var(--accent)) 14%, transparent);
		border-radius: 999px;
		color: var(--badge-color, var(--accent));
		font-size: 0.9375rem;
		font-weight: 500;
		transition: background-color 160ms var(--ease);
	}

	a:hover {
		background: color-mix(in srgb, var(--badge-color, var(--accent)) 26%, transparent);
	}

	.clear {
		padding-inline: 12px;
		background: none;
		color: var(--text-muted);
	}

	.clear:hover {
		background: none;
		color: var(--text);
	}
</style>
