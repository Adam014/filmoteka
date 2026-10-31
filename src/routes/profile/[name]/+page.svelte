<script>
	import { page } from '$app/state';
	import Avatar from '#lib/components/Avatar.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import MediaCard from '#lib/components/MediaCard.svelte';
	import { favoriteFileName } from '#lib/favorites-path.js';
	import { formatDate, plural } from '#lib/format.js';
	import { loginHref } from '#lib/redirects.js';
	import { accessToken, auth } from '#lib/state/auth.svelte.js';
	import { favorites } from '#lib/state/favorites.svelte.js';
	import { toast } from '#lib/state/toast.svelte.js';
	import { supabase } from '#lib/supabase.js';
	import { displayName, profileHref, toPublicUser } from '#lib/user.js';
	import { untrack } from 'svelte';

	let status = $state('loading');
	let profile = $state(null);
	let followers = $state([]);
	let following = $state([]);
	let saved = $state([]);
	let followBusy = $state(false);
	let listOpen = $state(false);
	let listKind = $state('followers');
	let requestId = 0;

	let name = $derived(page.params.name);
	let viewerId = $derived(auth.user?.id ?? null);
	let isOwner = $derived(Boolean(profile && viewerId === profile.id));
	let isFollowing = $derived(followers.some((user) => user.id === viewerId));
	let canFollow = $derived(Boolean(profile && viewerId && !isOwner && displayName(auth.user)));
	let listUsers = $derived(listKind === 'followers' ? followers : following);
	// On your own profile, un-favoriting removes the card straight away.
	let visibleFavorites = $derived(
		isOwner && favorites.loaded
			? saved.filter((media) => favorites.names.includes(favoriteFileName(media)))
			: saved
	);

	async function load(target) {
		const id = ++requestId;
		status = 'loading';
		listOpen = false;
		saved = [];

		try {
			const token = await accessToken();
			if (id !== requestId) return;
			if (!token) {
				status = 'signed-out';
				return;
			}

			const response = await fetch(`/api/profile/${encodeURIComponent(target)}`, {
				headers: { authorization: `Bearer ${token}` }
			});
			if (id !== requestId) return;

			if (response.status === 401) status = 'signed-out';
			else if (response.status === 404) status = 'not-found';
			else if (!response.ok) status = 'failed';
			else {
				const body = await response.json();
				if (id !== requestId) return;
				profile = body.profile;
				followers = body.followers;
				following = body.following;
				saved = body.favorites;
				status = 'ready';
			}
		} catch {
			if (id === requestId) status = 'failed';
		}
	}

	$effect(() => {
		const target = name;
		if (!auth.ready) return;
		// Re-check whenever someone logs in or out on this page.
		viewerId;
		untrack(() => load(target));
	});

	function openList(kind) {
		listKind = kind;
		listOpen = true;
	}

	async function setFollow(targetId, follow) {
		const relation = { follower_id: viewerId, followed_id: targetId };
		return follow
			? supabase.from('follows').insert([relation])
			: supabase.from('follows').delete().match(relation);
	}

	async function toggleFollow() {
		followBusy = true;
		const follow = !isFollowing;
		const { error } = await setFollow(profile.id, follow);
		followBusy = false;
		if (error) {
			console.error('Updating follow failed:', error.message);
			toast.error(
				`We couldn't ${follow ? 'follow' : 'unfollow'} ${profile.name}. Please try again.`
			);
			return;
		}
		followers = follow
			? [...followers, toPublicUser(auth.user)]
			: followers.filter((user) => user.id !== viewerId);
	}

	async function unfollowFromList(user) {
		const { error } = await setFollow(user.id, false);
		if (error) {
			toast.error(`We couldn't unfollow ${user.name}. Please try again.`);
			return;
		}
		following = following.filter((item) => item.id !== user.id);
		toast.success(`Unfollowed ${user.name}`);
	}
</script>

<svelte:head>
	<title>{name} | Filmoteka</title>
</svelte:head>

