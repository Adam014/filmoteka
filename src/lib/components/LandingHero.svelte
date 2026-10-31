<script>
	import { MOODS } from '../moods.js';
	import { imageUrl } from '../media.js';
	import { palette } from '../state/palette.svelte.js';
	import Icon from './Icon.svelte';
	import TextStream from './TextStream.svelte';

	let { posters = [] } = $props();

	const WORDS = ['tonight?', 'this weekend?', 'after dinner?', 'with popcorn?'];
	const COLUMNS = 6;
	const PER_COLUMN = 8;

	let hero = $state();
	let shortcut = $state('Ctrl K');

	let columns = $derived(
		Array.from({ length: COLUMNS }, (_, column) =>
			Array.from(
				{ length: PER_COLUMN },
				(_, row) => posters[(column * PER_COLUMN + row) % Math.max(posters.length, 1)]
			)
		)
	);

	$effect(() => {
		if (/mac|iphone|ipad/i.test(navigator.platform)) shortcut = '⌘K';
	});

	// A pool of light follows the pointer over the wall of posters.
	let frame = 0;
	function onpointermove(event) {
		if (event.pointerType !== 'mouse') return;
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const box = hero.getBoundingClientRect();
			hero.style.setProperty('--mx', `${event.clientX - box.left}px`);
			hero.style.setProperty('--my', `${event.clientY - box.top}px`);
			hero.style.setProperty('--px', String((event.clientX - box.left) / box.width - 0.5));
			hero.style.setProperty('--py', String((event.clientY - box.top) / box.height - 0.5));
			hero.style.setProperty('--lit', '1');
		});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<section
	class="hero"
	bind:this={hero}
	{onpointermove}
	onpointerleave={() => hero.style.setProperty('--lit', '0')}
>
	<div class="wall" aria-hidden="true">
		{#each columns as column, index (index)}
			<div class="column" class:reverse={index % 2 === 1} style:--speed="{70 + index * 9}s">
				{#each [0, 1] as copy (copy)}
					<div class="set">
						{#each column as path, row (`${copy}-${row}`)}
							{#if path}
								<img src={imageUrl(path, 'w342')} alt="" width="342" height="513" />
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		{/each}
	</div>
	<div class="veil" aria-hidden="true"></div>

	<div class="container copy">
		<h1>
			<span class="line">What are we watching</span>
			<span class="visually-hidden">{WORDS[0]}</span>
			<span class="line stream"><TextStream items={WORDS} /></span>
		</h1>

		<button class="search" type="button" onclick={() => (palette.open = true)}>
			<Icon name="search" size={22} />
			<span>Search films, series and people</span>
			<kbd>{shortcut}</kbd>
		</button>

		<ul class="moods">
			{#each MOODS as mood, index (mood.id)}
				<li class="rise" style:--i={index + 4}>
					<a class="chip" href="/mood?mood={mood.id}" style:--chip-color={mood.color}
						>{mood.label}</a
					>
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.hero {
		--mx: 50%;
		--my: 40%;
		--px: 0;
		--py: 0;
		--lit: 0;
		position: relative;
		display: grid;
		align-items: center;
		min-height: min(100svh, 980px);
		margin-top: calc(var(--header-height) * -1);
		padding-block: calc(var(--header-height) + 24px) 48px;
		overflow: hidden;
		isolation: isolate;
	}

	.wall {
		position: absolute;
		z-index: -2;
		inset: -22% -12%;
		display: grid;
		grid-template-columns: repeat(6, minmax(0, 1fr));
		gap: 14px;
		transform: rotate(-9deg) translate(calc(var(--px) * -28px), calc(var(--py) * -28px));
		transition: transform 900ms var(--ease);
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 14px;
		animation: climb var(--speed) linear infinite;
	}

	.column.reverse {
		animation-direction: reverse;
	}

	.set {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.wall img {
		width: 100%;
		height: auto;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		background: var(--surface);
		border-radius: var(--radius-md);
	}

	@keyframes climb {
		to {
			transform: translateY(calc(-50% - 7px));
		}
	}

	/* The wall stays dim, except for a soft pool of light under the pointer. */
	.veil {
		position: absolute;
		z-index: -1;
		inset: 0;
		background:
			linear-gradient(to top, var(--bg), transparent 26%),
			linear-gradient(to bottom, var(--bg), transparent 18%),
			radial-gradient(
				circle calc(120px + var(--lit) * 300px) at var(--mx) var(--my),
				rgb(8 9 11 / 0.42),
				rgb(8 9 11 / 0.86) 100%
			);
	}

	.copy {
		display: grid;
		justify-items: center;
		text-align: center;
	}

	h1 {
		display: grid;
		font-size: clamp(2.5rem, 8.2vw, 7.25rem);
		font-weight: 600;
		letter-spacing: -0.05em;
		line-height: 1;
		text-shadow: 0 2px 40px rgb(0 0 0 / 0.6);
	}

	.stream {
		display: block;
		color: var(--accent);
	}

	.search {
		display: flex;
		align-items: center;
		gap: 14px;
		width: min(100%, 640px);
		min-height: 64px;
		margin-top: clamp(24px, 4vh, 40px);
		padding: 0 22px;
		background: rgb(20 21 25 / 0.72);
		border: 1px solid var(--line-strong);
		border-radius: 999px;
		color: var(--text-muted);
		font-size: 1.0625rem;
		text-align: left;
		backdrop-filter: blur(20px) saturate(1.4);
		-webkit-backdrop-filter: blur(20px) saturate(1.4);
		transition:
			border-color 180ms var(--ease),
			box-shadow 260ms var(--ease),
			transform 360ms var(--spring);
	}

	.search:hover {
		border-color: var(--accent);
		box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 16%, transparent);
		color: var(--text);
		transform: translateY(-2px);
	}

	.search span {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.moods {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		max-width: 880px;
		margin-top: 20px;
	}

	.moods .chip {
		background: rgb(20 21 25 / 0.6);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
	}

	.moods .chip:hover {
		background: var(--chip-color);
		border-color: var(--chip-color);
		color: var(--on-accent);
	}

	@media (max-width: 767px) {
		.wall {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			inset: -22% -30%;
		}

		.column:nth-child(n + 5) {
			display: none;
		}

		kbd {
			display: none;
		}

		.search {
			min-height: 56px;
			font-size: 1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.column {
			animation: none;
		}
	}
</style>
