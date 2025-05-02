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
	<div class="profile-page">
		<div class="profile-hero">
			<div class="profile-header">
				{#if profileUser.user_metadata?.avatar_url}
					<img src={profileUser.user_metadata.avatar_url} alt="Profile" class="profile-avatar" />
				{:else}
					<div class="profile-avatar-placeholder">
						<span>{profileUser.user_metadata?.display_name?.charAt(0) || '?'}</span>
					</div>
				{/if}
				<div class="profile-info">
					<h1>{profileUser.user_metadata.display_name || 'User'}</h1>
					<div class="profile-stats">
						<div class="stat-item clickable" on:click={openFollowersModal}>
							<span class="stat-value">{followersCount}</span>
							<span class="stat-label">Followers</span>
						</div>
						<div class="stat-divider" />
						<div class="stat-item clickable" on:click={openFollowingModal}>
							<span class="stat-value">{followingCount}</span>
							<span class="stat-label">Following</span>
						</div>
						{#if currentUser && profileUser && profileUser.id !== currentUser.id}
							<div class="follow-action">
								<button class="follow-button" on:click={toggleFollow} disabled={followLoading}>
									{#if followLoading}
										<div class="loading-spinner" />
									{:else}
										{isFollowing ? 'Unfollow' : 'Follow'}
									{/if}
								</button>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<div class="profile-content">
			<div class="profile-details-card">
				<div class="card-header">
					<h2>User Details</h2>
					<div class="title-underline" />
				</div>
				<div class="card-content">
					<div class="info-item">
						<span class="info-label">Username</span>
						<span class="info-value">{profileUser.user_metadata.display_name || 'Not set'}</span>
					</div>
					{#if profileUser.id === currentUser?.id}
						<div class="info-item">
							<span class="info-label">Email</span>
							<span class="info-value">{profileUser.email}</span>
						</div>
						<div class="info-item">
							<span class="info-label">Account Created</span>
							<span class="info-value">{formatDate(profileUser?.created_at)}</span>
						</div>
					{/if}
					<div class="info-item">
						<span class="info-label">Last Sign In</span>
						<span class="info-value">{formatDate(profileUser?.last_sign_in_at)}</span>
					</div>
				</div>
			</div>

			<div class="favorites-container">
				<div class="section-header">
					<h2 class="section-title">Favorite Movies</h2>
					<div class="title-underline" />
				</div>

				{#if favoriteMovies.length > 0}
					<div class="favorite-movies">
						{#each favoriteMovies as movie (movie.id)}
							<MovieCard movie={movie.data} />
						{/each}
					</div>
				{:else}
					<div class="empty-state">
						<div class="empty-icon">🎬</div>
						<p>No favorite movies found</p>
						{#if profileUser.id === currentUser?.id}
							<a href="/library" class="browse-button">Browse Movies</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<div class="user-not-found">
		<div class="error-icon">❓</div>
		<h2>User Not Found</h2>
		<p>The profile you're looking for doesn't exist or you don't have permission to view it.</p>
		<a href="/" class="home-button">Return to Home</a>
	</div>
{/if}

<!-- Followers Modal -->
{#if showFollowersModal}
	<div class="modal-overlay" on:click={() => (showFollowersModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Followers</h2>
				<button class="close-button" on:click={() => (showFollowersModal = false)}>✕</button>
			</div>

			{#if followersList.length > 0}
				<ul class="user-list">
					{#each followersList as user (user.id)}
						<li class="user-item">
							<a href={'/profile/' + user.user_metadata?.display_name} class="user-link">
								{#if user.user_metadata?.avatar_url}
									<img src={user.user_metadata.avatar_url} alt="Avatar" class="user-avatar" />
								{:else}
									<div class="user-avatar-placeholder">
										<span>{user.user_metadata?.display_name?.charAt(0) || '?'}</span>
									</div>
								{/if}
								<span class="user-name">{user.user_metadata?.display_name || 'Unknown'}</span>
							</a>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="empty-list">
					<p>No followers yet</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Following Modal -->
{#if showFollowingModal}
	<div class="modal-overlay" on:click={() => (showFollowingModal = false)}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h2>Following</h2>
				<button class="close-button" on:click={() => (showFollowingModal = false)}>✕</button>
			</div>

			{#if followingList.length > 0}
				<ul class="user-list">
					{#each followingList as user (user.id)}
						<li class="user-item">
							<a href={'/profile/' + user.user_metadata?.display_name} class="user-link">
								{#if user.user_metadata?.avatar_url}
									<img src={user.user_metadata.avatar_url} alt="Avatar" class="user-avatar" />
								{:else}
									<div class="user-avatar-placeholder">
										<span>{user.user_metadata?.display_name?.charAt(0) || '?'}</span>
									</div>
								{/if}
								<span class="user-name">{user.user_metadata?.display_name || 'Unknown'}</span>
							</a>

							<button
								class="unfollow-button"
								on:click|stopPropagation={() => unfollowUser(user.id)}
							>
								Unfollow
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="empty-list">
					<p>Not following anyone yet</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Page Layout */
	.profile-page {
		max-width: 100%;
		overflow-x: hidden;
	}

	/* Profile Hero Section */
	.profile-hero {
		position: relative;
		width: 100vw;
		margin-left: 50%;
		transform: translateX(-50%);
		padding: 3rem 2rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(5px);
	}

	.profile-header {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 2.5rem;
	}

	/* Avatar */
	.profile-avatar {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		object-fit: cover;
		border: 4px solid var(--accent-color);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease, box-shadow 0.3s ease;
	}

	.profile-avatar:hover {
		transform: scale(1.05);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
	}

	.profile-avatar-placeholder {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
		color: white;
		font-size: 4rem;
		font-weight: bold;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
	}

	/* Profile Info */
	.profile-info {
		flex: 1;
	}

	.profile-info h1 {
		font-size: 3rem;
		font-weight: 800;
		margin-bottom: 1rem;
		background: var(--gradient-bg);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
	}

	/* Stats */
	.profile-stats {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-top: 1.5rem;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-value {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--light-text);
	}

	.stat-label {
		font-size: 0.9rem;
		color: var(--gray-text);
		margin-top: 0.25rem;
	}

	.stat-divider {
		height: 40px;
		width: 1px;
		background-color: rgba(255, 255, 255, 0.2);
	}

	.clickable {
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.clickable:hover {
		transform: translateY(-3px);
	}

	/* Follow Button */
	.follow-action {
		margin-left: auto;
	}

	.follow-button {
		background: var(--gradient-bg);
		color: white;
		border: none;
		border-radius: 2rem;
		padding: 0.8rem 1.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 120px;
	}

	.follow-button:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}

	.follow-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Main Content */
	.profile-content {
		max-width: 1400px;
		margin: 3rem auto;
		padding: 0 2rem;
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 2.5rem;
	}

	/* Profile Details Card */
	.profile-details-card {
		background: rgba(20, 20, 20, 0.4);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		height: fit-content;
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.card-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.card-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0 0 0.7rem 0;
	}

	.title-underline {
		height: 4px;
		width: 6rem;
		border-radius: 2px;
		background: var(--gradient-bg);
		position: relative;
		overflow: hidden;
	}

	.title-underline::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shine 3s infinite;
	}

	@keyframes shine {
		0% {
			left: -100%;
		}
		50% {
			left: 100%;
		}
		100% {
			left: 100%;
		}
	}

	.card-content {
		padding: 1.5rem;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		margin-bottom: 1.2rem;
	}

	.info-label {
		font-size: 0.9rem;
		color: var(--gray-text);
		margin-bottom: 0.3rem;
	}

	.info-value {
		font-size: 1.1rem;
		color: var(--light-text);
		font-weight: 500;
	}

	/* Favorites Section */
	.favorites-container {
		width: 100%;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}

	.section-title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.7rem 0;
	}

	.favorite-movies {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1.8rem;
	}

	/* Enhanced Movie Cards */
	.favorite-movies :global(.movie-card) {
		margin: 0;
		width: 100%;
		height: 320px;
		position: relative;
		border-radius: 1.2rem;
		overflow: hidden;
		transition: transform 0.3s ease, box-shadow 0.3s ease;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.favorite-movies :global(.movie-card:hover) {
		transform: translateY(-10px);
		box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
	}

	.favorite-movies :global(.movie-card::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0) 0%,
			rgba(0, 0, 0, 0) 40%,
			rgba(0, 0, 0, 0.8) 100%
		);
		z-index: 1;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.favorite-movies :global(.movie-card:hover::before) {
		opacity: 1;
	}

	.favorite-movies :global(.movie-card a) {
		display: block;
		width: 100%;
		height: 100%;
		position: relative;
		z-index: 1;
	}

	.favorite-movies :global(.movie-card a::after) {
		content: attr(data-title);
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		padding: 1.2rem;
		color: white;
		font-size: 1.1rem;
		font-weight: 600;
		transform: translateY(100%);
		transition: transform 0.3s ease;
		z-index: 2;
	}

	.favorite-movies :global(.movie-card:hover a::after) {
		transform: translateY(0);
	}

	.favorite-movies :global(.movie-image) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.favorite-movies :global(.movie-card:hover .movie-image) {
		transform: scale(1.08);
	}

	.favorite-movies :global(.favorite-icon) {
		position: absolute;
		top: 12px;
		right: 15px;
		font-size: 2.2rem;
		cursor: pointer;
		color: rgba(255, 215, 0, 0.8);
		text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7);
		transition: transform 0.3s ease, color 0.3s ease;
		z-index: 3;
		-webkit-text-stroke: 1px rgba(0, 0, 0, 0.5);
	}

	.favorite-movies :global(.favorite-icon.isFavorite) {
		color: gold;
		transform: scale(1.1);
		text-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
	}

	.favorite-movies :global(.favorite-icon:hover) {
		transform: scale(1.2) rotate(10deg);
		color: gold;
	}

	/* Media query adjustments for movie cards */
	@media (max-width: 768px) {
		.favorite-movies {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 1.2rem;
		}

		.favorite-movies :global(.movie-card) {
			height: 250px;
		}

		.favorite-movies :global(.favorite-icon) {
			font-size: 2rem;
		}

		.favorite-movies :global(.movie-card a::after) {
			padding: 0.8rem;
			font-size: 0.9rem;
		}
	}

	@media (max-width: 576px) {
		.favorite-movies {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 1rem;
		}

		.favorite-movies :global(.movie-card) {
			height: 220px;
		}

		.favorite-movies :global(.favorite-icon) {
			font-size: 1.8rem;
			top: 8px;
			right: 10px;
		}

		.favorite-movies :global(.movie-card a::after) {
			padding: 0.7rem;
			font-size: 0.8rem;
		}
	}

	/* Empty States */
	.empty-state {
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: rgba(20, 20, 20, 0.4);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		text-align: center;
		backdrop-filter: blur(5px);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.empty-state p {
		color: var(--gray-text);
		font-size: 1.2rem;
		margin-bottom: 1.5rem;
	}

	.browse-button {
		background: var(--gradient-bg);
		color: white;
		text-decoration: none;
		padding: 0.7rem 1.5rem;
		border-radius: 2rem;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.browse-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}

	.user-not-found {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
	}

	.error-icon {
		font-size: 5rem;
		margin-bottom: 1rem;
		opacity: 0.7;
	}

	.home-button {
		background: var(--gradient-bg);
		color: white;
		text-decoration: none;
		padding: 0.8rem 1.6rem;
		border-radius: 2rem;
		font-weight: 600;
		margin-top: 1.5rem;
		transition: all 0.3s ease;
	}

	.home-button:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-content {
		background: rgba(20, 20, 20, 0.8);
		background-image: linear-gradient(135deg, rgba(58, 134, 255, 0.1), rgba(131, 56, 236, 0.1));
		border-radius: 1rem;
		width: 100%;
		max-width: 450px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		margin: 0;
	}

	.close-button {
		background: transparent;
		border: none;
		color: var(--gray-text);
		font-size: 1.5rem;
		cursor: pointer;
		transition: color 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.close-button:hover {
		color: var(--light-text);
	}

	.user-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.user-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
		transition: background-color 0.2s ease;
	}

	.user-item:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.user-link {
		display: flex;
		align-items: center;
		gap: 1rem;
		text-decoration: none;
		color: var(--light-text);
		flex: 1;
	}

	.user-avatar {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		object-fit: cover;
	}

	.user-avatar-placeholder {
		width: 45px;
		height: 45px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
		color: white;
		font-weight: bold;
		font-size: 1.2rem;
	}

	.user-name {
		font-size: 1rem;
		font-weight: 500;
	}

	.unfollow-button {
		background: var(--gradient-bg);
		color: white;
		border: none;
		border-radius: 1.5rem;
		padding: 0.4rem 1rem;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.unfollow-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
	}

	.empty-list {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 1.5rem;
		color: var(--gray-text);
	}

	/* Responsive Styles */
	@media (max-width: 1200px) {
		.profile-content {
			grid-template-columns: 300px 1fr;
			gap: 2rem;
		}

		.profile-header {
			gap: 2rem;
		}

		.profile-info h1 {
			font-size: 2.5rem;
		}

		.profile-avatar,
		.profile-avatar-placeholder {
			width: 150px;
			height: 150px;
		}

		.favorite-movies {
			grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		}
	}

	@media (max-width: 992px) {
		.profile-content {
			grid-template-columns: 1fr;
		}

		.profile-details-card {
			max-width: 100%;
		}

		.card-content {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
		}
	}

	@media (max-width: 768px) {
		.profile-hero {
			padding: 2rem 1.5rem;
		}

		.profile-header {
			flex-direction: column;
			text-align: center;
			gap: 1.5rem;
		}

		.profile-info h1 {
			font-size: 2.2rem;
		}

		.profile-stats {
			justify-content: center;
		}

		.card-content {
			grid-template-columns: 1fr;
		}

		.follow-action {
			margin: 1.5rem 0 0;
		}
	}

	@media (max-width: 576px) {
		.profile-hero {
			padding: 1.5rem 1rem;
		}

		.profile-content {
			padding: 0 1rem;
			margin: 2rem auto;
		}

		.profile-info h1 {
			font-size: 1.8rem;
		}

		.profile-avatar,
		.profile-avatar-placeholder {
			width: 120px;
			height: 120px;
		}

		.profile-avatar-placeholder {
			font-size: 2.5rem;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.section-title {
			font-size: 1.5rem;
		}

		.modal-content {
			max-width: 100%;
		}

		.user-item {
			padding: 0.8rem 1rem;
		}

		.user-avatar,
		.user-avatar-placeholder {
			width: 35px;
			height: 35px;
		}

		.user-avatar-placeholder {
			font-size: 1rem;
		}

		.unfollow-button {
			padding: 0.3rem 0.8rem;
			font-size: 0.8rem;
		}
	}
</style>
