<script>
	import { buzz, celebrate, dragScroll } from '#lib/actions/motion.js';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import GameShell from '#lib/components/GameShell.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Pips from '#lib/components/Pips.svelte';
	import { formatRating, plural, yearOf } from '#lib/format.js';
	import { imageUrl, mediaHref } from '#lib/media.js';
	import { readPicks, writePicks } from '#lib/state/arcade.js';
	import { auth } from '#lib/state/auth.svelte.js';
	import { isFavorite, toggleFavorite } from '#lib/state/favorites.svelte.js';
	import { isGuest } from '#lib/user.js';
	import { onMount } from 'svelte';

	const ROUND = 10;
	const THRESHOLD = 100;
	const FLICK = 0.7;
	const TAP = 6;
	const EXIT_MS = 280;
	const VISIBLE = 3;

	let queue = $state([]);
	let picks = $state([]);
	let history = $state([]);
	let failed = $state(false);
	let dx = $state(0);
	let dy = $state(0);
	let dragging = $state(false);
	let exiting = $state(0);
	let expanded = $state(false);

	const seen = new Set();
	let loading = false;
	let startX = 0;
	let startY = 0;
	let lastX = 0;
	let lastTime = 0;
	let speed = 0;
	let timer;

	let done = $derived(history.length >= ROUND);
	let top = $derived(queue[0]);
	let visible = $derived(queue.slice(0, VISIBLE));
	let member = $derived(auth.user && !isGuest(auth.user));
	let progress = $derived(exiting ? 1 : Math.min(Math.abs(dx) / THRESHOLD, 1));
	let keepAmount = $derived(exiting > 0 ? 1 : Math.min(Math.max(dx, 0) / THRESHOLD, 1));
	let passAmount = $derived(exiting < 0 ? 1 : Math.min(Math.max(-dx, 0) / THRESHOLD, 1));
	let marks = $derived(history.map((entry) => (entry.kept ? 'right' : 'done')));
	let kept = $derived(history.filter((entry) => entry.kept).map((entry) => entry.movie));
	let winner = $derived([...kept].sort((a, b) => b.rating - a.rating)[0]);
	let others = $derived(picks.filter((movie) => movie.id !== winner?.id).slice(0, 12));

	async function refill() {
		if (loading) return;
		loading = true;
		try {
			const recent = [...seen].slice(-200).join(',');
			const response = await fetch(`/api/swipe?seen=${recent}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const { movies } = await response.json();
			const fresh = movies.filter((movie) => !seen.has(movie.id));
			fresh.forEach((movie) => seen.add(movie.id));
			queue = [...queue, ...fresh];
			failed = false;
		} catch {
			failed = !queue.length;
		} finally {
			loading = false;
		}
		if (!failed && !queue.length) refill();
	}

	onMount(() => {
		picks = readPicks();
		picks.forEach((movie) => seen.add(movie.id));
		refill();
		return () => clearTimeout(timer);
	});

	function decide(direction) {
		if (exiting || !top || done) return;
		const movie = top;
		const keep = direction > 0;
		const newPick = keep && !picks.some((item) => item.id === movie.id);
		const favorited = keep && Boolean(member) && !isFavorite(movie);

		dragging = false;
		expanded = false;
		exiting = direction;
		buzz(keep ? 15 : 8);
		if (newPick) {
			picks = [movie, ...picks];
			writePicks($state.snapshot(picks));
		}
		if (favorited) toggleFavorite(movie);

		timer = setTimeout(() => {
			history = [...history, { movie, kept: keep, newPick, favorited }];
			queue = queue.slice(1);
			dx = 0;
			dy = 0;
			exiting = 0;
			if (queue.length < ROUND) refill();
			if (done && kept.length) celebrate(28);
		}, EXIT_MS);
	}

	function undo() {
		if (exiting || !history.length) return;
		const last = history.at(-1);
		history = history.slice(0, -1);
		queue = [last.movie, ...queue];
		if (last.newPick) {
			picks = picks.filter((movie) => movie.id !== last.movie.id);
			writePicks($state.snapshot(picks));
		}
		if (last.favorited && isFavorite(last.movie)) toggleFavorite(last.movie);
	}

	function again() {
		history = [];
		if (queue.length < ROUND) refill();
	}

	function clearPicks() {
		picks = [];
		writePicks([]);
	}

	function onpointerdown(event) {
		if (exiting || event.button !== 0) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		dragging = true;
		startX = lastX = event.clientX;
		startY = event.clientY;
		lastTime = event.timeStamp;
		speed = 0;
	}

	function onpointermove(event) {
		if (!dragging) return;
		dx = event.clientX - startX;
		dy = event.clientY - startY;
		const elapsed = event.timeStamp - lastTime;
		if (elapsed > 0) speed = (event.clientX - lastX) / elapsed;
		lastX = event.clientX;
		lastTime = event.timeStamp;
	}

	function onpointerup() {
		if (!dragging) return;
		dragging = false;
		const moved = Math.hypot(dx, dy);
		if (moved < TAP) expanded = !expanded;
		const flicked = Math.abs(speed) > FLICK && Math.abs(dx) > 30;
		if (Math.abs(dx) >= THRESHOLD || flicked) {
			decide(Math.sign(dx));
		} else {
			dx = 0;
			dy = 0;
		}
	}

	function onkeydown(event) {
		if (event.target.closest?.('input, textarea, select, dialog')) return;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			event.preventDefault();
			decide(event.key === 'ArrowRight' ? 1 : -1);
		}
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			expanded = !expanded;
		}
		if (event.key === 'Backspace') undo();
	}

	function cardTransform(depth) {
		if (depth > 0) {
			const step = depth - progress;
			return `translateY(${step * 12}px) scale(${1 - step * 0.05})`;
		}
		if (exiting) return `translate(${exiting * 130}vw, ${dy}px) rotate(${exiting * 26}deg)`;
		return `translate(${dx}px, ${dy * 0.2}px) rotate(${dx / 20}deg)`;
	}
</script>

<svelte:window {onkeydown} />

<svelte:head>
	<title>Swipe | Filmoteka</title>
	<meta name="description" content="Swipe through ten films and find tonight's pick." />
</svelte:head>

<GameShell title="Swipe" back="/" backLabel="Home">
	{#snippet status()}
		{#if !done}
			<Pips total={ROUND} {marks} label="Film {history.length + 1} of {ROUND}" />
		{/if}
	{/snippet}

	{#if failed}
		<EmptyState title="The stack didn't load">
			<p>Give it another go in a moment.</p>
			<button class="btn" type="button" onclick={refill}>Try again</button>
		</EmptyState>
	{:else if done}
		<div class="done">
			{#if winner}
				<a class="pick" href={mediaHref(winner)} aria-label={winner.title}>
					<img src={imageUrl(winner.poster_path, 'w500')} alt="" />
				</a>
				<div class="verdict rise">
					<p class="eyebrow">Tonight's pick</p>
					<h2>{winner.title}</h2>
					<p class="meta">
						{#if yearOf(winner.date)}<span>{yearOf(winner.date)}</span>{/if}
						{#if formatRating(winner.rating)}
							<span class="rating">
								<Icon name="star" size={15} filled />{formatRating(winner.rating)}
							</span>
						{/if}
						<span>Top rated of the {plural(kept.length, 'film')} you kept</span>
					</p>
					<div class="actions">
						<a class="btn btn-primary" href={mediaHref(winner)}>Open film</a>
						<button class="btn" type="button" onclick={again}>Swipe 10 more</button>
					</div>
					{#if others.length}
						<div class="others-head">
							<p>Also kept</p>
							<button class="link" type="button" onclick={clearPicks}>Clear</button>
						</div>
						<ul class="others" use:dragScroll>
							{#each others as movie (movie.id)}
								<li>
									<a href={mediaHref(movie)} draggable="false" aria-label={movie.title}>
										<img
											src={imageUrl(movie.poster_path, 'w185')}
											alt=""
											draggable="false"
											loading="lazy"
										/>
									</a>
								</li>
							{/each}
						</ul>
					{/if}
					{#if !member}
						<p class="cta">
							<a class="link" href="/register">Create an account</a> to keep these in your favorites.
						</p>
					{/if}
				</div>
			{:else}
				<div class="verdict rise">
					<h2>Nothing grabbed you</h2>
					<p class="meta">Ten more might do it.</p>
					<div class="actions">
						<button class="btn btn-primary" type="button" onclick={again}>Swipe 10 more</button>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="table">
			<div class="deck" aria-busy={!top}>
				{#if !top}
					<div class="skeleton card"></div>
				{/if}
				{#each visible as movie, depth (movie.id)}
					{@const rating = formatRating(movie.rating)}
					<div
						class="card"
						class:dragging={depth === 0 && dragging}
						class:teach={depth === 0 && !history.length && !dragging && dx === 0 && !expanded}
						style:z-index={VISIBLE - depth}
						style:transform={cardTransform(depth)}
						aria-hidden={depth > 0}
						onpointerdown={depth === 0 ? onpointerdown : undefined}
						onpointermove={depth === 0 ? onpointermove : undefined}
						onpointerup={depth === 0 ? onpointerup : undefined}
						onpointercancel={depth === 0 ? onpointerup : undefined}
					>
						<img src={imageUrl(movie.poster_path, 'w500')} alt="" draggable="false" />
						{#if depth === 0}
							<span class="stamp keep" style:opacity={keepAmount}>Keep</span>
							<span class="stamp pass" style:opacity={passAmount}>Pass</span>
						{/if}
						<div class="info">
							<h2>{movie.title}</h2>
							<p class="meta">
								{#if yearOf(movie.date)}<span>{yearOf(movie.date)}</span>{/if}
								{#if rating}
									<span class="rating"><Icon name="star" size={15} filled />{rating}</span>
								{/if}
							</p>
							{#if movie.overview}
								<div class="story" class:open={depth === 0 && expanded}>
									<p>{movie.overview}</p>
								</div>
							{/if}
							{#if depth === 0 && !history.length && !expanded}
								<p class="tap">Tap for the story</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="controls">
			<button class="btn big" type="button" disabled={!top} onclick={() => decide(-1)}>
				<Icon name="close" size={20} />Pass
			</button>
			<button class="btn btn-quiet" type="button" disabled={!history.length} onclick={undo}>
				Undo
			</button>
			<button class="btn btn-primary big" type="button" disabled={!top} onclick={() => decide(1)}>
				<Icon name="star" size={20} />Keep
			</button>
		</div>
	{/if}
</GameShell>

<style>
	.table {
		display: grid;
		flex: 1;
		place-items: start center;
		min-height: 0;
		container-type: size;
	}

	.deck {
		position: relative;
		width: min(100cqw, calc((100cqh - 24px) * 2 / 3));
		aspect-ratio: 2 / 3;
	}

	.card {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: var(--surface);
		border-radius: var(--radius-md);
		box-shadow: 0 16px 44px rgb(0 0 0 / 0.5);
		cursor: grab;
		touch-action: none;
		transform-origin: 50% 90%;
		user-select: none;
		transition: transform 300ms var(--ease);
	}

	.card.dragging {
		cursor: grabbing;
		transition: none;
	}

	/* The first card leans each way once, which shows the gesture without any instructions. */
	.card.teach {
		animation: lean 1500ms var(--ease) 700ms 1;
	}

	@keyframes lean {
		25% {
			transform: translateX(26px) rotate(3deg);
		}
		60% {
			transform: translateX(-26px) rotate(-3deg);
		}
	}

	.card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		pointer-events: none;
	}

	.info {
		position: absolute;
		inset: auto 0 0;
		padding: 64px 18px 16px;
		background: linear-gradient(to top, rgb(10 10 11 / 0.96) 60%, transparent);
		pointer-events: none;
	}

	h2 {
		font-size: clamp(1.25rem, 3vh, 1.625rem);
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 2px 12px;
		margin-top: 4px;
		color: var(--text-muted);
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.rating :global(svg) {
		color: var(--accent);
	}

	.story {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 320ms var(--ease);
	}

	.story.open {
		grid-template-rows: 1fr;
	}

	.story p {
		display: -webkit-box;
		min-height: 0;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 8;
		line-clamp: 8;
		color: rgb(245 245 246 / 0.86);
		font-size: 0.9375rem;
	}

	.story.open p {
		margin-top: 8px;
	}

	.tap {
		margin-top: 4px;
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.stamp {
		position: absolute;
		top: 22px;
		padding: 4px 14px;
		background: rgb(10 10 11 / 0.5);
		border: 3px solid currentColor;
		border-radius: var(--radius-sm);
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		pointer-events: none;
	}

	.keep {
		left: 18px;
		color: var(--success);
		transform: rotate(-12deg);
	}

	.pass {
		right: 18px;
		color: var(--danger);
		transform: rotate(12deg);
	}

	.controls {
		position: relative;
		z-index: 5;
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: min(100%, 460px);
		margin: 4px auto 0;
	}

	.big {
		flex: 1;
		min-height: 54px;
		font-size: 1rem;
	}

	.done {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		gap: clamp(20px, 4vw, 56px);
		min-height: 0;
	}

	.pick {
		flex: none;
		height: min(100%, 680px);
		aspect-ratio: 2 / 3;
		max-width: 46%;
		overflow: hidden;
		border-radius: var(--radius-md);
		box-shadow: 0 20px 60px rgb(0 0 0 / 0.55);
		animation: pop 560ms var(--spring);
	}

	.pick img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.verdict {
		flex: 0 1 460px;
		min-width: 0;
	}

	.eyebrow {
		color: var(--accent);
		font-weight: 500;
	}

	.verdict h2 {
		margin-top: 4px;
		font-size: clamp(1.75rem, 4.4vw, 3.25rem);
		letter-spacing: -0.04em;
		line-height: 1.05;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	.others-head {
		display: flex;
		justify-content: space-between;
		margin-top: 20px;
		color: var(--text-muted);
	}

	.others {
		display: flex;
		gap: 8px;
		margin-top: 8px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.others::-webkit-scrollbar {
		display: none;
	}

	.others li {
		flex: none;
		width: 72px;
	}

	.others img {
		width: 100%;
		aspect-ratio: 2 / 3;
		object-fit: cover;
		background: var(--surface);
		border-radius: var(--radius-sm);
		-webkit-user-drag: none;
	}

	.cta {
		margin-top: 12px;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	/* Portrait: the poster takes whatever height the text leaves over. */
	@media (max-width: 767px), (orientation: portrait) {
		.done {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.pick {
			flex: 1 1 0;
			height: auto;
			max-width: none;
			min-height: 120px;
			aspect-ratio: auto;
			align-self: center;
			width: min(100%, 300px);
		}

		.verdict {
			flex: none;
		}
	}
</style>
