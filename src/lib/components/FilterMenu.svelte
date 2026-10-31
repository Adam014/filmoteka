<script>
	import Icon from './Icon.svelte';

	/**
	 * A chip that opens a short list. The first option counts as "no filter", and the chip lights up
	 * as soon as anything else is picked. Options are links if they have an href.
	 */
	let { id, label, options, value, onselect = undefined, neutral = false } = $props();

	let trigger = $state();
	let panel = $state();

	let selected = $derived(options.find((option) => option.id === value));
	let active = $derived(!neutral && value !== options[0].id);

	// Placed before it shows so it never flashes elsewhere, then nudged back if it would overflow.
	function place(event) {
		if (event.newState !== 'open') return;
		const box = trigger.getBoundingClientRect();
		panel.style.inset = `${box.bottom + 6}px auto auto ${Math.max(8, box.left)}px`;
	}

	function nudge(event) {
		if (event.newState !== 'open') return;
		const box = trigger.getBoundingClientRect();
		const left = Math.min(Math.max(8, box.left), innerWidth - panel.offsetWidth - 8);
		panel.style.left = `${left}px`;
	}

	function close() {
		if (panel?.matches(':popover-open')) panel.hidePopover();
	}

	function pick(option) {
		close();
		onselect?.(option.id);
	}
</script>

<svelte:window onscroll={close} />

<button
	class="chip menu-chip"
	class:on={active}
	type="button"
	popovertarget={id}
	bind:this={trigger}
>
	<span class="label">{label}</span>
	{#if active || neutral}<span class="value">{selected?.label}</span>{/if}
	<Icon name="chevron" size={16} />
</button>

<div {id} popover="auto" class="list" bind:this={panel} onbeforetoggle={place} ontoggle={nudge}>
	{#each options as option (option.id)}
		{#if option.href}
			<a
				class="item"
				href={option.href}
				aria-current={option.id === value ? 'true' : undefined}
				onclick={close}
			>
				{option.label}
				{#if option.id === value}<Icon name="check" size={16} />{/if}
			</a>
		{:else}
			<button
				class="item"
				type="button"
				aria-current={option.id === value ? 'true' : undefined}
				onclick={() => pick(option)}
			>
				{option.label}
				{#if option.id === value}<Icon name="check" size={16} />{/if}
			</button>
		{/if}
	{/each}
</div>

<style>
	.menu-chip {
		gap: 6px;
	}

	.menu-chip :global(svg) {
		margin-right: -4px;
		transition: transform 240ms var(--ease);
	}

	.menu-chip:hover :global(svg) {
		transform: translateY(1px);
	}

	.menu-chip.on {
		background: rgb(255 255 255 / 0.1);
		border-color: var(--line-strong);
		color: var(--text-muted);
	}

	.value {
		font-weight: 600;
	}

	.value {
		color: var(--text);
	}

	.list {
		position: fixed;
		min-width: 180px;
		max-height: min(360px, 60dvh);
		margin: 0;
		padding: 6px;
		overflow-y: auto;
		background: var(--surface-raised);
		color: var(--text);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		box-shadow: 0 18px 50px rgb(0 0 0 / 0.55);
		opacity: 0;
		transform: translateY(-6px) scale(0.98);
		transform-origin: top left;
		transition:
			opacity 160ms var(--ease),
			transform 260ms var(--spring),
			display 160ms allow-discrete,
			overlay 160ms allow-discrete;
	}

	.list:popover-open {
		opacity: 1;
		transform: none;
	}

	@starting-style {
		.list:popover-open {
			opacity: 0;
			transform: translateY(-6px) scale(0.98);
		}
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		width: 100%;
		min-height: 40px;
		padding: 0 12px;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-size: 0.9375rem;
		text-align: left;
		white-space: nowrap;
		transition:
			color 120ms var(--ease),
			background-color 120ms var(--ease);
	}

	.item:hover {
		background: rgb(255 255 255 / 0.07);
		color: var(--text);
	}

	.item[aria-current='true'] {
		color: var(--text);
		font-weight: 500;
	}

	.item :global(svg) {
		color: var(--accent);
	}
</style>
