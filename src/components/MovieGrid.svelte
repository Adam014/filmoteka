<script>
	export let data = [];
	export let headline;
	export let isMovie;
</script>

{#if headline}
	<h2 class="headline">{headline}</h2>
{/if}

<div class="card-grid">
	{#each data as item}
		<a href={isMovie ? `/movie/${item.id}` : `/series/${item.id}`} class="card">
			<div class="card-inner">
				<div class="card-front">
					<img
						src={'https://image.tmdb.org/t/p/w300' + item?.poster_path}
						alt="{item.title || item.name} Cover"
						loading="lazy"
					/>
					<div class="card-gradient" />
					{#if item.vote_average > 0}
						<div class="card-rating">{item.vote_average.toFixed(1)}</div>
					{/if}
				</div>
				<div class="info">
					<h3 class="title">{item.title || item.name}</h3>
					<p class="date">{item.release_date || item.first_air_date}</p>
				</div>
			</div>
		</a>
	{/each}
</div>

<style>
	.headline {
		font-size: 1.8rem;
		font-weight: 600;
		margin: 0 0 1.5rem 0;
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1.5rem;
		width: 100%;
	}

	.card {
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		height: 100%;
		transition: transform 0.3s ease;
		position: relative;
	}

	.card:hover {
		transform: translateY(-10px);
	}

	.card-inner {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--card-bg, #1e1e1e);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.3s ease, transform 0.3s ease;
	}

	.card:hover .card-inner {
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
	}

	.card-front {
		position: relative;
		overflow: hidden;
		aspect-ratio: 2/3;
	}

	.card img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.card:hover img {
		transform: scale(1.05);
	}

	.card-gradient {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 50%;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.card:hover .card-gradient {
		opacity: 1;
	}

	.card-rating {
		position: absolute;
		top: 10px;
		right: 10px;
		background: var(--accent-color, #8338ec);
		color: white;
		font-weight: bold;
		font-size: 0.9rem;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		transition: transform 0.3s ease, background-color 0.3s ease;
	}

	.card:hover .card-rating {
		transform: scale(1.1);
		background: var(--secondary-color, #ff006e);
	}

	.info {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.title {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		transition: color 0.3s ease;
	}

	.card:hover .title {
		color: var(--primary-color, #3a86ff);
	}

	.date {
		font-size: 0.85rem;
		margin: 0;
		color: var(--gray-text, #adb5bd);
		opacity: 0.8;
	}

	/* Responsive adjustments */
	@media (max-width: 1200px) {
		.card-grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 1.2rem;
		}
	}

	@media (max-width: 768px) {
		.headline {
			font-size: 1.5rem;
		}

		.card-grid {
			grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
			gap: 1rem;
		}

		.info {
			padding: 0.8rem;
		}

		.title {
			font-size: 0.9rem;
			margin-bottom: 0.3rem;
		}

		.date {
			font-size: 0.8rem;
		}
	}

	@media (max-width: 480px) {
		.card-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 0.8rem;
		}

		.info {
			padding: 0.6rem;
		}

		.card-rating {
			width: 30px;
			height: 30px;
			font-size: 0.8rem;
		}

		.title {
			font-size: 0.85rem;
		}
	}
</style>
