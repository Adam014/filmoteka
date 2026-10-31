<script>
	import { formatRelative } from '../format.js';
	import {
		markAllRead,
		markRead,
		notifications,
		unreadCount
	} from '../state/notifications.svelte.js';
	import { toast } from '../state/toast.svelte.js';
	import { profileHref } from '../user.js';
	import Avatar from './Avatar.svelte';

	let { id } = $props();

	const followerName = (item) => item.follower?.user_metadata?.display_name || '';

	async function markAll() {
		if (!(await markAllRead())) toast.error("Notifications couldn't be updated.");
	}

	async function read(item) {
		if (!item.read && !(await markRead(item.id)))
			toast.error("That notification couldn't be updated.");
	}
</script>

<div {id} popover="auto" class="panel notifications">
	<header>
		<h2>Notifications</h2>
		{#if unreadCount() > 0}
			<button class="link mark-all" type="button" onclick={markAll}>Mark all as read</button>
		{/if}
	</header>

	{#if notifications.items.length}
		<ul>
			{#each notifications.items as item (item.id)}
				{@const name = followerName(item)}
				<li class:unread={!item.read}>
					{#if name}
						<a class="row" href={profileHref(name)} onclick={() => read(item)}>
							<Avatar {name} src={item.follower?.user_metadata?.avatar_url} size={36} />
							<span class="copy">
								<span>{item.message}</span>
								<time datetime={item.created_at}>{formatRelative(item.created_at)}</time>
							</span>
						</a>
					{:else}
						<button class="row" type="button" onclick={() => read(item)}>
							<span class="copy">
								<span>{item.message}</span>
								<time datetime={item.created_at}>{formatRelative(item.created_at)}</time>
							</span>
						</button>
					{/if}
					{#if !item.read}
						<span class="dot"><span class="visually-hidden">Unread</span></span>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">You're all caught up.</p>
	{/if}
</div>

<style>
	.notifications {
		width: 380px;
		max-height: min(70dvh, 520px);
		overflow-y: auto;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 44px;
		padding: 0 10px;
	}

	h2 {
		font-size: 1rem;
	}

	.mark-all {
		color: var(--text-muted);
		font-size: 0.875rem;
	}

	li {
		position: relative;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 28px 10px 10px;
		border-radius: var(--radius-sm);
		font-size: 0.9375rem;
		text-align: left;
	}

	.row:hover {
		background: rgb(255 255 255 / 0.07);
	}

	.copy {
		display: grid;
		gap: 2px;
		min-width: 0;
	}

	li:not(.unread) .copy > span {
		color: var(--text-muted);
	}

	time {
		color: var(--text-faint);
		font-size: 0.875rem;
	}

	.dot {
		position: absolute;
		top: 50%;
		right: 12px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		transform: translateY(-50%);
	}

	.empty {
		padding: 24px 10px 28px;
		color: var(--text-muted);
		font-size: 0.9375rem;
	}
</style>
