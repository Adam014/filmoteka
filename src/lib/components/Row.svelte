<script>
	import { dragScroll, stagger } from '../actions/motion.js';
	import Icon from './Icon.svelte';

	let { title, action = undefined, children, count = 0 } = $props();

	let scroller = $state();
	let canPrevious = $state(false);
	let canNext = $state(false);

	function measure() {
		if (!scroller) return;
		const { scrollLeft, scrollWidth, clientWidth } = scroller;
		canPrevious = scrollLeft > 4;
		canNext = scrollLeft + clientWidth < scrollWidth - 4;
	}

	function move(direction) {
		scroller.scrollBy({ left: direction * scroller.clientWidth * 0.85, behavior: 'smooth' });
	}

	$effect(() => {
		count;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(scroller);
		return () => observer.disconnect();
	});
</script>

<section class="section">
	<div class="container section-head">
		<h2 class="section-title">{title}</h2>
		<div class="controls">
			{#if action}{@render action()}{/if}
			{#if canPrevious || canNext}
				<div class="arrows">
					<button
						class="icon-btn"
						type="button"
						aria-label="Scroll {title} back"
						disabled={!canPrevious}
						onclick={() => move(-1)}
					>
						<Icon name="left" />
					</button>
					<button
						class="icon-btn"
						type="button"
						aria-label="Scroll {title} forward"
						disabled={!canNext}
						onclick={() => move(1)}
					>
						<Icon name="right" />
					</button>
				</div>
			{/if}
		</div>
	</div>
	<div class="scroller" bind:this={scroller} onscroll={measure} use:dragScroll use:stagger>
		{@render children()}
	</div>
</section>

<style>
	.controls {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 44px;
	}

	.arrows {
		display: none;
	}

	.icon-btn:disabled {
		opacity: 0.3;
	}

	.scroller {
		--inset: max(var(--gutter), calc((100vw - var(--content-max)) / 2 + var(--gutter)));
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: clamp(132px, 15vw, 196px);
		gap: clamp(12px, 1.6vw, 24px);
		padding-inline: var(--inset);
		overflow-x: auto;
		scroll-padding-inline: var(--inset);
		scroll-snap-type: x proximity;
		scrollbar-width: none;
	}

	.scroller::-webkit-scrollbar {
		display: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.scroller {
			cursor: grab;
		}

		.scroller:global(.dragging) {
			cursor: grabbing;
			scroll-snap-type: none;
			user-select: none;
		}

		.scroller:global(.dragging) :global(a) {
			pointer-events: none;
		}
	}

	.scroller > :global(*) {
		scroll-snap-align: start;
	}

	@media (hover: hover) and (min-width: 768px) {
		.arrows {
			display: flex;
		}
	}
</style>
