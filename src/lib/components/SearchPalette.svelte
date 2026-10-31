<script>
	import { goto } from '$app/navigation';
	import { imageUrl } from '../media.js';
	import { resultHref, resultLabel } from '../search.js';
	import { createSearch } from '../state/search.svelte.js';
	import Icon from './Icon.svelte';

	let { open = $bindable(false) } = $props();

	const search = createSearch();
	let dialog = $state();
	let input = $state();
	let query = $state('');
	let active = $state(0);

	let results = $derived(search.state.results);
	let activeId = $derived(results.length ? `search-option-${active}` : undefined);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			query = '';
			active = 0;
			search.now('');
			input?.focus();
		}
		if (!open && dialog.open) dialog.close();
	});

	function oninput() {
		active = 0;
		search.update(query);
	}

	function choose(result) {
		open = false;
		goto(resultHref(result));
	}

	function onkeydown(event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (!results.length) return;
			const step = event.key === 'ArrowDown' ? 1 : -1;
			active = (active + step + results.length) % results.length;
			document.getElementById(`search-option-${active}`)?.scrollIntoView({ block: 'nearest' });
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (results[active]) choose(results[active]);
		}
	}
</script>

<dialog
	bind:this={dialog}
	aria-label="Search"
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) open = false;
	}}
>
	<div class="search-box">
		<Icon name="search" />
		<input
			bind:this={input}
			bind:value={query}
			{oninput}
			{onkeydown}
			type="text"
			placeholder="Search movies, series and people"
			role="combobox"
			aria-label="Search movies, series and people"
			aria-expanded={results.length > 0}
			aria-controls="search-results"
			aria-activedescendant={activeId}
			aria-autocomplete="list"
			autocomplete="off"
			spellcheck="false"
		/>
		<button class="icon-btn" type="button" aria-label="Close search" onclick={() => (open = false)}>
			<Icon name="close" />
		</button>
	</div>

	<div class="results">
		{#if search.state.failed}
			<p class="note">Search isn't responding. Please try again in a moment.</p>
		{:else if results.length}
			{#if !query.trim()}
				<p class="heading">Trending this week</p>
			{/if}
			<ul id="search-results" role="listbox" aria-label="Results">
				{#each results as result, index (`${result.type}-${result.id}`)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<li
						id="search-option-{index}"
						style:--i={index}
						role="option"
						aria-selected={index === active}
						class:active={index === active}
						onclick={() => choose(result)}
						onmousemove={() => (active = index)}
					>
						<span class="thumb">
							{#if result.image}
								<img src={imageUrl(result.image, 'w92')} alt="" loading="lazy" />
							{/if}
						</span>
						<span class="text">
							<span class="name">{result.title}</span>
							<span class="label">{resultLabel(result)}</span>
						</span>
					</li>
				{/each}
			</ul>
		{:else if search.state.loading}
			<ul aria-hidden="true">
				{#each [1, 2, 3, 4] as item (item)}
					<li class="placeholder">
						<span class="thumb skeleton"></span>
						<span class="text">
							<span class="skeleton line"></span>
							<span class="skeleton line short"></span>
						</span>
					</li>
				{/each}
			</ul>
		{:else if query.trim()}
			<p class="note">
				Nothing found for “{query.trim()}”. Check the spelling or try another title.
			</p>
		{/if}
	</div>
</dialog>

<style>
	dialog {
		width: min(640px, calc(100vw - 32px));
		max-height: min(70dvh, 560px);
		margin: clamp(16px, 12vh, 120px) auto auto;
		padding: 0;
		overflow: hidden;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
	}

	dialog[open] {
		display: flex;
		flex-direction: column;
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.72);
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: none;
		padding: 6px 6px 6px 18px;
		border-bottom: 1px solid var(--line);
		color: var(--text-muted);
	}

	input {
		flex: 1;
		min-width: 0;
		height: 44px;
		background: none;
		border: 0;
		outline: none;
		color: var(--text);
		font-size: 1.0625rem;
	}

	input::placeholder {
		color: var(--text-faint);
	}

	.results {
		flex: 1;
		min-height: 120px;
		overflow-y: auto;
		padding: 6px;
	}

	.heading {
		padding: 8px 12px;
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.note {
		padding: 28px 12px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		text-align: center;
	}

	li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 12px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		animation: rise 300ms var(--ease) both;
		animation-delay: calc(var(--i, 0) * 22ms);
		transition: background-color 120ms var(--ease);
	}

	li.placeholder {
		cursor: default;
	}

	li.active {
		background: rgb(255 255 255 / 0.08);
	}

	.thumb {
		flex: none;
		width: 36px;
		height: 54px;
		overflow: hidden;
		border-radius: 4px;
		background: var(--surface-raised);
	}

	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.text {
		display: grid;
		flex: 1;
		gap: 2px;
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

	.line {
		display: block;
		width: 60%;
		height: 14px;
	}

	.line.short {
		width: 30%;
	}
</style>
