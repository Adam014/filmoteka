<script>
	import { initials } from '../format.js';
	import { imageUrl } from '../media.js';

	let { person } = $props();
	let failed = $state(false);
</script>

<a class="person" href="/person/{person.id}" draggable="false">
	<div class="photo">
		{#if person.profile_path && !failed}
			<img
				src={imageUrl(person.profile_path, 'w185')}
				srcset="{imageUrl(person.profile_path, 'w185')} 185w, {imageUrl(
					person.profile_path,
					'h632'
				)} 421w"
				sizes="180px"
				alt=""
				width="185"
				height="278"
				loading="lazy"
				decoding="async"
				onerror={() => (failed = true)}
			/>
		{:else}
			<span aria-hidden="true">{initials(person.name)}</span>
		{/if}
	</div>
	<h3>{person.name}</h3>
	{#if person.role}
		<p>{person.role}</p>
	{/if}
</a>

<style>
	.person {
		display: block;
		min-width: 0;
	}

	.photo {
		display: grid;
		place-items: center;
		aspect-ratio: 2 / 3;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--surface);
		outline: 1px solid var(--line);
		outline-offset: -1px;
		color: var(--text-faint);
		font-size: 1.5rem;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 700ms var(--ease);
		-webkit-user-drag: none;
		user-select: none;
	}

	.person:hover img {
		transform: scale(1.06);
	}

	h3 {
		margin-top: 10px;
		font-size: 0.9375rem;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.3;
	}

	p {
		display: -webkit-box;
		margin-top: 4px;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		color: var(--text-faint);
		font-size: 0.875rem;
		line-height: 1.35;
	}
</style>
