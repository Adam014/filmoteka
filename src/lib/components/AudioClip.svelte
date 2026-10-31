<script>
	import { untrack } from 'svelte';
	import Icon from './Icon.svelte';

	/**
	 * Plays a track from `start` and stops exactly at the limit. `reach` is how much of the bar is
	 * unlocked, from 0 to 1, so the wave fills up as more of the clip is earned.
	 */
	let { src, start = 0, limit, reach = 1, label = 'Play the clip' } = $props();

	const BARS = 40;
	const heights = Array.from(
		{ length: BARS },
		(_, index) => 22 + Math.abs(Math.sin(index * 1.7) * Math.cos(index * 0.6)) * 78
	);

	let audio;
	let frame = 0;
	let from = 0;
	let playing = $state(false);
	let progress = $state(0);
	let failed = $state(false);

	function stop() {
		cancelAnimationFrame(frame);
		audio?.pause();
		playing = false;
	}

	function watch() {
		if (!audio) return;
		if (!audio.seeking) {
			const played = audio.currentTime - from;
			progress = Math.min(Math.max(played, 0) / limit, 1);
			if (played >= limit || audio.ended) {
				stop();
				progress = 0;
				return;
			}
		}
		frame = requestAnimationFrame(watch);
	}

	$effect(() => {
		const source = src;
		untrack(() => {
			stop();
			failed = false;
		});
		const element = new Audio(source);
		element.preload = 'auto';
		element.onerror = () => (failed = true);
		audio = element;
		return () => {
			cancelAnimationFrame(frame);
			element.pause();
			element.onerror = null;
			element.removeAttribute('src');
			element.load();
		};
	});

	// A longer clip always starts again from the top.
	$effect(() => {
		void limit;
		untrack(() => {
			stop();
			progress = 0;
		});
	});

	async function toggle() {
		if (!audio) return;
		if (playing) {
			stop();
			progress = 0;
			return;
		}
		failed = false;
		// A failed load is usually a link that aged out: asking again gets a fresh one.
		if (audio.error) audio.load();
		// The clip is short, so a long listen late in it reaches further back to fit.
		from = Math.min(start, Math.max((audio.duration || 30) - limit, 0));
		audio.currentTime = from;
		progress = 0;
		try {
			await audio.play();
			playing = true;
			frame = requestAnimationFrame(watch);
		} catch (error) {
			if (error.name !== 'AbortError') failed = true;
		}
	}

	function onkeydown(event) {
		const typing = /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(event.target.tagName);
		if (event.code === 'Space' && !typing) {
			event.preventDefault();
			toggle();
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="clip" class:playing>
	<div class="wave" aria-hidden="true">
		{#each [0, 1, 2] as layer (layer)}
			<div
				class="layer layer-{layer}"
				style:width={layer === 0 ? '100%' : `${(layer === 1 ? reach : reach * progress) * 100}%`}
			>
				<div class="bars">
					{#each heights as height, index (index)}
						<span style:height="{height}%" style:--i={index % 7}></span>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<button class="play" type="button" onclick={toggle} aria-label={playing ? 'Stop' : label}>
		<Icon name={playing ? 'pause' : 'play'} size={30} filled={!playing} />
	</button>
	{#if failed}
		<p class="failed" role="alert">The clip didn't load. Tap play to try again.</p>
	{/if}
</div>

<style>
	.clip {
		display: grid;
		justify-items: center;
		gap: clamp(12px, 3vh, 28px);
		width: 100%;
	}

	.wave {
		position: relative;
		width: 100%;
		max-width: 720px;
		height: clamp(56px, 16vh, 150px);
		container-type: inline-size;
	}

	.layer {
		position: absolute;
		inset: 0 auto 0 0;
		overflow: hidden;
	}

	/* Every layer draws the same bars at full width, then gets cut to length. */
	.bars {
		display: flex;
		align-items: center;
		gap: 3px;
		width: 100cqw;
		height: 100%;
	}

	.bars span {
		flex: 1;
		min-width: 0;
		background: rgb(255 255 255 / 0.1);
		border-radius: 999px;
	}

	.layer-1 .bars span {
		background: rgb(255 255 255 / 0.42);
	}

	.layer-2 .bars span {
		background: var(--accent);
	}

	.playing .bars span {
		animation: bounce 700ms var(--ease) infinite alternate;
		animation-delay: calc(var(--i) * -90ms);
	}

	@keyframes bounce {
		to {
			transform: scaleY(0.62);
		}
	}

	.play {
		display: grid;
		place-items: center;
		width: 76px;
		height: 76px;
		background: var(--accent);
		border-radius: 50%;
		color: var(--on-accent);
		transition:
			box-shadow 220ms var(--ease),
			transform 320ms var(--spring);
	}

	.play:hover {
		box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 20%, transparent);
		transform: scale(1.05);
	}

	.play:active {
		transform: scale(0.94);
	}

	.failed {
		color: var(--danger);
	}

	@media (prefers-reduced-motion: reduce) {
		.playing .bars span {
			animation: none;
		}
	}
</style>
