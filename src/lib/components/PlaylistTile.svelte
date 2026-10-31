<script>
	import { plural } from '../format.js';
	import Icon from './Icon.svelte';

	/** One playlist as an album cover: tap it to play, or watch it fill up while it loads. */
	let { row, href, index = 0, onupdate, onresume, onhide } = $props();

	let open = $state(false);
	let loadingNow = $derived(row.status === 'loading');
	let percent = $derived(
		row.total ? Math.min(Math.round((row.processed / row.total) * 100), 100) : 0
	);
	let partial = $derived(row.via === 'embed' && row.total >= 100);
	let score = $derived(row.mine?.item.score);
	let meta = $derived.by(() => {
		if (row.error === 'login')
			return `Stopped at ${row.processed} of ${row.total}. Log in to finish.`;
		if (row.error === 'failed') return `Stopped at ${row.processed} of ${row.total}.`;
		if (loadingNow) return `Loaded ${row.processed} of ${row.total}`;
		return plural(row.found, 'song');
	});
</script>

<li class="tile rise" class:loading={loadingNow} style:--i={index}>
	<svelte:element
		this={href ? 'a' : 'div'}
		class="art"
		{href}
		aria-label={href ? `Play ${row.title}` : undefined}
	>
		{#if row.cover}
			<img src={row.cover} alt="" loading="lazy" />
		{:else}
			<span class="blank" aria-hidden="true">{row.title.slice(0, 1)}</span>
		{/if}
		{#if loadingNow}
			<span class="fill" style:height="{100 - percent}%"></span>
			<span class="percent" aria-hidden="true">{percent}%</span>
		{/if}
		{#if href}
			<span class="go" aria-hidden="true"><Icon name="play" size={56} filled /></span>
		{/if}
		{#if score !== null && score !== undefined}
			<span class="score">{score}/5</span>
		{/if}
	</svelte:element>

	<div class="caption">
		<div class="text">
			<span class="name">{row.title}</span>
			<span class="meta" aria-live={loadingNow ? 'polite' : undefined}>{meta}</span>
		</div>
		<button
			class="more"
			type="button"
			aria-label="Options for {row.title}"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			<Icon name={open ? 'close' : 'menu'} size={20} />
		</button>
	</div>

	{#if open}
		<div class="options">
			{#if row.skipped}<p>{row.skipped} of its songs aren't available on Deezer.</p>{/if}
			{#if partial}
				<p>
					First 100 songs only. Spotify shares the rest only with the playlist's owner: log in, or
					copy it into your own playlist.
				</p>
			{/if}
			<div class="option-row">
				{#if row.error === 'login'}
					<a class="btn" href="/api/spotify/login" data-sveltekit-reload>Log in</a>
				{:else if row.error === 'failed'}
					<button class="btn" type="button" onclick={onresume}>Carry on loading</button>
				{:else if !loadingNow}
					<button
						class="btn"
						type="button"
						onclick={() => {
							open = false;
							onupdate();
						}}
					>
						Get new songs
					</button>
				{/if}
				<button class="btn btn-quiet" type="button" onclick={onhide}>Hide here</button>
			</div>
		</div>
	{/if}
</li>

<style>
	.tile {
		display: grid;
		align-content: start;
		gap: 8px;
		min-width: 0;
		animation-delay: calc(var(--i) * 50ms);
	}

	.art {
		position: relative;
		display: block;
		aspect-ratio: 1;
		overflow: hidden;
		background: var(--surface-raised);
		border-radius: var(--radius-md);
		transition:
			box-shadow 220ms var(--ease),
			transform 360ms var(--spring);
	}

	a.art:hover,
	a.art:focus-visible {
		box-shadow: 0 0 0 3px var(--mode);
		transform: rotate(-2deg) scale(1.03);
	}

	li:nth-child(even) a.art:hover,
	li:nth-child(even) a.art:focus-visible {
		transform: rotate(2deg) scale(1.03);
	}

	a.art:active {
		transform: scale(0.96);
	}

	.art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.blank {
		display: grid;
		place-items: center;
		height: 100%;
		color: var(--mode);
		font-size: clamp(3rem, 8vw, 5rem);
		font-weight: 700;
	}

	/* The cover comes into colour from the bottom up as the songs load. */
	.fill {
		position: absolute;
		inset: 0 0 auto;
		background: rgb(8 9 11 / 0.72);
		transition: height 500ms var(--ease);
	}

	.percent {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #fff;
		font-size: clamp(2rem, 5vw, 3.25rem);
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		letter-spacing: -0.04em;
		text-shadow: 0 2px 16px rgb(0 0 0 / 0.7);
	}

	.go {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		color: #fff;
		filter: drop-shadow(0 4px 18px rgb(0 0 0 / 0.75));
		opacity: 0;
		transform: scale(0.6);
		transition:
			opacity 160ms var(--ease),
			transform 360ms var(--spring);
	}

	a.art:hover .go,
	a.art:focus-visible .go {
		opacity: 1;
		transform: none;
	}

	.loading .go {
		display: none;
	}

	.score {
		position: absolute;
		top: 8px;
		left: 8px;
		padding: 2px 8px;
		background: var(--mode);
		border-radius: 999px;
		color: var(--on-accent);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
	}

	.caption {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}

	.text {
		display: grid;
		flex: 1;
		min-width: 0;
	}

	.name,
	.meta {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
		font-weight: 600;
	}

	.meta {
		color: var(--text-muted);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}

	.more {
		display: grid;
		flex: none;
		place-items: center;
		width: 36px;
		height: 36px;
		color: var(--text-faint);
		transition: color 160ms var(--ease);
	}

	.more:hover {
		color: var(--text);
	}

	.options {
		display: grid;
		gap: 8px;
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	.option-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
</style>
