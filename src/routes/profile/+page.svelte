<svelte:head>
	<title>Profile | Filmoteka</title>
</svelte:head>

<script>
	import { user } from '../../stores/user';
	import { goto } from '$app/navigation';
	import Loader from '../../components/Loader.svelte'
	import { onMount, onDestroy } from 'svelte';

	let currentUser;
	
	const unsubscribe = user.subscribe((value) => {
		currentUser = value;
	});
	console.log(currentUser)

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
	<div class="container">
		<h1>Profile</h1>
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
			<div class="profile-details">
				<p>Email: <b>{currentUser.email}</b></p>
				<p>Username: <b>{currentUser.user_metadata.display_name || 'Not set'}</b></p>
				<p>Created at: <b>{currentUser.created_at}</b></p>
				<p>Last sign in: <b>{currentUser.last_sign_in_at}</b></p>
			</div>
		</div>
	</div>
{:else}
	<Loader />
{/if}

<style>
	h1{
		font-size: 4rem;
		padding-bottom: 2rem;
	}

	.container{
		display: grid;
		justify-content: left;
		padding: 2rem 0rem 0rem 3rem
	}

	.profile-picture {
		width: 180px;
		height: 180px;
		border-radius: 50%;
		object-fit: cover;
	}

	p{
		font-size: 1.2rem;
	}

	.profile-details{
		padding-top: 2rem;
	}

	.placeholder-icon {
		font-size: 5rem;
	}

	@media (max-width: 768px){
		.container{
			padding: 0px;
			display: grid;
			justify-content: center;
		}
		p{
			font-size: 1rem;
		}
		.profile-picture{
			width: 100px;
			height: 100px;
		}
		h1{
			font-size: 2.5rem;
		}
	}
</style>
