<script>
	import { page } from '$app/state';

	let notFound = $derived(page.status === 404);
	let title = $derived(notFound ? "We can't find that page" : 'Something went wrong');
	let copy = $derived(
		notFound
			? page.error?.message && page.error.message !== 'Not Found'
				? page.error.message
				: 'The link may be old, or the page may have moved.'
			: "It's on our side, not yours. Please try again in a moment."
	);
</script>

<svelte:head>
	<title>{title} | Filmoteka</title>
</svelte:head>

<div class="container page error">
	<p class="code">{page.status}</p>
	<h1 class="page-title">{title}</h1>
	<p class="page-lede">{copy}</p>
	<div class="actions">
		<a class="btn btn-primary" href="/">Back to home</a>
		{#if notFound}
			<a class="btn" href="/library">Browse the library</a>
		{:else}
			<button class="btn" type="button" onclick={() => location.reload()}>Try again</button>
		{/if}
	</div>
</div>

<style>
	.error {
		padding-block: clamp(64px, 14vh, 160px);
	}

	.code {
		margin-bottom: 12px;
		color: var(--text-faint);
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 28px;
	}
</style>
