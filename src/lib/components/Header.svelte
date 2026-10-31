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
	let sheet = $state();
	let thumb = $state({ x: 0, width: 0, visible: false });
	let ghost = $state({ x: 0, width: 0, visible: false, moves: false });
	let thumbMoves = $state(false);
	let hidden = $state(false);

	/** The solid pill marks the current page. */
	function placeThumb() {
		const link = nav?.querySelector('[aria-current="page"]');
		thumb = link
			? { x: link.offsetLeft, width: link.offsetWidth, visible: true }
			: { ...thumb, visible: false };
	}

	/** A faint pill glides after the pointer, without ever hiding where you are. */
	function placeGhost(link) {
		ghost = { x: link.offsetLeft, width: link.offsetWidth, visible: true, moves: ghost.visible };
	}

	$effect(() => {
		void page.url.pathname;
		// Runs after the aria-current attributes have been updated.
		queueMicrotask(placeThumb);
		document.fonts?.ready.then(() => {
			placeThumb();
			requestAnimationFrame(() => (thumbMoves = true));
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

	$effect(() => {
		document.documentElement.classList.toggle('header-hidden', hidden);
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

	function closeSheet() {
		if (sheet?.matches(':popover-open')) sheet.hidePopover();
	}

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

<svelte:window onresize={placeThumb} />

<div class="header-root">
	<a class="skip" href="#content">Skip to content</a>
	<header class:hidden>
		<div class="container bar">
			<a class="logo" href="/" aria-label="Filmoteka home">
				<img src={logo} alt="" width="122" height="20" />
			</a>

			<nav
				class="links"
				aria-label="Main"
				bind:this={nav}
				onpointerleave={() => (ghost = { ...ghost, visible: false })}
			>
				<span
					class="ghost"
					class:visible={ghost.visible}
					class:moves={ghost.moves}
					style:width="{ghost.width}px"
					style:transform="translateX({ghost.x}px)"
					aria-hidden="true"
				></span>
				<span
					class="thumb"
					class:visible={thumb.visible}
					class:moves={thumbMoves}
					style:width="{thumb.width}px"
					style:transform="translateX({thumb.x}px)"
					aria-hidden="true"
				></span>
				{#each LINKS as link (link.href)}
					<a
						href={link.href}
						aria-current={isActive(link.href) ? 'page' : undefined}
						onpointerenter={(event) => placeGhost(event.currentTarget)}
					>
						{link.label}
					</a>
				{/each}
			</nav>

			<div class="actions">
				<button class="search-trigger" type="button" onclick={onsearch} aria-label="Search">
					<Icon name="search" size={18} />
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

	<div id="mobile-menu" popover="auto" class="sheet" bind:this={sheet}>
		<div class="sheet-top">
			<a class="logo" href="/" aria-label="Filmoteka home" onclick={closeSheet}>
				<img src={logo} alt="" width="122" height="20" />
			</a>
			<button
				class="icon-btn"
				type="button"
				popovertarget="mobile-menu"
				popovertargetaction="hide"
				aria-label="Close menu"
			>
				<Icon name="close" />
			</button>
		</div>
		<nav aria-label="Mobile">
			{#each LINKS as link, index (link.href)}
				<a
					class="sheet-link"
					href={link.href}
					style:--i={index}
					aria-current={isActive(link.href) ? 'page' : undefined}
					onclick={closeSheet}
				>
					{link.label}
				</a>
			{/each}
		</nav>
		{#if auth.ready && !auth.user}
			<div class="sheet-foot">
				<a class="btn" href="/login" onclick={closeSheet}>Log in</a>
				<a class="btn btn-primary" href="/register" onclick={closeSheet}>Sign up</a>
			</div>
		{/if}
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
		color: var(--bg);
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
		height: var(--header-height);
		pointer-events: none;
		transition: transform 360ms var(--ease);
	}

	/* No bar, just a blur that melts away: the logo and links stay readable over any poster. */
	header::before {
		content: '';
		position: absolute;
		z-index: -1;
		inset: 0 0 -24px;
		background: linear-gradient(to bottom, rgb(8 9 11 / 0.8), rgb(8 9 11 / 0.4) 60%, transparent);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		mask-image: linear-gradient(to bottom, #000 55%, transparent);
		pointer-events: none;
	}

	header.hidden {
		transform: translateY(-100%);
	}

	.header-root {
		display: contents;
	}

	/* Three separate pieces on the page's own grid: the logo and actions line up with the content. */
	.bar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 16px;
		height: 100%;
	}

	.bar > * {
		pointer-events: auto;
	}

	.logo {
		display: block;
		width: fit-content;
		transition: opacity 160ms var(--ease);
	}

	.logo:hover {
		opacity: 0.75;
	}

	.logo img {
		width: auto;
		height: 20px;
	}

	.links,
	.search-trigger,
	.bell {
		background: rgb(22 23 28 / 0.62);
		border: 1px solid var(--line);
		backdrop-filter: blur(20px) saturate(1.5);
		-webkit-backdrop-filter: blur(20px) saturate(1.5);
	}

	.links {
		position: relative;
		display: flex;
		padding: 4px;
		border-radius: 999px;
	}

	.thumb,
	.ghost {
		position: absolute;
		top: 4px;
		bottom: 4px;
		left: 0;
		border-radius: 999px;
		opacity: 0;
		transition: opacity 200ms var(--ease);
	}

	.thumb {
		background: var(--text);
	}

	.ghost {
		background: rgb(255 255 255 / 0.1);
	}

	.thumb.moves,
	.ghost.moves {
		transition:
			transform 420ms var(--spring),
			width 420ms var(--spring),
			opacity 200ms var(--ease);
	}

	.thumb.visible,
	.ghost.visible {
		opacity: 1;
	}

	.links a {
		position: relative;
		display: flex;
		align-items: center;
		height: 36px;
		padding: 0 16px;
		border-radius: 999px;
		color: var(--text-muted);
		font-size: 0.9375rem;
		font-weight: 500;
		transition: color 220ms var(--ease);
	}

	.links a:hover {
		color: var(--text);
	}

	.links a[aria-current='page'] {
		color: var(--bg);
	}

	.actions {
		display: flex;
		align-items: center;
		justify-self: end;
		gap: 6px;
	}

	.search-trigger {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 44px;
		padding: 0 14px;
		border-radius: 999px;
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
		color: var(--on-accent);
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
		transition: transform 320ms var(--spring);
	}

	.account:hover {
		transform: scale(1.06);
	}

	.auth-link {
		min-height: 44px;
		color: var(--text);
	}

	.auth-link.btn-primary {
		color: var(--on-accent);
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

	/* On phones the menu takes over the whole screen, with big links that are easy to hit. */
	.sheet {
		position: fixed;
		inset: 0;
		flex-direction: column;
		width: 100%;
		max-width: none;
		height: 100dvh;
		max-height: none;
		margin: 0;
		padding: 0 var(--gutter) max(24px, env(safe-area-inset-bottom));
		overflow-y: auto;
		background: rgb(8 9 11 / 0.9);
		border: 0;
		color: var(--text);
		backdrop-filter: blur(28px) saturate(1.4);
		-webkit-backdrop-filter: blur(28px) saturate(1.4);
		opacity: 0;
		transition:
			opacity 220ms var(--ease),
			display 220ms allow-discrete,
			overlay 220ms allow-discrete;
	}

	.sheet:popover-open {
		display: flex;
		opacity: 1;
	}

	@starting-style {
		.sheet:popover-open {
			opacity: 0;
		}
	}

	:global(html:has(#mobile-menu:popover-open)) {
		overflow: hidden;
	}

	.sheet-top {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: space-between;
		height: var(--header-height);
	}

	.sheet nav {
		display: grid;
		gap: 4px;
		margin-block: auto;
		padding-block: 24px;
	}

	.sheet-link {
		color: var(--text);
		font-size: clamp(2.25rem, 11vw, 3.5rem);
		font-weight: 600;
		letter-spacing: -0.04em;
		line-height: 1.25;
		transition: color 160ms var(--ease);
	}

	.sheet:popover-open .sheet-link {
		animation: rise 520ms var(--ease) both;
		animation-delay: calc(var(--i) * 45ms);
	}

	.sheet-link[aria-current='page'] {
		color: var(--accent);
	}

	.sheet-foot {
		display: grid;
		flex: none;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 8px;
	}

	@media (max-width: 1023px) {
		.links,
		.auth-link {
			display: none;
		}

		.bar {
			grid-template-columns: minmax(0, 1fr) auto;
		}

		.menu-trigger {
			display: inline-grid;
		}

		.search-key {
			display: none;
		}

		/* Everything on the right shares one small pill. */
		.actions {
			gap: 0;
			padding: 2px;
			background: rgb(22 23 28 / 0.62);
			border: 1px solid var(--line);
			border-radius: 999px;
			backdrop-filter: blur(20px) saturate(1.5);
			-webkit-backdrop-filter: blur(20px) saturate(1.5);
		}

		.search-trigger,
		.bell {
			background: none;
			border: 0;
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}

		.search-trigger {
			justify-content: center;
			width: 44px;
			padding: 0;
		}

		.session-placeholder {
			display: none;
		}
	}

	@media (min-width: 1024px) {
		.sheet {
			display: none !important;
		}
	}
</style>
