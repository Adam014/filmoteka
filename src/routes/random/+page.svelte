<script>
	import EmptyState from '#lib/components/EmptyState.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';

	const COUNTS = [1, 5, 10, 15, 30];

	let { data } = $props();

	let count = $state(5);
	let genre = $state('');
	let movies = $state([]);
	let status = $state('idle');

	async function pick(event) {
		event.preventDefault();
		status = 'loading';
		try {
			const params = new URLSearchParams({ count: String(count) });
			if (genre) params.set('genre', genre);
			const response = await fetch(`/api/random?${params}`);
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			movies = (await response.json()).movies;
			status = movies.length ? 'done' : 'empty';
		} catch {
			movies = [];
			status = 'failed';
		}
	}
</script>

<svelte:head>
	<title>Random movies | Filmoteka</title>
	<meta name="description" content="Can't decide what to watch? Let Filmoteka pick for you." />
</svelte:head>

<div class="container page">
	<h1 class="page-title">Can't decide?</h1>
	<p class="page-lede">Pick a genre, or leave it open, and we'll choose something for you.</p>

	<form class="controls" onsubmit={pick}>
		<div class="field">
			<label for="genre">Genre</label>
			<select id="genre" class="select" bind:value={genre}>
				<option value="">Any genre</option>
				{#each data.genres as option (option.id)}
					<option value={String(option.id)}>{option.name}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="count">How many</label>
			<select id="count" class="select" bind:value={count}>
				{#each COUNTS as option (option)}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
		<button class="btn btn-primary" type="submit" disabled={status === 'loading'}>
			{status === 'loading' ? 'Choosing…' : movies.length ? 'Pick again' : 'Surprise me'}
		</button>
	</form>

	{#if status === 'failed'}
		<EmptyState title="We couldn't pick anything">
			<p>The catalogue didn't answer. Please try again in a moment.</p>
		</EmptyState>
	{:else if status === 'empty'}
		<EmptyState title="Nothing in that genre yet">
			<p>Try a different genre, or choose “Any genre”.</p>
		</EmptyState>
	{:else if movies.length}
		<div class="media-grid results" class:loading={status === 'loading'}>
			{#each movies as media (media.id)}
				<MediaCard {media} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 16px;
		margin-top: 32px;
	}

	.controls .select {
		min-width: 160px;
	}

	.results {
		margin-top: clamp(32px, 5vw, 56px);
		transition: opacity 160ms var(--ease);
	}

	.results.loading {
		opacity: 0.5;
	}
</style>
