<script>
	import MediaCard from '#lib/components/MediaCard.svelte';
	import { initials } from '#lib/format.js';
	import { imageUrl } from '#lib/media.js';

	const INITIAL_CREDITS = 24;
	const LONG_BIOGRAPHY = 700;

	let { data } = $props();

	let person = $derived(data.person);
	let showAllCredits = $state(false);
	let showFullBio = $state(false);
	let credits = $derived(
		showAllCredits ? person.filmography : person.filmography.slice(0, INITIAL_CREDITS)
	);
	let longBio = $derived(person.biography.length > LONG_BIOGRAPHY);
</script>

<svelte:head>
	<title>{person.name} | Filmoteka</title>
	{#if person.biography}
		<meta name="description" content={person.biography.slice(0, 160)} />
	{/if}
</svelte:head>

<div class="container page">
	<div class="head">
		<div class="photo">
			{#if person.profile_path}
				<img
					src={imageUrl(person.profile_path, 'w342')}
					alt="Portrait of {person.name}"
					width="342"
					height="513"
				/>
			{:else}
				<span aria-hidden="true">{initials(person.name)}</span>
			{/if}
		</div>

		<div class="summary">
			<h1 class="page-title">{person.name}</h1>
			<dl class="facts">
				{#if person.department}
					<div>
						<dt>Known for</dt>
						<dd>{person.department}</dd>
					</div>
				{/if}
				{#if person.born}
					<div>
						<dt>Born</dt>
						<dd>{person.born}</dd>
					</div>
				{/if}
				{#if person.died}
					<div>
						<dt>Died</dt>
						<dd>{person.died}</dd>
					</div>
				{/if}
				{#if person.alsoKnownAs.length}
					<div>
						<dt>Also known as</dt>
						<dd>{person.alsoKnownAs.join(', ')}</dd>
					</div>
				{/if}
			</dl>

			{#if person.imdbUrl || person.homepage}
				<p class="links">
					{#if person.imdbUrl}
						<a class="link" href={person.imdbUrl} target="_blank" rel="noopener noreferrer">IMDb</a>
					{/if}
					{#if person.homepage}
						<a class="link" href={person.homepage} target="_blank" rel="noopener noreferrer">
							Official website
						</a>
					{/if}
				</p>
			{/if}

			{#if person.biography}
				<div class="bio" class:clamped={longBio && !showFullBio}>
					<p>{person.biography}</p>
				</div>
				{#if longBio}
					<button class="link more" type="button" onclick={() => (showFullBio = !showFullBio)}>
						{showFullBio ? 'Show less' : 'Read more'}
					</button>
				{/if}
			{/if}
		</div>
	</div>

	<section class="section">
		<div class="section-head">
			<h2 class="section-title">Known for</h2>
		</div>
		{#if person.filmography.length}
			<div class="media-grid">
				{#each credits as media (`${media.type}-${media.id}`)}
					<MediaCard {media} />
				{/each}
			</div>
			{#if person.filmography.length > INITIAL_CREDITS}
				<button class="btn all" type="button" onclick={() => (showAllCredits = !showAllCredits)}>
					{showAllCredits ? 'Show fewer' : `Show all ${person.filmography.length}`}
				</button>
			{/if}
		{:else}
			<p class="none">We don't have any credits for {person.name} yet.</p>
		{/if}
	</section>
</div>

<style>
	.head {
		display: grid;
		grid-template-columns: clamp(160px, 20vw, 280px) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 56px);
	}

	.photo {
		display: grid;
		place-items: center;
		aspect-ratio: 2 / 3;
		align-self: start;
		overflow: hidden;
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text-faint);
		font-size: 2.5rem;
	}

	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.summary {
		min-width: 0;
		max-width: 76ch;
	}

	.facts {
		margin-top: 20px;
	}

	.facts > div {
		display: grid;
		grid-template-columns: minmax(96px, 136px) minmax(0, 1fr);
		gap: 16px;
		padding: 10px 0;
		border-bottom: 1px solid var(--line);
	}

	dt {
		color: var(--text-faint);
	}

	.links {
		display: flex;
		gap: 20px;
		margin-top: 16px;
	}

	.bio {
		margin-top: 24px;
		line-height: 1.65;
		white-space: pre-line;
	}

	.bio.clamped {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 8;
		line-clamp: 8;
	}

	.more {
		margin-top: 10px;
		color: var(--text-muted);
	}

	.all {
		margin-top: 32px;
	}

	.none {
		color: var(--text-muted);
	}

	@media (max-width: 600px) {
		.head {
			grid-template-columns: 1fr;
		}

		.photo {
			width: 160px;
		}
	}
</style>
