<script>
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import logo from '../assets/Filmoteka_logo.svg';
	import { auth, signOut } from '../state/auth.svelte.js';
	import { unreadCount } from '../state/notifications.svelte.js';
	import { toast } from '../state/toast.svelte.js';
	import { displayName, isGuest, profileHref } from '../user.js';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';
	import NotificationsPanel from './NotificationsPanel.svelte';

	let { onsearch } = $props();

	const LINKS = [
		{ href: '/library', label: 'Library' },
		{ href: '/mood', label: 'Mood' },
		{ href: '/swipe', label: 'Swipe' },
		{ href: '/random', label: 'Random' },
		{ href: '/games', label: 'Games' }
	];

	let shortcut = $state('Ctrl K');
	let name = $derived(displayName(auth.user));
	let guest = $derived(isGuest(auth.user));
	let unread = $derived(unreadCount());

	let nav = $state();
	let indicator = $state({ x: 0, width: 0, visible: false });
	let indicatorMoves = $state(false);
	let hidden = $state(false);

	/** Slides the highlight behind the given link, or back to the current page. */
	function moveIndicator(target) {
		const link = target ?? nav?.querySelector('[aria-current="page"]');
		if (!link) {
			indicator = { ...indicator, visible: false };
			return;
		}
		indicator = { x: link.offsetLeft, width: link.offsetWidth, visible: true };
	}

	$effect(() => {
		void page.url.pathname;
		// Runs after the aria-current attributes have been updated.
		queueMicrotask(() => moveIndicator());
		document.fonts?.ready.then(() => {
			moveIndicator();
			requestAnimationFrame(() => (indicatorMoves = true));
		});
	});

	// The bar steps aside while reading down the page and returns as soon as you scroll up.
	$effect(() => {
		let last = scrollY;
		let frame = 0;
		const onscroll = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const current = scrollY;
				if (Math.abs(current - last) < 6) return;
				const menuOpen = document.querySelector('.header-root [popover]:popover-open');
				hidden = !menuOpen && current > last && current > 240;
				last = current;
			});
		};
		addEventListener('scroll', onscroll, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('scroll', onscroll);
		};
	});

	const isActive = (href) => page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);

	$effect(() => {
		if (/mac|iphone|ipad/i.test(navigator.platform)) shortcut = '⌘K';
	});

	// Pop-overs are light-dismissed by the browser, except on in-app navigation.
	afterNavigate(() => {
		document
			.querySelectorAll('.header-root [popover]')
			.forEach(
				(panel) =>
					panel.matches(':popover-open') && /** @type {HTMLElement} */ (panel).hidePopover()
			);
	});

	async function logOut() {
		const { error } = await signOut();
		if (error) {
			toast.error("We couldn't log you out. Please try again.");
			return;
		}
		toast.success('Logged out');
		await goto('/');
	}
</script>

<svelte:window onresize={() => moveIndicator()} />

