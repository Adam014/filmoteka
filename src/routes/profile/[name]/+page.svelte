<script>
	import { supabase } from '../../../lib/db/supabaseClient';
	import Loader from '../../../components/Loader.svelte';
	import MovieCard from '../../../components/MovieCard.svelte';
	import { page } from '$app/stores';
	import { user } from '../../../stores/user';
	import toast from 'svelte-french-toast';
	import { goto } from '$app/navigation';
	import { formatDate } from '../../../lib/utils.js';
	import { onMount, onDestroy } from 'svelte';

	let profileUser = null;
	let currentUser = null; // To track the logged-in user
	let favoriteMovies = [];
	let loading = true;

	// State for follow functionality
	let isFollowing = false;
	let followLoading = false;
	let followersCount = 0;
	let followingCount = 0;

	// State for modals and user lists in modals
	let showFollowersModal = false;
	let showFollowingModal = false;
	let followersList = [];
	let followingList = [];

	// Cache all users for lookup (retrieved from supabase.auth.admin.listUsers)
	let allUsers = [];

	// Subscribe to the user store
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	// Function to fetch profile data
	async function fetchProfileData(name) {
		loading = true;

		try {
			// Fetch all users from Supabase Auth and store in allUsers
			const { data, error } = await supabase.auth.admin.listUsers();
			if (error) {
				console.error('Error fetching users:', error);
				loading = false;
				return;
			}

			allUsers = data?.users || [];

			// Find the user by display name from user_metadata
			profileUser = allUsers.find((user) => user.user_metadata?.display_name === name);

			if (!profileUser) {
				console.error('User not found');
				loading = false;
				return;
			}

			// Fetch follow stats for the profile user
			await fetchFollowStats();

			// If viewing someone else's profile, check follow status
			if (currentUser && profileUser.id !== currentUser.id) {
				await checkFollowStatus();
			}

			// Fetch favorite movies for the profile user
			const { data: files, error: listError } = await supabase.storage
				.from('favorites')
				.list(profileUser.email);

			if (listError) {
				console.error('Error listing favorites:', listError);
				loading = false;
				return;
			}

			if (files.length > 0) {
				const moviePromises = files.map(async (file) => {
					const { data: fileData, error: downloadError } = await supabase.storage
						.from('favorites')
						.download(`${profileUser.email}/${file.name}`);

					if (downloadError) {
						console.error(`Error fetching file ${file.name}:`, downloadError);
						return null;
					}

					if (fileData) {
						const text = await fileData.text();
						try {
							const parsedMovie = JSON.parse(text);
							return parsedMovie; // Ensure this matches what MovieCard expects
						} catch (parseError) {
							console.error(`Error parsing JSON for ${file.name}:`, parseError);
							return null;
						}
					}
				});

				favoriteMovies = (await Promise.all(moviePromises)).filter(Boolean);
			} else {
				console.log('No favorite movies found.');
			}
		} catch (err) {
			console.error('Error in fetchProfileData:', err);
		} finally {
			loading = false;
		}
	}

	// Check if the current user is following the profile user
	async function checkFollowStatus() {
		if (currentUser && profileUser && currentUser.id !== profileUser.id) {
			const { data, error } = await supabase
				.from('follows')
				.select('*')
				.eq('follower_id', currentUser.id)
				.eq('followed_id', profileUser.id);
			if (error) {
				console.error('Error checking follow status:', error);
			} else {
				isFollowing = data && data.length > 0;
			}
		}
	}

	// Fetch follower and following counts for the profile user
	async function fetchFollowStats() {
		if (!profileUser) return;

		// Count followers (users following profileUser)
		const { count: countFollowers, error: errFollowers } = await supabase
			.from('follows')
			.select('*', { count: 'exact', head: true })
			.eq('followed_id', profileUser.id);
		if (errFollowers) {
			console.error('Error counting followers:', errFollowers);
		} else {
			followersCount = countFollowers;
		}

		// Count following (users that profileUser is following)
		const { count: countFollowing, error: errFollowing } = await supabase
			.from('follows')
			.select('*', { count: 'exact', head: true })
			.eq('follower_id', profileUser.id);
		if (errFollowing) {
			console.error('Error counting following:', errFollowing);
		} else {
			followingCount = countFollowing;
		}
	}

	async function unfollowUser(userId) {
		const { data, error } = await supabase
			.from('follows')
			.delete()
			.match({ follower_id: currentUser.id, followed_id: userId });
		if (error) {
			console.error('Error unfollowing user:', error);
			toast.error('Error unfollowing user');
		} else {
			// Update the following list and count
			followingList = followingList.filter((u) => u.id !== userId);
			followingCount = followingCount - 1;
			toast.success('Unfollowed user');
		}
	}

	// Toggle follow/unfollow when the button is clicked
	async function toggleFollow() {
		followLoading = true;
		if (isFollowing) {
			// Unfollow
			const { data, error } = await supabase
				.from('follows')
				.delete()
				.match({ follower_id: currentUser.id, followed_id: profileUser.id });
			if (error) {
				console.error('Error unfollowing user:', error);
			} else {
				isFollowing = false;
			}
		} else {
			// Follow
			const { data, error } = await supabase
				.from('follows')
				.insert([{ follower_id: currentUser.id, followed_id: profileUser.id }]);
			if (error) {
				console.error('Error following user:', error);
			} else {
				isFollowing = true;
			}
		}
		// Update follow stats after toggling
		await fetchFollowStats();
		followLoading = false;
	}

	// Functions to fetch full lists for modals (using allUsers cache)
	async function fetchFollowersList() {
		if (!profileUser) return [];
		const { data: rows, error } = await supabase
			.from('follows')
			.select('*')
			.eq('followed_id', profileUser.id);
		if (error) {
			console.error('Error fetching followers:', error);
			return [];
		}
		const followerIds = rows.map((row) => row.follower_id);
		// Filter our cached users for those in the followerIds
		return allUsers.filter((u) => followerIds.includes(u.id));
	}

	async function fetchFollowingList() {
		if (!profileUser) return [];
		const { data: rows, error } = await supabase
			.from('follows')
			.select('*')
			.eq('follower_id', profileUser.id);
		if (error) {
			console.error('Error fetching following:', error);
			return [];
		}
		const followingIds = rows.map((row) => row.followed_id);
		return allUsers.filter((u) => followingIds.includes(u.id));
	}

	async function openFollowersModal() {
		showFollowersModal = true;
		followersList = await fetchFollowersList();
	}

	async function openFollowingModal() {
		showFollowingModal = true;
		followingList = await fetchFollowingList();
	}

	// Watch for changes in the route params and fetch data
	$: params = $page.params;
	$: if (params.name) {
		fetchProfileData(params.name);
	}

	// Handle user authentication
	onMount(async () => {
		if (!currentUser) {
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (!session?.user) {
				toast.error('You must be logged in to view profile pages.');
				goto('/?page=1');
				return;
			}
			currentUser = session.user;
		}
	});

	onDestroy(() => {
		unsubscribe(); // Clean up subscription
	});
