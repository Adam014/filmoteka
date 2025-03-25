<script>
	export let data = [];
	export let headline;
</script>

{#if headline}
	<h2 class="headline">{headline}</h2>
{/if}

<div class="people-grid">
	{#each data as person}
		<a href={`/person/${person.id}`} class="person-card">
			<div class="card-inner">
				<div class="image-container">
					<img 
						src={person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : '/placeholder-person.jpg'} 
						alt="{person.name}" 
						loading="lazy" 
					/>
					<div class="image-overlay"></div>
				</div>
				<div class="person-info">
					<h3 class="person-name">{person.name}</h3>
					<p class="person-roles">
						{#if person.known_for && person.known_for.length > 0}
							Known for: {person.known_for.map(work => work.title || work.name).slice(0, 2).join(', ')}
							{#if person.known_for.length > 2}...{/if}
						{:else}
							Actor
						{/if}
					</p>
				</div>
				<div class="popularity">
					<span class="popularity-score">{Math.round(person.popularity)}</span>
					<span class="popularity-label">Popularity</span>
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

	.people-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;
		width: 100%;
	}

	.person-card {
		text-decoration: none;
		color: inherit;
		transition: transform 0.3s ease;
		height: 100%;
	}

	.person-card:hover {
		transform: translateY(-10px);
	}

	.card-inner {
		height: 100%;
		background: var(--card-bg, #1e1e1e);
		border-radius: 12px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.3s ease;
		position: relative;
	}

	.person-card:hover .card-inner {
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
	}

	.image-container {
		position: relative;
		overflow: hidden;
		aspect-ratio: 2/3;
	}

	.image-container img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.person-card:hover .image-container img {
		transform: scale(1.05);
	}

	.image-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 50%;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.person-card:hover .image-overlay {
		opacity: 1;
	}

	.person-info {
		padding: 1rem;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.person-name {
		font-size: 1.1rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		transition: color 0.3s ease;
	}

	.person-card:hover .person-name {
		color: var(--primary-color, #3a86ff);
	}

	.person-roles {
		font-size: 0.85rem;
		color: var(--gray-text, #adb5bd);
		margin: 0;
		line-height: 1.4;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.popularity {
		position: absolute;
		top: 10px;
		right: 10px;
		background: var(--accent-color, #8338ec);
		color: white;
		border-radius: 8px;
		padding: 0.3rem 0.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		transition: background-color 0.3s ease, transform 0.3s ease;
	}

	.person-card:hover .popularity {
		background: var(--secondary-color, #ff006e);
		transform: scale(1.05);
	}

	.popularity-score {
		font-weight: bold;
		font-size: 0.9rem;
	}

	.popularity-label {
		font-size: 0.65rem;
		opacity: 0.9;
	}

	/* Responsive adjustments */
	@media (max-width: 1200px) {
		.people-grid {
			grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
			gap: 1.2rem;
		}
		
		.person-name {
			font-size: 1rem;
		}
	}

	@media (max-width: 768px) {
		.headline {
			font-size: 1.5rem;
		}
		
		.people-grid {
			grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
			gap: 1rem;
		}
		
		.person-info {
			padding: 0.8rem;
		}
		
		.person-name {
			font-size: 0.95rem;
			margin-bottom: 0.3rem;
		}
		
		.person-roles {
			font-size: 0.8rem;
		}
		
		.popularity {
			padding: 0.25rem 0.4rem;
		}
		
		.popularity-score {
			font-size: 0.85rem;
		}
		
		.popularity-label {
			font-size: 0.6rem;
		}
	}

	@media (max-width: 480px) {
		.people-grid {
			grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
			gap: 0.8rem;
		}
		
		.person-info {
			padding: 0.6rem;
		}
		
		.person-name {
			font-size: 0.9rem;
		}
	}
</style>
