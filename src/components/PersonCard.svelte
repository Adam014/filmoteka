<script>
	export let person;
</script>

<a href={`/person/${person?.id}`}>
	<div class="actor-card">
		{#if person.profile_path}
			<img
				src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
				alt={person.name}
				class="actor-image"
			/>
		{:else}
			<div class="placeholder-image">No Image</div>
		{/if}
		<div class="actor-info">
			<h3 class="actor-name">{person.id} | {person.name}</h3>
			<p class="actor-role">{person.character}</p>
		</div>
	</div>
</a>

<style>
	a {
		text-decoration: none;
		color: white;
	}

	.actor-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		border-radius: 8px;
		/* background-color: #212121; */
		width: 150px;
	}

	.actor-image {
		width: 100%;
		border-radius: 8px;
	}

	.actor-name {
		font-size: 1rem;
		font-weight: bold;
		margin-top: 0.5rem;
	}

	.actor-role {
		font-size: 0.9rem;
	}

	.placeholder-image {
		width: 100px;
		height: 150px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #ccc;
		color: #fff;
		font-size: 0.9rem;
		border-radius: 8px;
	}
</style>
