<script>
	export let users;

	console.log(users);
</script>

<div class="users-container">
	<h2>Users on Filmoteka</h2>
	<div class="users">
		{#each users as user}
			<a href={'/profile/' + user.user_metadata.display_name}>
				<div class="user">
					<div class="user-info">
						{#if user.user_metadata.avatar_url}
							<img src={user.user_metadata.avatar_url} alt="user profile pic" />
						{:else}
							<span class="placeholder-icon">👤</span>
						{/if}
					</div>
					<h3>{user.user_metadata.display_name}</h3>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	a {
		text-decoration: none;
		color: white;
		display: flex;
		align-items: center;
	}

	.users {
		padding: 30px 65px 50px 65px;
		display: flex;
		flex-wrap: wrap;
	}

	.user {
		display: grid;
		justify-content: center;
		padding: 10px 10px;
		text-align: center;
		cursor: pointer;
		align-items: center;
	}

	h2 {
		padding: 40px 0px 10px 65px;
		text-decoration: underline;
	}

	.user-info img {
		height: 10rem;
		width: 10rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.placeholder-icon {
		font-size: 7.5rem;
		color: #555;
		margin-bottom: 1.5rem;
	}

	.user h3 {
		padding-top: 10px;
	}

	@media (max-width: 768px) {
		.users {
			display: grid;
			grid-template-columns: repeat(2, 2fr);
			padding-left: 5px;
		}

		h2 {
			padding-left: 10px;
		}
	}
</style>