<div class="header-root">
	<a class="skip" href="#content">Skip to content</a>
	<header class:hidden>
		<div class="container bar">
			<a class="logo" href="/" aria-label="Filmoteka home">
				<img src={logo} alt="" width="122" height="20" />
			</a>

			<nav class="links" aria-label="Main" bind:this={nav} onpointerleave={() => moveIndicator()}>
				<span
					class="indicator"
					class:visible={indicator.visible}
					class:moves={indicatorMoves}
					style:width="{indicator.width}px"
					style:transform="translateX({indicator.x}px)"
					aria-hidden="true"
				></span>
				{#each LINKS as link (link.href)}
					<a
						href={link.href}
						aria-current={isActive(link.href) ? 'page' : undefined}
						onpointerenter={(event) => moveIndicator(event.currentTarget)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="actions">
				<button class="search-trigger" type="button" onclick={onsearch} aria-label="Search">
					<Icon name="search" size={18} />
					<span class="search-label">Search</span>
					<kbd class="search-key">{shortcut}</kbd>
				</button>

				{#if !auth.ready}
					<span class="session-placeholder" aria-hidden="true"></span>
				{:else if auth.user}
					<button
						class="icon-btn bell"
						type="button"
						popovertarget="notifications-panel"
						aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
					>
						<Icon name="bell" />
						{#if unread}
							<span class="count" aria-hidden="true">{unread > 9 ? '9+' : unread}</span>
						{/if}
					</button>
					<button
						class="account"
						type="button"
						popovertarget="account-menu"
						aria-label="Account menu"
					>
						<Avatar name={name || 'Guest'} src={auth.user.user_metadata?.avatar_url} />
					</button>
				{:else}
					<a class="btn btn-quiet auth-link" href="/login">Log in</a>
					<a class="btn btn-primary auth-link" href="/register">Sign up</a>
				{/if}

				<button
					class="icon-btn menu-trigger"
					type="button"
					popovertarget="mobile-menu"
					aria-label="Menu"
				>
					<Icon name="menu" />
				</button>
			</div>
		</div>
	</header>

	{#if auth.user}
		<NotificationsPanel id="notifications-panel" />

		<div id="account-menu" popover="auto" class="panel menu">
			<p class="who">
				<span class="who-name">{name || 'Guest'}</span>
				{#if !guest}<span class="who-mail">{auth.user.email}</span>{/if}
			</p>
			{#if guest}
				<a class="panel-item" href="/register"><Icon name="user" size={18} />Create an account</a>
			{:else if name}
				<a class="panel-item" href={profileHref(name)}><Icon name="user" size={18} />Profile</a>
			{/if}
			<a class="panel-item" href="/settings/account"><Icon name="settings" size={18} />Settings</a>
			<button class="panel-item" type="button" onclick={logOut}>
				<Icon name="logout" size={18} />Log out
			</button>
		</div>
	{/if}

	<div id="mobile-menu" popover="auto" class="panel mobile">
		<nav aria-label="Mobile">
			{#each LINKS as link (link.href)}
				<a
					class="panel-item"
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}
			{#if auth.ready && !auth.user}
				<a class="panel-item" href="/login">Log in</a>
				<a class="panel-item" href="/register">Sign up</a>
			{/if}
		</nav>
	</div>
</div>

<style>
	.skip {
		position: fixed;
		z-index: 70;
		top: 8px;
		left: 8px;
		padding: 10px 16px;
		background: var(--text);
		color: #0a0a0b;
		border-radius: var(--radius-sm);
		transform: translateY(-200%);
	}

	.skip:focus {
		transform: none;
	}

	header {
		view-transition-name: site-header;
		position: sticky;
		z-index: 40;
		top: 0;
		transition: transform 360ms var(--ease);
		background: rgb(10 10 11 / 0.82);
		border-bottom: 1px solid var(--line);
		backdrop-filter: blur(16px) saturate(1.4);
		-webkit-backdrop-filter: blur(16px) saturate(1.4);
	}

	header.hidden {
		transform: translateY(-100%);
	}

	.header-root {
		display: contents;
	}

	.bar {
		display: flex;
		align-items: center;
		gap: clamp(16px, 3vw, 40px);
		height: var(--header-height);
	}

	.logo {
		flex: none;
	}

	.logo img {
		width: auto;
		height: 18px;
	}

	.links {
		position: relative;
		display: flex;
		gap: 2px;
	}

	.indicator {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		background: rgb(255 255 255 / 0.08);
		border-radius: 999px;
		opacity: 0;
	}

	.indicator.moves {
		transition:
			transform 420ms var(--spring),
			width 420ms var(--spring),
			opacity 200ms var(--ease);
	}

	.indicator.visible {
		opacity: 1;
	}

	.links a {
		position: relative;
		padding: 8px 14px;
		border-radius: 999px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		transition: color 160ms var(--ease);
	}

	.links a:hover,
	.links a[aria-current='page'] {
		color: var(--text);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-left: auto;
	}

	.search-trigger {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 40px;
		padding: 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: 0.9375rem;
		transition:
			border-color 160ms var(--ease),
			color 160ms var(--ease);
	}

	.search-trigger:hover {
		border-color: var(--line-strong);
		color: var(--text);
	}

	.search-label {
		min-width: 88px;
		text-align: left;
	}

	.session-placeholder {
		width: 44px;
		height: 44px;
	}

	.bell {
		position: relative;
	}

	.count {
		position: absolute;
		top: 6px;
		right: 4px;
		min-width: 18px;
		padding: 0 4px;
		background: var(--accent);
		border-radius: 9px;
		color: #000;
		font-size: 14px;
		font-weight: 600;
		line-height: 18px;
		text-align: center;
	}

	.account {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
	}

	.auth-link {
		min-height: 40px;
	}

	.menu-trigger {
		display: none;
	}

	.menu {
		width: 260px;
	}

	.who {
		display: grid;
		gap: 2px;
		padding: 10px 12px 12px;
		margin-bottom: 4px;
		border-bottom: 1px solid var(--line);
	}

	.who-name {
		font-weight: 500;
	}

	.who-mail {
		overflow: hidden;
		color: var(--text-faint);
		font-size: 0.875rem;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mobile {
		width: min(280px, calc(100vw - 2 * var(--gutter)));
	}

	.mobile [aria-current='page'] {
		color: var(--accent);
	}

	@media (max-width: 960px) {
		.links,
		.auth-link {
			display: none;
		}

		.menu-trigger {
			display: inline-grid;
		}

		.search-trigger {
			justify-content: center;
			width: 44px;
			height: 44px;
			padding: 0;
			border: 0;
		}

		.search-label,
		.search-key {
			display: none;
		}
	}
</style>
