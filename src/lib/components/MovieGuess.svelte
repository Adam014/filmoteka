<script>
	import { loadFilmSearch } from '../games/filmIndex.js';
	import { resultLabel } from '../search.js';
	import { createSearch } from '../state/search.svelte.js';

	let {
		onpick,
		ontype = undefined,
		placeholder = 'Type a movie title',
		up = false,
		label = 'Guess the movie',
		// Searches a list we already have instead of the catalogue.
		local = undefined,
		empty = 'No movies match that. Try another title.'
	} = $props();

	const search = createSearch({ type: 'movie' });
	let query = $state('');
	let active = $state(0);
	let open = $state(false);

	let films = $state(null);
	let found = $derived(local ? local(query) : (films?.(query) ?? []));
	// Our list comes first. The wider search only adds to it, for films the list doesn't have.
	let results = $derived.by(() => {
		if (local) return found;
		const known = new Set(found.map((film) => film.id));
		return [...found, ...search.state.results.filter((film) => !known.has(film.id))].slice(0, 8);
	});
	let showList = $derived(open && query.trim().length > 0);

	function clear() {
		query = '';
		active = 0;
		open = false;
		search.reset();
	}

	function pick(result) {
		clear();
		onpick(result);
	}

	function oninput() {
		ontype?.();
		active = 0;
		open = true;
		if (local) return;
		widen();
	}

	const ENOUGH = 3;

	function widen() {
		if (query.trim() && found.length < ENOUGH) search.update(query);
		else search.reset();
	}

	async function prepareFilms() {
		if (local || films) return;
		films = await loadFilmSearch();
		widen();
	}

	function onkeydown(event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!results.length) return;
			open = true;
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = (active + step + results.length) % results.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (showList && results[active]) pick(results[active]);
		} else if (event.key === 'Escape') {
			open = false;
		}
	}
</script>

<div class="guess">
	<label class="visually-hidden" for="guess">{label}</label>
	<input
		id="guess"
		class="input"
		type="text"
		{placeholder}
		bind:value={query}
		{oninput}
		{onkeydown}
		onfocus={() => {
			open = true;
			prepareFilms();
		}}
		onblur={() => setTimeout(() => (open = false), 120)}
		role="combobox"
		aria-expanded={showList}
		aria-controls="guess-results"
		aria-activedescendant={showList && results.length ? `guess-option-${active}` : undefined}
		aria-autocomplete="list"
		autocomplete="off"
		spellcheck="false"
	/>
	{#if showList}
		<div class="suggestions" class:up>
			{#if results.length}
				<ul id="guess-results" role="listbox" aria-label="Matches">
					{#each results as result, index (result.id)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<li
							id="guess-option-{index}"
							role="option"
							aria-selected={index === active}
							class:active={index === active}
							style:--i={index}
							onmousedown={(event) => event.preventDefault()}
							onclick={() => pick(result)}
							onmousemove={() => (active = index)}
						>
							<span class="text">
								<span class="name">{result.title}</span>
								<span class="label">{result.label ?? resultLabel(result)}</span>
							</span>
						</li>
					{/each}
				</ul>
			{:else if search.state.loading}
				<p class="note">Searching…</p>
			{:else if search.state.failed}
				<p class="note">Search isn't responding. Please try again.</p>
			{:else}
				<p class="note">{empty}</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.guess {
		position: relative;
	}

	.suggestions {
		position: absolute;
		z-index: 10;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		max-height: min(340px, 52dvh);
		overflow-y: auto;
		padding: 6px;
		background: var(--surface-raised);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		box-shadow: 0 16px 48px rgb(0 0 0 / 0.5);
		animation: pop 200ms var(--spring);
	}

	/* The input sits at the bottom of the game screens, so the list opens above it. */
	.suggestions.up {
		top: auto;
		bottom: calc(100% + 6px);
	}

	li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		animation: rise 280ms var(--ease) both;
		animation-delay: calc(var(--i, 0) * 22ms);
	}

	li.active {
		background: rgb(255 255 255 / 0.08);
	}

	.text {
		display: grid;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.label {
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.note {
		padding: 12px;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}
</style>
