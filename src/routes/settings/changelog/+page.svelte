<script>
	import { formatDate } from '#lib/format.js';

	let { data } = $props();
</script>

<svelte:head>
	<title>Changelog | Filmoteka</title>
</svelte:head>

<section class="content">
	{#if data.commits}
		<ol>
			{#each data.commits as commit (commit.sha)}
				<li>
					<time datetime={commit.date}>{formatDate(commit.date)}</time>
					<div class="entry">
						<a class="title" href={commit.url} target="_blank" rel="noopener noreferrer">
							{commit.title}
						</a>
						{#if commit.body}<p class="body">{commit.body}</p>{/if}
						<p class="meta">{commit.author} · {commit.sha}</p>
					</div>
				</li>
			{/each}
		</ol>
	{:else}
		<h2 class="section-title">The changelog didn't load</h2>
		<p class="copy">
			GitHub isn't answering right now. You can read the
			<a
				class="link"
				href="https://github.com/Adam014/filmoteka/commits"
				target="_blank"
				rel="noopener noreferrer">full history on GitHub</a
			>.
		</p>
	{/if}
</section>

<style>
	.content {
		max-width: 800px;
		margin-top: 16px;
	}

	li {
		display: grid;
		grid-template-columns: 112px minmax(0, 1fr);
		gap: 16px;
		padding: 16px 0;
		border-bottom: 1px solid var(--line);
	}

	time,
	.meta {
		color: var(--text-faint);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}

	time {
		padding-top: 2px;
	}

	.title {
		font-weight: 500;
	}

	.title:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.body {
		margin-top: 6px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		white-space: pre-line;
	}

	.meta {
		margin-top: 4px;
	}

	.section-title {
		margin-top: 16px;
	}

	.copy {
		margin-top: 8px;
		color: var(--text-muted);
	}

	@media (max-width: 600px) {
		li {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
