<script>
	export let data;
    export let headline;
</script>

<div>
	<h2>{headline}</h2>
	<div class="people-container">
		{#each data as person, index}
			<a href={'/person/' + person.id}>
				<div class="actor-card" key={index}>
					<div class="actor-info">
						<img src={'https://image.tmdb.org/t/p/w300' + person?.profile_path} alt={person?.name} />
					</div>
					<h3>{person.name}</h3>
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

	.people-container {
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
		.people-container {
			display: grid;
			grid-template-columns: repeat(2, 2fr);
			padding-left: 5px;
		}

		h2 {
			padding-left: 10px;
		}
	}
</style>
