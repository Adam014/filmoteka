<script>
	/** One choice from a few, with a thumb that slides between them. Links if options have an href. */
	let { options, value, label, onselect = undefined } = $props();

	let track = $state();
	let thumb = $state({ x: 0, width: 0 });
	let ready = $state(false);

	function measure() {
		const active = track?.querySelector('[data-active="true"]');
		if (!active) return;
		thumb = { x: active.offsetLeft, width: active.offsetWidth };
		// Only the track scrolls: bringing the tab into view must never move the page.
		if (track.scrollWidth > track.clientWidth) {
			track.scrollLeft = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
		}
	}

	$effect(() => {
		void value;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(track);
		const frame = requestAnimationFrame(() => (ready = true));
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	});
</script>

<div class="segmented" bind:this={track} role="group" aria-label={label}>
	<span
		class="thumb"
		class:ready
		style:width="{thumb.width}px"
		style:transform="translateX({thumb.x}px)"
		aria-hidden="true"
	></span>
	{#each options as option (option.id)}
		{#if option.href}
			<a
				href={option.href}
				data-active={option.id === value}
				aria-current={option.id === value ? 'true' : undefined}
			>
				{option.label}
			</a>
		{:else}
			<button
				type="button"
				data-active={option.id === value}
				aria-pressed={option.id === value}
				onclick={() => onselect?.(option.id)}
			>
				{option.label}
			</button>
		{/if}
	{/each}
</div>

<style>
	.segmented {
		position: relative;
		display: inline-flex;
		max-width: 100%;
		padding: 4px;
		overflow-x: auto;
		background: rgb(255 255 255 / 0.05);
		border-radius: 999px;
		scrollbar-width: none;
	}

	.segmented::-webkit-scrollbar {
		display: none;
	}

	.thumb {
		position: absolute;
		top: 4px;
		bottom: 4px;
		left: 0;
		background: rgb(255 255 255 / 0.14);
		border-radius: 999px;
	}

	.thumb.ready {
		transition:
			transform 420ms var(--spring),
			width 420ms var(--spring);
	}

	a,
	button {
		position: relative;
		display: inline-flex;
		flex: none;
		align-items: center;
		min-height: 36px;
		padding: 0 14px;
		border-radius: 999px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-weight: 500;
		white-space: nowrap;
		transition: color 160ms var(--ease);
	}

	a:hover,
	button:hover,
	[data-active='true'] {
		color: var(--text);
	}
</style>
