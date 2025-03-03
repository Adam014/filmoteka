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
		const hamburger = document.querySelector('.hamburger input');
		if (menuOpen && !event.target.closest('.nav-menu') && !event.target.closest('.hamburger')) {
			menuOpen = false;
			if (hamburger) {
				hamburger.checked = false;
			}
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
	// -----------------------------------------------------
</script>

<nav class="navbar-container {currentUser ? 'logged-in' : 'logged-out'}">
	<label class="hamburger">
		<input type="checkbox" on:click={toggleMenu} />
		<svg viewBox="0 0 36 36">
			<path
				class="line line-top-bottom"
				d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
			/>
			<path class="line" d="M7 16 27 16" />
		</svg>
	</label>

	<div class="header-container">
		<a href="/">
			<img src={logo} alt="logo" class="logo" />
		</a>
	</div>

	<div class="search-container">
		<Search placeholder="Search for a movie or person..." />
	</div>

	<div class="nav-links">
		{#if currentUser}
			<!-- Notifications Bell Icon (placed to the left of the profile icon) -->
			<div class="notifications-container" on:click={toggleNotifications}>
				<img
					src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAABc0lEQVR4nO3ZP0oDQRSA8RdFQStF64jp9AZpgwiCinVsRPEOKRS2EPuUdnoFUSxErAQLDxE9gX8KRZBPRlOIJpus2XmzE94PBgKThHxMZjdMRIwxQQAlYBu4bA/3uCSxAfb5a09iAowCLx1Cnt2cxAIo011ZYgFUU0KqUmTACLAJ3NKbe069cJsfWATuyM69ZkGKANjosrH75S4A66EjloA3BvcOrISKqAy4Er+595oPcde+Jn9X2iHL+FPTDDnzGHKqFTGZ0wbv5hWY0LpS+VbTCNlVCNnRCGkohDQ0QhKFkMRC+mUrkk0ivtmKZJPYivTLvlrZJOLbMK1Ipf3D0eeoeA8xJkfu3AloAkfKowms5RXhjjZDq+cRchK6AjjOI2RrKFbkx/lulj3SSvlQrYx7ZFVCAMaBp5SQR2BMio7vO38vume8/wFMAx8pEW5uSmIAXKSEnEssgDngoUPEfVR/hjrALHAI3LTHATDzNWmMEW2fnD0mYsu13JQAAAAASUVORK5CYII="
					alt="bell"
				/>
				{#if unreadCount > 0}
					<span class="badge">{unreadCount}</span>
				{/if}
			</div>

			<!-- Profile Icon -->
			<div class="profile-container">
				<a href={`/profile/${currentUser.user_metadata.display_name}`}>
					{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
						<img
							src={currentUser.user_metadata.avatar_url}
							alt="Profile Picture"
							class="profile-picture"
						/>
					{:else}
						<span class="placeholder-icon">👤</span>
					{/if}
				</a>
			</div>
		{:else}
			<div class="signup-container">
				<a href="/register" class="signup-link">Sign up</a>
			</div>
		{/if}
	</div>

	<div class="nav-menu" style="transform: translateX({menuOpen ? '0%' : '-100%'});">
		{#if currentUser}
			<div class="nav-items">
				<div class="left-nav-menu-items">
					<h2>Movieground</h2>
					<a href="/games" on:click={closeMenu}>Games</a>
					<hr />
					<a href="/games/daily" on:click={closeMenu}>Daily Challenge</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Explore</h2>
					<a href="/library" on:click={closeMenu}>Library</a>
					<hr />
					<a href={`/profile/${currentUser.user_metadata.display_name}`} on:click={closeMenu}
						>Profile</a
					>
					<hr />
					<a href="/random" on:click={closeMenu}>Random-Movie</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Settings</h2>
					<a href="/settings/changelog" on:click={closeMenu}>Changelog</a>
					<hr />
					<a href="/settings/account" on:click={closeMenu}>Account</a>
				</div>
			</div>
			<div class="logout-container">
				<div class="profile-logout-container">
					<a href={`/profile/${currentUser.user_metadata.display_name}`} on:click={closeMenu}>
						{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
							<img
								src={currentUser.user_metadata.avatar_url}
								alt="Profile Picture"
								class="profile-picture"
							/>
						{:else}
							<span class="placeholder-icon">👤</span>
						{/if}
					</a>
				</div>
				<button class="Btn" on:click={signOut} on:click={closeMenu}>
					<div class="sign">
						<svg viewBox="0 0 512 512">
							<path
								d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"
							/>
						</svg>
					</div>
				</button>
			</div>
		{:else}
			<div class="nav-items">
				<div class="left-nav-menu-items">
					<h2>Movieground</h2>
					<a href="/games" on:click={closeMenu}>Games</a>
					<hr />
					<a href="/games/daily" on:click={closeMenu}>Daily Challenge</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Explore</h2>
					<a href="/library" on:click={closeMenu}>Library</a>
					<hr />
					<a href="/random" on:click={closeMenu}>Random-Movie</a>
					<hr />
					<a href="/login" on:click={closeMenu}>Login</a>
					<hr />
					<a href="/register" on:click={closeMenu}>Register</a>
				</div>
				<div class="center-nav-menu-items">
					<h2>Settings</h2>
					<a href="/settings/changelog" on:click={closeMenu}>Changelog</a>
					<hr />
					<a href="/settings/account" on:click={closeMenu}>Account</a>
				</div>
			</div>
		{/if}
	</div>

	{#if showNotificationsModal}
		<div class="notification-overlay" on:click={() => (showNotificationsModal = false)}>
			<div class="notifications-modal" on:click|stopPropagation>
				<div class="arrow" />
				<div class="notifications-header">
					<h3>Notifications</h3>
					<button class="mark-all" on:click={markAllAsRead}>Mark all as read</button>
				</div>
				{#if notifications.length > 0}
					<ul>
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
					<p class="notification-empty">Nothing here</p>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap');

	nav {
		z-index: 999;
	}

	h2 {
		padding-bottom: 0.5rem;
	}

	.nav-items {
		display: flex;
		width: 100%;
		position: absolute;
		top: 20%;
	}

	.signup-container {
		padding-left: 30px;
	}

	.nav-items div {
		padding-left: 100px;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* Notifications Styles */
	.notifications-container {
		position: relative;
		cursor: pointer;
		padding: 0 0 0 20px;
	}
	.notifications-container img {
		height: 2rem;
	}
	.badge {
		position: absolute;
		top: -5px;
		right: -5px;
		background-color: red;
		color: white;
		border-radius: 50%;
		padding: 2px 6px;
		font-size: 0.75rem;
	}
	/* Overlay that covers the entire viewport */
	.notification-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: transparent;
		z-index: 1000;
	}
	/* Modal that pops up from the bell */
	.notifications-modal {
		position: fixed;
		top: 7rem; /* adjust as needed to align with the bell */
		right: 5.8rem; /* adjust to align with the bell */
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(10px);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 1rem;
		width: 300px;
	}
	/* Arrow above the modal */
	.arrow {
		position: absolute;
		top: -10px;
		right: 20px;
		width: 0;
		height: 0;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-bottom: 10px solid rgba(255, 255, 255, 0.9);
	}
	.notifications-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	.notifications-header h3 {
		margin: 0;
		font-size: 1.1rem;
		color: #333;
	}
	.mark-all {
		background: none;
		border: none;
		color: #007bff;
		font-size: 0.9rem;
		cursor: pointer;
	}
	.notification-item {
		display: flex;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
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
		width: 32px;
		height: 32px;
		border-radius: 50%;
		object-fit: cover;
		margin-right: 1rem;
	}
	.notification-placeholder {
		font-size: 1.5rem;
		padding-right: 2rem;
	}
	.notification-info {
		display: flex;
		flex-direction: column;
	}
	.notification-text {
		font-size: 0.9rem;
		color: #333;
	}
	.notification-time {
		font-size: 0.75rem;
		color: #666;
	}
	.mark-btn {
		background: none;
		border: none;
		color: #007bff;
		font-size: 0.8rem;
		cursor: pointer;
		margin-left: 0.5rem;
	}
	.notification-empty {
		text-align: center;
		color: #666;
		font-size: 0.9rem;
	}

	.profile-container {
		margin-left: auto;
	}

	@media (max-width: 965px) {
		.nav-items {
			display: grid;
			justify-content: center;
		}
		.nav-items div {
			padding-left: 0;
			padding-bottom: 50px;
		}
	}

	@media (max-width: 768px) {
		.signup-container {
			padding-left: 0;
		}

		.nav-links {
			align-items: center;
		}

		.search-container {
			position: absolute;
			top: 12%;
			width: 100%;
		}
	}

	.navbar-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
	}

	.header-container {
		flex-grow: 1;
		display: flex;
		justify-content: center;
	}

	.logo {
		width: 30rem;
		max-width: 30rem;
	}

	.hamburger {
		cursor: pointer;
		height: 50px !important;
		width: 50px !important;
		z-index: 999;
		padding-left: 20px;
	}

	.hamburger input {
		display: none;
	}

	.hamburger svg {
		height: 4em;
		transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.line {
		fill: none;
		stroke: white;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 3;
		transition: stroke-dasharray 600ms cubic-bezier(0.4, 0, 0.2, 1),
			stroke-dashoffset 600ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.line-top-bottom {
		stroke-dasharray: 12 63;
	}

	.hamburger input:checked + svg {
		transform: rotate(-45deg);
	}

	.hamburger input:checked + svg .line-top-bottom {
		stroke-dasharray: 20 300;
		stroke-dashoffset: -32.42;
	}

	.nav-menu {
		position: fixed;
		top: 0;
		left: 0%;
		height: 100%;
		width: 100%;
		opacity: 1;
		background-color: #333;
		box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		justify-content: center;
		transition: transform 0.3s ease-in-out;
		z-index: 998;
	}

	.nav-menu a {
		font-size: 3rem;
	}

	.nav-menu a:hover {
		text-decoration: underline;
		color: #a05cd5;
	}

	a,
	button {
		color: white;
		text-decoration: none;
		margin: 10px;
	}

	.hamburger {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		width: 30px;
		height: 25px;
		cursor: pointer;
	}

	a {
		text-decoration: none;
		color: white;
		font-size: 1.2rem;
	}

	/* logout button */
	.logout-container {
		position: absolute;
		bottom: 1%;
		right: 0;
		display: flex;
		align-items: center;
	}

	.logout-container .profile-picture {
		width: 40px;
		height: 40px;
	}

	.logout-container a {
		font-size: 0;
	}

	ul {
		padding: 0;
	}

	.Btn {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		width: 45px;
		height: 45px;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		transition-duration: 0.3s;
		background-color: transparent;
	}

	.sign {
		width: 100%;
		transition-duration: 0.3s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sign svg {
		width: 25px;
	}

	.sign svg path {
		fill: white;
	}

	.Btn:active {
		transform: translate(2px, 2px);
	}

	.profile-picture {
		width: 50px;
		height: 50px;
		border-radius: 50%;
	}

	.placeholder-icon {
		font-size: 2rem;
	}

	@media (max-width: 768px) {
		.logo {
			width: 150px;
			max-width: 150px;
		}
		.nav-menu a {
			font-size: 2.5rem;
		}
		.nav-items {
			top: 8%;
		}
		.notifications-container {
			padding: 10px 0 0 20px;
		}
		.notifications-modal {
			top: 5rem; /* adjust as needed to align with the bell */
			right: 3em; /* adjust to align with the bell */
		}
	}
</style>