<div class="container page">
	{#if status === 'loading'}
		<div class="head" aria-busy="true" aria-label="Loading profile">
			<div class="skeleton round"></div>
			<div class="lines">
				<div class="skeleton title-line"></div>
				<div class="skeleton text-line"></div>
			</div>
		</div>
		<div class="media-grid favorites" aria-hidden="true">
			{#each [1, 2, 3, 4, 5, 6] as item (item)}
				<div class="skeleton poster"></div>
			{/each}
		</div>
	{:else if status === 'signed-out'}
		<EmptyState heading="h1" title="Log in to view {name}'s profile">
			<p>Profiles are visible to Filmoteka members and guests.</p>
			<a class="btn btn-primary" href={loginHref(page.url.pathname)}>Log in</a>
		</EmptyState>
	{:else if status === 'not-found'}
		<EmptyState heading="h1" title="No one goes by “{name}”">
			<p>They may have changed their name, or the link may be wrong.</p>
			<a class="btn" href="/">Back to home</a>
		</EmptyState>
	{:else if status === 'failed'}
		<EmptyState heading="h1" title="This profile didn't load">
			<p>Please check your connection and try again.</p>
			<button class="btn" type="button" onclick={() => load(name)}>Try again</button>
		</EmptyState>
	{:else}
		<header class="head">
			<Avatar name={profile.name} src={profile.avatar} size={96} />
			<div class="identity">
				<h1 class="page-title">{profile.name}</h1>
				<p class="stats">
					<button type="button" onclick={() => openList('followers')}>
						<strong>{followers.length}</strong>
						{followers.length === 1 ? 'follower' : 'followers'}
					</button>
					<button type="button" onclick={() => openList('following')}>
						<strong>{following.length}</strong> following
					</button>
				</p>
				{#if !isOwner && profile.lastSeen}
					<p class="seen">Last active {formatDate(profile.lastSeen)}</p>
				{/if}
				{#if isOwner}
					<p class="seen">Member since {formatDate(auth.user.created_at)}</p>
				{/if}
			</div>
			<div class="head-action">
				{#if canFollow}
					<button
						class="btn"
						class:btn-primary={!isFollowing}
						type="button"
						disabled={followBusy}
						aria-pressed={isFollowing}
						onclick={toggleFollow}
					>
						{isFollowing ? 'Following' : 'Follow'}
					</button>
				{:else if isOwner}
					<a class="btn" href="/settings/account">Settings</a>
				{/if}
			</div>
		</header>

		<section class="section">
			<div class="section-head">
				<h2 class="section-title">Favorites</h2>
				{#if visibleFavorites.length}
					<span class="count">{plural(visibleFavorites.length, 'title')}</span>
				{/if}
			</div>
			{#if visibleFavorites.length}
				<div class="media-grid">
					{#each visibleFavorites as media (`${media.type}-${media.id}`)}
						<MediaCard {media} />
					{/each}
				</div>
			{:else if isOwner}
				<div class="none">
					<p>Save movies and series you love and they'll show up here.</p>
					<a class="btn" href="/library">Browse the library</a>
				</div>
			{:else}
				<p class="none">{profile.name} hasn't saved any favorites yet.</p>
			{/if}
		</section>

		<Dialog bind:open={listOpen} title={listKind === 'followers' ? 'Followers' : 'Following'}>
			{#if listUsers.length}
				<ul class="people">
					{#each listUsers as user (user.id)}
						<li>
							<a href={profileHref(user.name)}>
								<Avatar name={user.name} src={user.avatar} size={36} />
								<span>{user.name}</span>
							</a>
							{#if isOwner && listKind === 'following'}
								<button class="btn" type="button" onclick={() => unfollowFromList(user)}>
									Unfollow
								</button>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-list">
					{listKind === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
				</p>
			{/if}
		</Dialog>
	{/if}
</div>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px 24px;
	}

	.identity {
		flex: 1;
		min-width: 200px;
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 20px;
		margin-top: 8px;
	}

	.stats button {
		min-height: 32px;
		color: var(--text-muted);
	}

	.stats button:hover {
		color: var(--text);
	}

	.stats strong {
		color: var(--text);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.seen {
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.count {
		color: var(--text-faint);
		font-size: 0.9375rem;
	}

	.none {
		display: grid;
		justify-items: start;
		gap: 16px;
		color: var(--text-muted);
	}

	.people li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 12px;
	}

	.people a {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 12px;
		min-width: 0;
		min-height: 44px;
	}

	.people a:hover span {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.empty-list {
		padding: 24px 18px;
		color: var(--text-muted);
	}

	.round {
		width: 96px;
		height: 96px;
		border-radius: 50%;
	}

	.lines {
		display: grid;
		gap: 10px;
		flex: 1;
	}

	.title-line {
		width: min(280px, 60%);
		height: 40px;
	}

	.text-line {
		width: min(180px, 40%);
		height: 18px;
	}

	.favorites {
		margin-top: 64px;
	}

	.poster {
		aspect-ratio: 2 / 3;
	}
</style>