</script>

<svelte:head>
	<title>Profile | {profileUser?.user_metadata?.display_name || 'User'}</title>
</svelte:head>

{#if loading}
	<Loader />
{:else if profileUser}
	<div class="container">
		<div class="profile-container">
			<h1>Profile</h1>
			<div>
				{#if profileUser.user_metadata?.avatar_url}
					<img
						src={profileUser.user_metadata.avatar_url}
						alt="Profile Picture"
						class="profile-picture"
					/>
				{:else}
					<span class="placeholder-icon">👤</span>
				{/if}
				<div class="profile-details">
					<p>Username: <b>{profileUser.user_metadata.display_name || 'Not set'}</b></p>
					{#if profileUser.id === currentUser?.id}
						<p>Email: <b>{profileUser.email}</b></p>
						<p>Created at: <b>{formatDate(profileUser?.created_at)}</b></p>
					{/if}
					<p>Last sign in: <b>{formatDate(profileUser?.last_sign_in_at)}</b></p>
				</div>

				<!-- Follow Stats (clickable) -->
				<div class="follow-stats">
					<span class="clickable" on:click={openFollowersModal}>{followersCount} Followers</span> •
					<span class="clickable" on:click={openFollowingModal}>{followingCount} Following</span>
				</div>

				<!-- Show follow/unfollow button only if this isn't the current user's profile -->
				{#if currentUser && profileUser && profileUser.id !== currentUser.id}
					<button class="follow-button" on:click={toggleFollow} disabled={followLoading}>
						{#if followLoading}
							Loading...
						{:else}
							{isFollowing ? 'Unfollow' : 'Follow'}
						{/if}
					</button>
				{/if}
			</div>
		</div>
		<div class="favorites-container">
			{#if favoriteMovies.length > 0}
				<h2>Favorite Movies ({favoriteMovies.length})</h2>
				<div class="favorite-movies">
					{#each favoriteMovies as movie (movie.id)}
						<MovieCard movie={movie.data} />
					{/each}
				</div>
			{:else}
				<p>No favorite movies found.</p>
			{/if}
		</div>
	</div>
{:else}
	<p>User not found.</p>
{/if}

<!-- Followers Modal -->
{#if showFollowersModal}
	<div class="modal-overlay" on:click={() => (showFollowersModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<h2>Followers</h2>
			{#if followersList.length > 0}
				<ul class="user-list">
					{#each followersList as user (user.id)}
						<a href={'/profile/' + user.user_metadata?.display_name}>
							<li class="user-item">
								{#if user.user_metadata?.avatar_url}
									<img src={user.user_metadata.avatar_url} alt="Avatar" class="user-avatar" />
								{:else}
									<span class="user-placeholder">👤</span>
								{/if}
								<span class="user-name">{user.user_metadata?.display_name || 'Unknown'}</span>
							</li>
						</a>
					{/each}
				</ul>
			{:else}
				<p>Nothing here</p>
			{/if}
		</div>
	</div>
{/if}

<!-- Following Modal -->
{#if showFollowingModal}
	<div class="modal-overlay" on:click={() => (showFollowingModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<h2>Following</h2>
			{#if followingList.length > 0}
				<ul class="user-list">
					{#each followingList as user (user.id)}
						<li class="user-item">
							<a href={'/profile/' + user.user_metadata?.display_name} class="user-link">
								{#if user.user_metadata?.avatar_url}
									<img src={user.user_metadata.avatar_url} alt="Avatar" class="user-avatar" />
								{:else}
									<span class="user-placeholder">👤</span>
								{/if}
								<span class="user-name">{user.user_metadata?.display_name || 'Unknown'}</span>
							</a>
							<!-- New unfollow button added next to each followed user -->
							<button class="unfollow-btn" on:click|stopPropagation={() => unfollowUser(user.id)}
								>Unfollow</button
							>
						</li>
					{/each}
				</ul>
			{:else}
				<p>Nothing here</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.unfollow-btn {
		background: #ff4d4d;
		border: none;
		color: white;
		padding: 0.3rem 0.6rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
		transition: background 0.2s ease;
	}
	.unfollow-btn:hover {
		background: #e60000;
	}

	a {
		text-decoration: none;
		color: white;
		display: flex;
		align-items: center;
	}

	.container {
		display: flex;
		flex-direction: row;
		padding: 2rem 3rem;
		gap: 2rem;
	}

	.profile-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		background-color: #222;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		max-width: 300px;
		text-align: center;
		color: #eee;
	}

	.profile-container h1 {
		font-size: 2.5rem;
		color: #fff;
		margin-bottom: 1.5rem;
	}

	.follow-stats {
		margin-top: 1rem;
		font-size: 0.9rem;
		color: #ccc;
	}
	.follow-stats span {
		margin-right: 0.5rem;
		cursor: pointer;
		transition: color 0.2s ease;
	}
	.follow-stats span:hover {
		color: #fff;
	}

	.follow-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		background-color: #7a1cac;
		color: #fff;
		transition: background-color 0.3s ease;
	}

	.follow-button:hover:not(:disabled) {
		background-color: #a13dc2;
	}

	.follow-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.favorites-container {
		width: 90%;
		background-color: #222;
		height: auto;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.favorite-movies {
		display: flex;
		flex-wrap: wrap;
	}

	.profile-picture {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid #7a1cac;
		margin-bottom: 1.5rem;
		transition: transform 0.3s ease;
	}

	.profile-details {
		font-size: 1rem;
		line-height: 1.6;
		width: 100%;
	}

	.profile-details p {
		margin: 0.5rem 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
	}

	.profile-details p b {
		text-decoration: underline;
		margin-left: 0.5rem;
		white-space: nowrap;
	}

	.placeholder-icon {
		font-size: 6rem;
		color: #555;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.8rem;
	}

	p {
		font-size: 1rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: rgba(0, 0, 0, 0.9);
		border-radius: 10px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		max-height: 80%;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.user-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.user-item {
		display: flex;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
		justify-content: space-between;
	}

	.user-item:last-child {
		border-bottom: none;
	}

	.user-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		margin-right: 1rem;
	}

	.user-placeholder {
		font-size: 1.5rem;
		margin-right: 1rem;
	}

	@media (max-width: 1024px) {
		.container {
			flex-direction: column;
			align-items: center;
			padding: 2rem 1rem;
		}

		.profile-container,
		.favorites-container {
			max-width: 90%;
			width: 100%;
			text-align: center;
		}

		.profile-picture {
			width: 150px;
			height: 150px;
		}

		h1,
		h2 {
			font-size: 2rem;
		}

		p {
			font-size: 0.9rem;
		}
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}

		.favorite-movies {
			justify-content: center;
		}

		.profile-container {
			padding: 1.5rem;
		}

		.profile-container h1 {
			font-size: 2rem;
		}

		.profile-picture {
			width: 120px;
			height: 120px;
		}

		.profile-details {
			font-size: 0.9rem;
		}

		h1,
		h2 {
			font-size: 1.8rem;
		}

		p {
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		.profile-picture {
			width: 100px;
			height: 100px;
		}

		h1,
		h2 {
			font-size: 1.5rem;
		}

		p {
			font-size: 0.8rem;
		}

		.favorite-movies {
			gap: 0.5rem;
		}
	}
</style>
