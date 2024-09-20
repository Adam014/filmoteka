<script>
	import { user } from '../../stores/user';
	import { goto } from '$app/navigation';
	import { onMount, onDestroy } from 'svelte';

	let currentUser;

	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});

	onMount(() => {
		if (!currentUser) {
			goto('/login');
		}
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

{#if currentUser}
	<h1>Your Profile</h1>
	<div class="profile-container">
		{#if currentUser.user_metadata && currentUser.user_metadata.avatar_url}
			<img
				src={currentUser.user_metadata.avatar_url}
				alt="Profile Picture"
				class="profile-picture"
			/>
		{:else}
			<span class="placeholder-icon">👤</span>
		{/if}
		<p>Email: {currentUser.email}</p>
		<p>Username: {currentUser.user_metadata.username || 'Not set'}</p>
		<!-- Add more profile information as needed -->
	</div>
{:else}
	<p>Redirecting to login...</p>
{/if}

<style>
	/* Add your styles here */
	.profile-container {
		/* Styles for the profile container */
	}

	.profile-picture {
		width: 150px;
		height: 150px;
		border-radius: 50%;
		object-fit: cover;
	}

	.placeholder-icon {
		font-size: 5rem;
	}
</style>
