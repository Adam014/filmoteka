<script>
	import { goto } from '$app/navigation';
	import { loadMovies } from '../lib/utils';
	import { supabase } from '../lib/db/supabaseClient.js';
	import { onDestroy, onMount } from 'svelte';
	import { user } from '../stores/user.js';
	import logo from '../lib/assets/Filmoteka_logo.svg';
	import Search from './Search.svelte';

	let currentUser;
	let menuOpen = false;
	let subscription; // for realtime channel
	let notificationsLoaded = false; // flag to avoid persisting until after load

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
		const hamburger = document.querySelector('.hamburger input');
		if (hamburger) {
			hamburger.checked = false;
		}
	}

	// Close menu when clicking outside
	function closeMenuOnOutsideClick(event) {
		if (
			menuOpen &&
			!event.target.closest('.sidenav') &&
			!event.target.closest('.hamburger') &&
			!event.target.closest('.mobile-menu-btn')
		) {
			menuOpen = false;
		}
	}

	async function signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) {
			alert('Error signing out: ' + error.message);
		} else {
			goto('/');
			menuOpen = false;
		}
	}

	// --------------- Notifications Logic ----------------
	let showNotificationsModal = false;
	let notifications = [];

	// On mount, load stored notifications from localStorage (only in browser)
	onMount(async () => {
		if (currentUser) {
			const { data, error } = await supabase
				.from('notifications')
				.select('*')
				.eq('user_id', currentUser.id)
				.order('created_at', { ascending: false });

			if (!error) {
				notifications = data || [];
			} else {
				console.error('Error fetching notifications:', error);
			}
		}

		if (typeof document !== 'undefined') {
			document.addEventListener('click', closeMenuOnOutsideClick);
		}

		return () => {
			unsubscribe();
		};
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.removeEventListener('click', closeMenuOnOutsideClick);
		}
		if (subscription) {
			supabase.removeChannel(subscription);
		}
	});

	// Persist notifications to localStorage whenever they change,
	// but only after we have loaded the stored notifications.
	$: if (notificationsLoaded && typeof localStorage !== 'undefined') {
		localStorage.setItem('notifications', JSON.stringify(notifications));
	}

	// Compute unread notifications count
	$: unreadCount = notifications.filter((n) => !n.read).length;

	// Reactive subscription: when currentUser is available and no subscription exists, set it up.
	$: if (currentUser && !subscription) {
		subscription = supabase
			.channel('realtime-notifications')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'notifications' },
				(payload) => {
					if (payload.new.user_id === currentUser.id) {
						notifications = [payload.new, ...notifications];
					}
				}
			)
			.subscribe();
	}

	// Toggle notifications modal
	function toggleNotifications() {
		showNotificationsModal = !showNotificationsModal;
	}

	// Mark a single notification as read
	async function markAsRead(id) {
		const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);

		if (!error) {
			notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
		} else {
			console.error('Error marking notification as read:', error);
		}
	}

	async function markAllAsRead() {
		const { error } = await supabase
			.from('notifications')
			.update({ read: true })
			.eq('user_id', currentUser.id);

		if (!error) {
			notifications = notifications.map((n) => ({ ...n, read: true }));
		} else {
			console.error('Error marking all notifications as read:', error);
		}
	}

	// Helper to format notification time
	function formatTime(dateString) {
		const date = new Date(dateString);
		return date.toLocaleString();
	}

	// Přidám kód pro synchronizaci těla s rozšířenou navigací
	$: if (typeof document !== 'undefined') {
		if (menuOpen) {
			document.body.classList.add('nav-expanded');
		} else {
			document.body.classList.remove('nav-expanded');
		}
	}
	// -----------------------------------------------------
</script>

