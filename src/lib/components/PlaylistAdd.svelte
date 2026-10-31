<script>
	import { plural } from '../format.js';
	import { keyOf } from '../state/playlistLoader.svelte.js';

	/** The two ways in: your own Spotify playlists, or a pasted link. */
	let { spotify, mine, mineError, added, pending, message, note, onadd, onlogout } = $props();

	let link = $state('');

	async function submit(event) {
		event.preventDefault();
		if (!link.trim()) return;
		if (await onadd(link)) link = '';
	}
</script>

{#if spotify.available}
	<section class="way">
		<h3>Your Spotify</h3>
		{#if spotify.loggedIn}
			{#if mine}
				<p class="note">
					Logged in{mine.name ? ` as ${mine.name}` : ''}. Pick one and every song in it loads.
					<button class="link-btn" type="button" onclick={onlogout}>Log out</button>
				</p>
				<ul class="mine">
					{#each mine.playlists as item (item.id)}
						{@const known = added.has(keyOf('spotify', item.id))}
						<li>
							<button
								type="button"
								disabled={known || pending}
								onclick={() => onadd(`spotify:playlist:${item.id}`)}
							>
								{#if item.image}<img src={item.image} alt="" loading="lazy" />{/if}
								<span class="text">
									<span class="name">{item.name}</span>
									<span class="meta">
										{plural(item.total, 'song')}{known
											? ', already added'
											: item.full
												? ''
												: ', first 100 only'}
									</span>
								</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else if mineError}
				<p class="message" role="alert">{mineError}</p>
				<button class="link-btn" type="button" onclick={onlogout}>Log out</button>
			{:else}
				<p class="note">Getting your playlists…</p>
			{/if}
		{:else}
			<p class="note">Log in and pick a playlist you made or help edit. Every song in it loads.</p>
			<a class="btn btn-primary btn-block" href="/api/spotify/login" data-sveltekit-reload>
				Log in with Spotify
			</a>
			<p class="note small">Only accounts approved on this site can log in.</p>
		{/if}
		{#if note}<p class="message" role="alert">{note}</p>{/if}
	</section>
{/if}

<form class="way" onsubmit={submit}>
	<label for="playlist-link"><h3>Paste a link</h3></label>
	<p class="note">
		Deezer: any public playlist, every song. Someone else's Spotify playlist: first 100 songs.
	</p>
	<div class="paste">
		<input
			id="playlist-link"
			class="input"
			type="text"
			inputmode="url"
			placeholder="Spotify or Deezer link"
			autocomplete="off"
			bind:value={link}
		/>
		<button class="btn" type="submit" disabled={pending || !link.trim()}>
			{pending ? 'Adding…' : 'Add'}
		</button>
	</div>
	{#if message}<p class="message" role="alert">{message}</p>{/if}
</form>

<style>
	.way {
		display: grid;
		gap: 8px;
		min-width: 0;
	}

	h3 {
		font-size: 1.125rem;
		letter-spacing: -0.02em;
	}

	.note {
		color: var(--text-muted);
	}

	.small {
		font-size: 0.875rem;
	}

	.message {
		color: var(--danger);
	}

	.link-btn {
		color: var(--text);
		text-decoration: underline;
	}

	.paste {
		display: flex;
		gap: 8px;
	}

	.paste .input {
		flex: 1;
		min-width: 0;
	}

	.mine {
		display: grid;
		gap: 2px;
		max-height: min(300px, 36dvh);
		overflow-y: auto;
	}

	.mine button {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 6px;
		border-radius: var(--radius-sm);
		text-align: left;
		transition: background-color 160ms var(--ease);
	}

	.mine button:hover:not(:disabled) {
		background: var(--surface-raised);
	}

	.mine button:disabled {
		opacity: 0.55;
	}

	.mine img {
		flex: none;
		width: 44px;
		height: 44px;
		object-fit: cover;
		border-radius: var(--radius-sm);
	}

	.text {
		display: grid;
		min-width: 0;
	}

	.name,
	.meta {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
		font-weight: 500;
	}

	.meta {
		color: var(--text-muted);
		font-size: 0.875rem;
	}
</style>
