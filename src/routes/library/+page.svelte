<script>
	import CountUp from '#lib/components/CountUp.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import Pagination from '#lib/components/Pagination.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.page > 1 ? `Library, page ${data.page}` : 'Library'} | Filmoteka</title>
	<meta name="description" content="Browse every movie in the Filmoteka library." />
</svelte:head>

<div class="container page">
	<div class="head">
		<div>
			<h1 class="page-title">Library</h1>
			{#if data.count}
				<p class="page-lede"><CountUp value={data.count} /> movies</p>
			{/if}
		</div>
		{#if data.movies.length}
			<form method="get" class="sort">
				<label for="sort">Sort by</label>
				<select
					id="sort"
					class="select"
					name="sort"
					value={data.sort}
					onchange={(event) => event.currentTarget.form.requestSubmit()}
				>
					<option value="popular">Most popular</option>
					<option value="newest">Newest</option>
					<option value="title">Title A–Z</option>
				</select>
				<noscript><button class="btn" type="submit">Apply</button></noscript>
			</form>
		{/if}
	</div>

	{#if data.failed}
		<EmptyState title="The library didn't load">
			<p>We couldn't reach the catalogue. This is usually over quickly.</p>
			<a class="btn" href="/library" data-sveltekit-reload>Try again</a>
		</EmptyState>
	{:else if !data.movies.length}
		<EmptyState title="The library is empty">
			<p>No movies have been added yet.</p>
		</EmptyState>
	{:else}
		<div class="media-grid grid">
			{#each data.movies as media, index (media.id)}
				<MediaCard {media} eager={index < 12} />
			{/each}
		</div>
		<Pagination current={data.page} total={data.totalPages} params={{ sort: data.sort }} />
	{/if}
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
	}

	.sort {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}

	.grid {
		margin-top: clamp(24px, 4vw, 40px);
	}
</style>
