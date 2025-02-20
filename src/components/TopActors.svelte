<script>
	export let actors;
</script>

<div>
	<h2>Top 10 Actors by TMDB</h2>
	<div class="actors-container">
		{#each actors as actor, index}
			<a href={'/person/' + actor.id}>
				<div class="actor-card" key={index}>
					<div class="actor-info">
						<img src={'https://image.tmdb.org/t/p/w300' + actor?.profile_path} alt={actor?.name} />
					</div>
					<h3>{actor.name}</h3>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	a {
		text-decoration: none;
		color: white;
	}

	.actors-container {
		padding: 30px 65px 50px 65px;
		display: flex;
		flex-wrap: wrap;
	}

	h2 {
		padding: 40px 0px 10px 65px;
		text-decoration: underline;
	}

	.actor-info img {
		height: 10rem;
		width: 10rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.actor-card {
		display: grid;
		justify-content: center;
		padding: 10px 10px;
		text-align: center;
		cursor: pointer;
	}

	.actor-card h3 {
		padding-top: 10px;
	}

	@media (max-width: 768px) {
		.actors-container {
			display: grid;
			grid-template-columns: repeat(2, 2fr);
			padding-left: 5px;
		}

		h2 {
			padding-left: 10px;
		}
	}
</style>