<!-- Navigační bar vždy fixně vlevo, obsah je odstupňovaný -->
<div class="page-container">
	<!-- Mobilní horní navigace - viditelná pouze na malých obrazovkách -->
	<div class="mobile-topnav">
		<div class="mobile-logo">
			<a href="/">
				<img src={logo} alt="Filmoteka" class="mobile-logo-img" />
			</a>
		</div>

		<div class="mobile-actions">
			{#if currentUser}
				<button class="mobile-btn" on:click={toggleNotifications} title="Notifications">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
						/>
					</svg>
					{#if unreadCount > 0}
						<span class="mobile-badge">{unreadCount}</span>
					{/if}
				</button>
				<a
					href={`/profile/${currentUser.user_metadata.display_name}`}
					class="mobile-btn"
					title="Profile"
				>
					{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
						<img src={currentUser.user_metadata.avatar_url} alt="Profile" class="mobile-avatar" />
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
							/>
						</svg>
					{/if}
				</a>
			{:else}
				<a href="/login" class="mobile-btn" title="Log In">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"
						/>
					</svg>
				</a>
			{/if}

			<button
				class="mobile-menu-btn {menuOpen ? 'expanded' : ''}"
				on:click={toggleMenu}
				aria-label="Menu"
			>
				<span class="mobile-menu-icon" />
			</button>
		</div>
	</div>

	<!-- Boční navigace - na mobilu se vysune z levé strany -->
	<aside class="sidenav {menuOpen ? 'expanded' : ''}">
		<!-- Hamburger pro rozbalení/sbalení -->
		<div class="nav-item hamburger-container">
			<button class="hamburger" on:click={toggleMenu} aria-label="Menu">
				<span class="hamburger-icon" />
			</button>
		</div>

		<!-- Logo -->
		<div class="nav-item logo-container">
			<a href="/">
				<img src={logo} alt="Filmoteka" class="logo" />
			</a>
		</div>

		<!-- Hlavní navigační ikony -->
		<div class="nav-menu">
			<div class="nav-item">
				<a href="/library" title="Library">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"
						/>
					</svg>
					<span class="nav-text">Library</span>
				</a>
			</div>

			<div class="nav-item">
				<a href="/games" title="Games">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z"
						/>
					</svg>
					<span class="nav-text">Games</span>
				</a>
			</div>

			<div class="nav-item">
				<a href="/games/daily" title="Daily Challenge">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"
						/>
					</svg>
					<span class="nav-text">Daily Challenge</span>
				</a>
			</div>

			<div class="nav-item">
				<a href="/random" title="Random Movie">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"
						/>
					</svg>
					<span class="nav-text">Random Movie</span>
				</a>
			</div>

			<div class="nav-item">
				<a href="/settings/account" title="Settings">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
						/>
					</svg>
					<span class="nav-text">Settings</span>
				</a>
			</div>
		</div>

		<!-- Vyhledávání (viditelné při rozbalení) -->
		<div class="search-container">
			<Search placeholder="Search movies or people..." />
		</div>

		<!-- Spodní část navigace -->
		<div class="nav-footer">
			{#if currentUser}
				<div
					class="nav-item notifications-icon"
					on:click={toggleNotifications}
					title="Notifications"
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
						/>
					</svg>
					{#if unreadCount > 0}
						<span class="badge">{unreadCount}</span>
					{/if}
				</div>

				<div class="nav-item profile">
					<a href={`/profile/${currentUser.user_metadata.display_name}`} title="Profile">
						{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
							<img src={currentUser.user_metadata.avatar_url} alt="Profile" class="avatar" />
						{:else}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
								/>
							</svg>
						{/if}
						<span class="nav-text">{currentUser.user_metadata.display_name}</span>
					</a>
				</div>

				<div class="nav-item logout-btn" on:click={signOut} title="Log Out">
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
						/>
					</svg>
					<span class="nav-text">Log Out</span>
				</div>
			{:else}
				<div class="nav-item login">
					<a href="/login" title="Log In">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"
							/>
						</svg>
						<span class="nav-text">Log In</span>
					</a>
				</div>

				<div class="nav-item register">
					<a href="/register" title="Register">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
							/>
						</svg>
						<span class="nav-text">Register</span>
					</a>
				</div>
			{/if}
		</div>
	</aside>

	<!-- Překrytí při otevřeném menu na mobilních zařízeních -->
	{#if menuOpen}
		<div class="overlay" on:click={closeMenu} />
	{/if}

	<!-- Modální okno notifikací -->
	{#if showNotificationsModal}
		<div class="notification-overlay" on:click={() => (showNotificationsModal = false)}>
			<div class="notifications-modal" on:click|stopPropagation>
				<div class="arrow" />
				<div class="notifications-header">
					<h3>Notifications</h3>
					<button class="mark-all" on:click={markAllAsRead}>Mark all as read</button>
				</div>

				{#if notifications.length > 0}
					<ul class="notifications-list">
						{#each notifications as notif (notif.id)}
							<li class="notification-item">
								<a
									class="notification-link"
									href={notif.type === 'global'
										? '#'
										: `/profile/${notif.follower?.user_metadata?.display_name}`}
								>
									{#if notif.type !== 'global'}
										{#if notif.follower?.user_metadata?.avatar_url}
											<img
												src={notif.follower.user_metadata.avatar_url}
												alt="Avatar"
												class="notification-avatar"
											/>
										{:else}
											<span class="notification-placeholder">👤</span>
										{/if}
									{/if}
									<div class="notification-info">
										<span class="notification-text">{notif.message}</span>
										<span class="notification-time">{formatTime(notif.created_at)}</span>
									</div>
								</a>
								{#if !notif.read}
									<button class="mark-btn" on:click={() => markAsRead(notif.id)}
										>Mark as read</button
									>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="notification-empty">No notifications</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	/* === ZÁKLADNÍ NASTAVENÍ === */
	:global(body) {
		margin: 0;
		padding: 0;
		overflow-x: hidden; /* Zabránit horizontálnímu scrollování */
	}

	:global(.app-content) {
		margin-left: 70px; /* Výchozí stav - stejná šířka jako navigační panel */
		width: calc(100% - 70px); /* Obsah zabírá zbytek šířky */
		transition: all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1); /* Plynulý přechod */
		box-sizing: border-box;
	}

	:global(body.nav-expanded .app-content) {
		margin-left: 240px; /* Rozšířený stav */
		width: calc(100% - 240px);
	}

	:global(main),
	:global(.main-content) {
		width: 100%;
		box-sizing: border-box;
	}

	/* === NAVIGAČNÍ PANEL === */
	.sidenav {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: 70px;
		background: linear-gradient(180deg, #0f1025 0%, #161e3c 100%); /* Tmavší, luxusnější gradient */
		display: flex;
		flex-direction: column;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Vylepšená animace */
		z-index: 1000;
		overflow: hidden;
		box-shadow: 2px 0 20px rgba(0, 0, 0, 0.25); /* Jemnější stín */
		border-right: 1px solid rgba(255, 255, 255, 0.05);
	}

	.sidenav.expanded {
		width: 240px;
	}

	/* Hamburger tlačítko */
	.hamburger-container {
		margin: 18px 0 20px; /* Více prostoru kolem */
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.hamburger {
		background: transparent; /* Bez pozadí */
		border: none;
		width: 42px;
		height: 42px;
		cursor: pointer;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px; /* Zachovat zaoblené rohy */
		transition: all 0.3s ease;
	}

	.hamburger:hover {
		transform: scale(1.1); /* Mírné zvětšení místo změny pozadí */
	}

	.hamburger:active {
		transform: scale(0.95); /* Zmenšení při kliknutí */
	}

	.hamburger-icon,
	.hamburger-icon:before,
	.hamburger-icon:after {
		width: 24px;
		height: 2px;
		background-color: #dcdcf0; /* Světlejší barva čárek */
		position: absolute;
		transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55); /* Pružnější animace */
		border-radius: 4px; /* Zaoblené konce */
	}

	.hamburger-icon:before,
	.hamburger-icon:after {
		content: '';
	}

	.hamburger-icon:before {
		top: -8px;
		width: 16px; /* Kratší horní čára */
		left: 4px; /* Vycentrování */
		opacity: 0.9;
	}

	.hamburger-icon:after {
		top: 8px;
		width: 16px; /* Stejná délka spodní čáry */
		left: 4px; /* Vycentrování */
		opacity: 0.9;
	}

	.expanded .hamburger-icon {
		background: transparent;
	}

	.expanded .hamburger-icon:before {
		transform: rotate(45deg) translate(5px, 5px);
		width: 24px; /* Plná šířka */
		opacity: 1;
		left: 0;
	}

	.expanded .hamburger-icon:after {
		transform: rotate(-45deg) translate(5px, -5px);
		width: 24px; /* Plná šířka */
		opacity: 1;
		left: 0;
	}

	/* Logo */
	.logo-container {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 5px 0 20px;
		position: relative;
		width: 100%;
	}

	.logo {
		width: 42px;
		max-height: 42px;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.4));
		opacity: 0.9;
	}

	.expanded .logo {
		width: 120px;
		opacity: 1;
	}

	.logo:hover {
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
		opacity: 1;
	}

	/* Navigační položky */
	.nav-item {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 13px 0; /* Odstranit horizontální padding v minimalizovaném stavu */
		cursor: pointer;
		position: relative;
		transition: all 0.2s ease;
		border-radius: 0;
		margin: 3px 0; /* Odstranit odsazení v minimalizovaném stavu */
		width: 100%; /* Plná šířka pro lepší vycentrování */
	}

	.expanded .nav-item {
		justify-content: flex-start;
		padding: 13px 20px; /* Vrátit padding v rozšířeném stavu */
		border-radius: 0 8px 8px 0;
		margin: 3px 10px 3px 0; /* Vrátit odsazení v rozšířeném stavu */
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.nav-item:active {
		background: rgba(255, 255, 255, 0.12);
	}

	.nav-item a,
	.nav-item svg {
		color: #b0b0d0;
		text-decoration: none;
		display: flex;
		align-items: center;
		transition: all 0.3s ease;
		width: 100%;
		justify-content: center; /* Vycentrování v minimalizovaném stavu */
	}

	.expanded .nav-item a,
	.expanded .nav-item svg {
		justify-content: flex-start; /* Zarovnat vlevo v rozšířeném stavu */
	}

	.nav-item:hover a,
	.nav-item:hover svg {
		color: #ffffff;
		transform: translateX(0); /* Žádné posunutí v minimalizovaném stavu */
	}

	.expanded .nav-item:hover a,
	.expanded .nav-item:hover svg {
		transform: translateX(2px); /* Posunutí jen v rozšířeném stavu */
	}

	.nav-item svg {
		width: 24px;
		height: 24px;
		min-width: 24px;
		filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.3));
	}

	.nav-text {
		margin-left: 16px;
		font-size: 14px;
		white-space: nowrap;
		opacity: 0;
		transform: translateX(5px);
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		font-weight: 500;
		letter-spacing: 0.3px;
		display: none; /* Skrýt v minimalizovaném stavu */
	}

	.expanded .nav-text {
		opacity: 1;
		transform: translateX(0);
		display: block; /* Zobrazit v rozšířeném stavu */
	}

	/* Hlavní navigace */
	.nav-menu {
		margin-top: 15px;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 7px;
		width: 100%; /* Plná šířka pro lepší vycentrování */
	}

	/* Aktivní položka */
	.nav-item.active {
		background: linear-gradient(90deg, rgba(138, 43, 226, 0.25) 0%, rgba(138, 43, 226, 0.1) 100%);
		border-left: 3px solid #a660d4;
		padding-left: 0; /* Přizpůsobit padding v minimalizovaném stavu */
	}

	.expanded .nav-item.active {
		padding-left: 17px; /* Vrátit padding v rozšířeném stavu */
	}

	.nav-item.active a,
	.nav-item.active svg {
		color: #ffffff;
	}

	/* Vyhledávání */
	.search-container {
		padding: 0 15px;
		margin: 20px 0;
		width: 100%;
		height: 0;
		overflow: hidden;
		opacity: 0;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.expanded .search-container {
		height: 40px;
		opacity: 1;
	}

	/* Patička navigace */
	.nav-footer {
		margin-top: auto;
		padding: 20px 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		background: linear-gradient(
			0deg,
			rgba(10, 10, 25, 0.6) 0%,
			transparent 100%
		); /* Gradient pozadí patičky */
		width: 100%; /* Plná šířka pro lepší vycentrování */
	}

	/* Notifikace */
	.notifications-icon {
		position: relative;
	}

	.badge {
		position: absolute;
		top: 3px;
		right: 8px;
		background: linear-gradient(135deg, #ff4757 0%, #e0115f 100%);
		color: white;
		border-radius: 10px;
		min-width: 18px;
		height: 18px;
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
		transform: scale(1);
		transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* Pružný efekt */
	}

	.badge:hover {
		transform: scale(1.15);
	}

	.expanded .badge {
		right: auto;
		left: 30px;
	}

	/* Profilový obrázek */
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
		transition: all 0.3s ease;
	}

	.avatar:hover {
		border-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.05);
	}

	/* === NOTIFIKAČNÍ MODÁLNÍ OKNO === */
	.notification-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(4px);
		z-index: 1002;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.notifications-modal {
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 14px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1);
		padding: 20px;
		width: 350px;
		z-index: 1003;
		max-height: 80vh;
		overflow-y: auto;
		animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-25px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.arrow {
		position: absolute;
		top: -10px;
		right: 20px;
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-bottom: 10px solid rgba(255, 255, 255, 0.98);
		filter: drop-shadow(0 -3px 3px rgba(0, 0, 0, 0.1));
	}

	.notifications-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 18px;
		padding-bottom: 15px;
		border-bottom: 1px solid rgba(0, 0, 0, 0.07);
	}

	.notifications-header h3 {
		margin: 0;
		font-size: 17px;
		color: #303030;
		font-weight: 600;
	}

	.mark-all {
		background: none;
		border: none;
		color: #a05cd5;
		font-size: 12px;
		cursor: pointer;
		padding: 5px 10px;
		border-radius: 5px;
		transition: all 0.2s ease;
	}

	.mark-all:hover {
		background: rgba(160, 92, 213, 0.1);
		transform: translateY(-1px);
	}

	.mark-all:active {
		transform: translateY(0);
	}

	.notifications-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.notification-item {
		display: flex;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		transition: all 0.2s ease;
	}

	.notification-item:hover {
		background: rgba(0, 0, 0, 0.02);
		transform: translateX(2px);
	}

	.notification-item:last-child {
		border-bottom: none;
	}

	.notification-link {
		display: flex;
		align-items: center;
		text-decoration: none;
		color: inherit;
		flex-grow: 1;
	}

	.notification-avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		object-fit: cover;
		margin-right: 14px;
		border: 2px solid #f0f0f0;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.notification-placeholder {
		font-size: 24px;
		margin-right: 14px;
	}

	.notification-info {
		display: flex;
		flex-direction: column;
	}

	.notification-text {
		font-size: 14px;
		color: #333;
		line-height: 1.4;
	}

	.notification-time {
		font-size: 12px;
		color: #777;
		margin-top: 4px;
	}

	.mark-btn {
		background: none;
		border: none;
		color: #a05cd5;
		font-size: 12px;
		cursor: pointer;
		margin-left: 10px;
		padding: 3px 8px;
		border-radius: 5px;
		transition: all 0.2s ease;
	}

	.mark-btn:hover {
		background: rgba(160, 92, 213, 0.1);
		transform: translateY(-1px);
	}

	.mark-btn:active {
		transform: translateY(0);
	}

	.notification-empty {
		text-align: center;
		color: #777;
		font-size: 14px;
		padding: 35px 0;
		font-style: italic;
	}

	/* Překrytí při otevřeném menu na mobilních zařízeních */
	.overlay {
		display: none;
		animation: fadeIn 0.3s ease;
	}

	/* === MOBILNÍ HORNÍ NAVIGACE === */
	.mobile-topnav {
		display: none; /* Skrýt ve výchozím stavu */
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 60px;
		background: linear-gradient(90deg, #0f1025 0%, #161e3c 100%);
		box-shadow: 0 2px 15px rgba(0, 0, 0, 0.25);
		z-index: 1001;
		padding: 0 15px;
		justify-content: space-between;
		align-items: center;
	}

	.mobile-logo {
		display: flex;
		align-items: center;
	}

	.mobile-logo-img {
		height: 30px;
		max-width: 160px;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
	}

	.mobile-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.mobile-btn {
		background: transparent;
		border: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #dcdcf0;
		position: relative;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.mobile-btn:hover,
	.mobile-btn:active {
		background-color: rgba(255, 255, 255, 0.1);
		transform: translateY(-2px);
	}

	.mobile-btn svg {
		width: 24px;
		height: 24px;
		filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.3));
	}

	.mobile-badge {
		position: absolute;
		top: 0;
		right: 0;
		background: linear-gradient(135deg, #ff4757 0%, #e0115f 100%);
		color: white;
		border-radius: 10px;
		min-width: 18px;
		height: 18px;
		font-size: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
	}

	.mobile-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.15);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
	}

	.mobile-menu-btn {
		background: transparent;
		border: none;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		position: relative;
	}

	.mobile-menu-icon,
	.mobile-menu-icon:before,
	.mobile-menu-icon:after {
		width: 24px;
		height: 2px;
		background-color: #dcdcf0;
		position: absolute;
		border-radius: 4px;
		transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
	}

	.mobile-menu-icon:before,
	.mobile-menu-icon:after {
		content: '';
	}

	.mobile-menu-icon:before {
		top: -8px;
	}

	.mobile-menu-icon:after {
		top: 8px;
	}

	/* Animace pro otevřený stav */
	.mobile-menu-btn.expanded .mobile-menu-icon {
		background: transparent;
	}

	.mobile-menu-btn.expanded .mobile-menu-icon:before {
		transform: rotate(45deg) translate(5px, 5px);
	}

	.mobile-menu-btn.expanded .mobile-menu-icon:after {
		transform: rotate(-45deg) translate(5px, -5px);
	}

	/* Responzivní design */
	@media (max-width: 768px) {
		:global(body) {
			padding-top: 60px; /* Prostor pro horní navigaci */
		}

		:global(.app-content) {
			margin-left: 0; /* Bez odsazení na mobilu */
			width: 100%; /* Plná šířka */
			margin-top: 60px; /* Lepší odsazení obsahu od horní navigační lišty */
			padding-top: 0; /* Zrušíme padding-top, protože používáme margin-top */
		}

		:global(body.nav-expanded .app-content) {
			margin-left: 0; /* Žádné odsazení ani při rozbalenén menu */
			width: 100%;
		}

		:global(main),
		:global(.main-content) {
			padding: 15px; /* Menší padding na mobilu */
		}

		/* Zajistit, že mobilní navigace je pevně nahoře */
		.mobile-topnav {
			display: flex; /* Zobrazit na mobilu */
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			z-index: 1001;
		}

		.hamburger-container {
			display: none; /* Skrýt hamburger v bočním menu */
		}

		.logo-container {
			display: none; /* Skrýt logo v bočním menu na mobilu */
		}

		.search-container {
			display: none; /* Skrýt vyhledávání v mobilním menu */
		}

		.overlay {
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.6);
			backdrop-filter: blur(3px);
			z-index: 999;
		}

		.sidenav {
			transform: translateX(-100%);
			width: 240px;
			box-shadow: 5px 0 25px rgba(0, 0, 0, 0.3);
			top: 60px; /* Posunout pod horní lištu */
			height: calc(100vh - 60px); /* Snížit výšku o výšku horní lišty */
			transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		}

		.sidenav.expanded {
			transform: translateX(0);
			overflow-y: auto; /* Povolit scrollování při větším obsahu */
		}

		/* Zajistit, že obsah stránky je posunut doprava při otevřeném menu */
		:global(body.nav-expanded .app-content) {
			margin-left: 0; /* Nepřidávat margin při otevřeném menu na mobilu */
		}

		.notifications-modal {
			top: 70px; /* Posunout pod horní lištu */
			width: calc(100% - 40px);
			max-width: 350px;
		}
	}

	/* Malé obrazovky (< 992px) - tablet */
	@media (min-width: 769px) and (max-width: 991px) {
		.sidenav {
			width: 60px;
		}

		:global(.app-content) {
			margin-left: 60px;
			width: calc(100% - 60px);
		}

		.nav-item svg {
			width: 22px;
			height: 22px;
		}
	}

	/* Extra velké obrazovky (> 1400px) */
	@media (min-width: 1400px) {
		.sidenav {
			width: 80px;
		}

		:global(.app-content) {
			margin-left: 80px;
			width: calc(100% - 80px);
		}

		:global(body.nav-expanded .app-content) {
			margin-left: 260px;
			width: calc(100% - 260px);
		}

		.sidenav.expanded {
			width: 260px;
		}

		.nav-item svg {
			width: 26px;
			height: 26px;
		}

		.logo {
			width: 48px;
			max-height: 48px;
		}

		.expanded .logo {
			width: 140px;
		}
	}
</style>
